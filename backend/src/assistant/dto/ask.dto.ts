import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

/** One earlier turn, replayed so follow-up questions make sense. */
export class ChatTurnDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  // Long enough for a listing answer, short enough that a client cannot
  // smuggle a novel into the prompt at the workspace owner's expense.
  @Length(1, 2000)
  content: string;
}

export class AskDto {
  @ApiProperty({ example: 'How many critical tasks does Rahul have?' })
  @IsString()
  // Capped because every character is billed and forwarded to a third party;
  // a real question about a board fits comfortably.
  @Length(1, 500)
  question: string;

  @ApiPropertyOptional({
    type: [ChatTurnDto],
    description:
      'Earlier turns, oldest first. Sent by the client so the server stays stateless; the newest few are used and the rest ignored.',
  })
  @IsOptional()
  @IsArray()
  // Every turn is re-sent to the model on every question, so the window is
  // capped: without a limit a long conversation quietly multiplies the cost
  // of each new message.
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatTurnDto)
  history?: ChatTurnDto[];
}
