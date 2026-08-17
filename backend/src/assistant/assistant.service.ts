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
import { InsightsService, type TaskFilter } from './insights.service';
import { ASSISTANT_TOOLS, SYSTEM_PROMPT } from './tools';

export interface AskResult {
  answer: string;
  /** Which tools ran, so the UI can show the answer came from real data. */
  usedTools: string[];
}

/** Stops a confused model looping tool calls at the user's expense. */
const MAX_TOOL_ROUNDS = 5;

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
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
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
  async ask(workspaceId: string, question: string): Promise<AskResult> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'The assistant is not configured on this server yet.',
      );
    }

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Today is ${new Date().toISOString().slice(0, 10)}.\n\n${question}`,
      },
    ];
    const usedTools: string[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: ASSISTANT_TOOLS,
        temperature: 0,
      });

      const choice = completion.choices[0]?.message;
      if (!choice) break;
      messages.push(choice);

      const calls = choice.tool_calls ?? [];
      if (calls.length === 0) {
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
      // A count filtered by somebody who is not here would come back as a
      // truthful zero about a person who does not exist. Catch it before the
      // query rather than trusting the model to check.
      if (
        (call.function.name === 'count_tasks' ||
          call.function.name === 'find_tasks') &&
        filter.assigneeId
      ) {
        const unknown = await this.insights.unknownAssignee(
          workspaceId,
          filter.assigneeId,
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
