import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class AskDto {
  @ApiProperty({ example: 'How many critical tasks does Rahul have?' })
  @IsString()
  // Capped because every character is billed and forwarded to a third party;
  // a real question about a board fits comfortably.
  @Length(1, 500)
  question: string;
}
