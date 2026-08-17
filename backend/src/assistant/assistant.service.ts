import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';
import type { ChatTurnDto } from './dto/ask.dto';
import { InsightsService, type TaskFilter } from './insights.service';
import { ASSISTANT_TOOLS, SYSTEM_PROMPT } from './tools';

export interface AskResult {
  answer: string;
  /** Which tools ran, so the UI can show the answer came from real data. */
  usedTools: string[];
}

/** Stops a confused model looping tool calls at the user's expense. */
const MAX_TOOL_ROUNDS = 5;

/**
 * How much of the conversation is replayed. Enough for "and which of those
 * are overdue?" to resolve, short enough that a long chat does not make every
 * later question progressively more expensive.
 */
const HISTORY_TURNS = 8;

/** A hung provider must not hold a request open indefinitely. */
const REQUEST_TIMEOUT_MS = 30_000;

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly insights: InsightsService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    // Env-gated like the mail service: the app runs fine without a key, it
    // just cannot answer questions, and says so rather than erroring.
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          timeout: REQUEST_TIMEOUT_MS,
          // One retry covers a blip; more turns a slow answer into a very
          // slow one while the user watches a spinner.
          maxRetries: 1,
        })
      : null;
    this.model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    if (!this.client) {
      this.logger.warn(
        'OPENAI_API_KEY is not set — the assistant cannot answer questions',
      );
    }
  }

  get configured(): boolean {
    return this.client !== null;
  }

  /**
   * Answers a question by letting the model call the insight tools until it
   * has what it needs.
   *
   * The loop is the whole design: the model chooses *which* questions to ask
   * the database, the database answers them, and only then does the model
   * write prose. Numbers therefore come from Postgres, and the model's job is
   * reduced to understanding the question and phrasing the result.
   */
  async ask(
    workspaceId: string,
    question: string,
    history: ChatTurnDto[] = [],
  ): Promise<AskResult> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'The assistant is not configured on this server yet.',
      );
    }

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      // Earlier turns carry the thread of the conversation, so "and which of
      // those are overdue?" knows what "those" were. Only the text is
      // replayed — never the tool traffic, which would balloon the prompt for
      // no gain, since anything factual is looked up again anyway.
      ...history.slice(-HISTORY_TURNS).map((turn) => ({
        role: turn.role,
        content: turn.content,
      })),
      {
        role: 'user',
        content: `Today is ${new Date().toISOString().slice(0, 10)}.\n\n${question}`,
      },
    ];
    const usedTools: string[] = [];
    let promptTokens = 0;
    let completionTokens = 0;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const completion = await this.complete(messages);
      promptTokens += completion.usage?.prompt_tokens ?? 0;
      completionTokens += completion.usage?.completion_tokens ?? 0;

      const choice = completion.choices[0]?.message;
      if (!choice) break;
      messages.push(choice);

      const calls = choice.tool_calls ?? [];
      if (calls.length === 0) {
        // Logged rather than returned: the cost of a question is an operator's
        // concern, not something to put in front of the person asking.
        this.logger.log(
          `answered in ${round + 1} round(s), tools=[${usedTools.join(',')}], tokens=${promptTokens}+${completionTokens}`,
        );
        return {
          answer: choice.content?.trim() || "I couldn't work that one out.",
          usedTools,
        };
      }

      for (const call of calls) {
        if (call.type !== 'function') continue;
        usedTools.push(call.function.name);
        const result = await this.runTool(workspaceId, call);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Out of rounds: better to admit it than to let the model guess an answer
    // it never gathered the facts for.
    return {
      answer:
        "I couldn't pin that down — try asking about one thing at a time, like how many tasks someone has open.",
      usedTools,
    };
  }

  /**
   * One call to the provider, with its failures translated.
   *
   * A rejected key, an exhausted quota and a rate limit are all operational
   * facts the person asking cannot fix and should not see as a stack trace —
   * but they are also not the same problem, and telling them apart in the log
   * is the difference between a five-minute fix and an afternoon.
   */
  private async complete(messages: ChatCompletionMessageParam[]) {
    try {
      return await this.client!.chat.completions.create({
        model: this.model,
        messages,
        tools: ASSISTANT_TOOLS,
        temperature: 0,
      });
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        this.logger.error(
          `OpenAI ${error.status ?? '?'} ${error.code ?? ''}: ${error.message}`,
        );
        if (error.status === 401) {
          throw new ServiceUnavailableException(
            'The assistant’s API key was rejected. An administrator needs to check it.',
          );
        }
        if (error.status === 429) {
          throw new ServiceUnavailableException(
            'The assistant is over its usage limit for now. Try again shortly.',
          );
        }
        throw new ServiceUnavailableException(
          'The assistant is having trouble reaching its provider. Try again in a moment.',
        );
      }
      if (error instanceof OpenAI.APIConnectionTimeoutError) {
        this.logger.error('OpenAI request timed out');
        throw new ServiceUnavailableException(
          'That took too long to answer. Try a narrower question.',
        );
      }
      throw error;
    }
  }

  /**
   * Runs one tool call. `workspaceId` comes from the request, never from the
   * model, so no argument it invents can widen the scope.
   */
  private async runTool(
    workspaceId: string,
    call: ChatCompletionMessageToolCall,
  ): Promise<unknown> {
    if (call.type !== 'function') return { error: 'Unsupported tool call' };

    let args: Record<string, unknown> = {};
    try {
      args = call.function.arguments
        ? (JSON.parse(call.function.arguments) as Record<string, unknown>)
        : {};
    } catch {
      return { error: 'Those arguments were not valid JSON.' };
    }

    const filter = args as TaskFilter;

    try {
      // An id that does not exist queries cleanly and returns zero, which
      // reads exactly like a true empty result. Catch it before the query
      // rather than trusting the model to have fetched the id first.
      if (
        call.function.name === 'count_tasks' ||
        call.function.name === 'find_tasks'
      ) {
        const unknown = await this.insights.unknownFilterTarget(
          workspaceId,
          filter,
        );
        if (unknown) return unknown;
      }

      switch (call.function.name) {
        case 'list_columns':
          return await this.insights.columns(workspaceId);
        case 'list_members':
          return await this.insights.members(workspaceId);
        case 'count_tasks':
          return { count: await this.insights.countTasks(workspaceId, filter) };
        case 'find_tasks':
          return await this.insights.findTasks(workspaceId, filter);
        case 'member_workload':
          return await this.insights.workload(workspaceId, {
            open: typeof args.open === 'boolean' ? args.open : true,
          });
        case 'completed_recently':
          return await this.insights.completed(workspaceId, {
            sinceDays: typeof args.sinceDays === 'number' ? args.sinceDays : 7,
            actorId:
              typeof args.actorId === 'string' ? args.actorId : undefined,
          });
        case 'board_overview':
          return await this.insights.overview(workspaceId);
        default:
          return { error: `No such tool: ${call.function.name}` };
      }
    } catch (error) {
      // Hand the failure back as a tool result rather than throwing: the model
      // can say it could not look something up, which beats a 500.
      this.logger.error(`Tool ${call.function.name} failed`, error as Error);
      return { error: 'That lookup failed.' };
    }
  }
}
