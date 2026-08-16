import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

/** Drag & drop: drop a task into a column at a fractional position. */
export class MoveTaskDto {
  @ApiProperty({ description: 'Board column the task is dropped into' })
  @IsString()
  columnId: string;

  @ApiProperty({
    example: 1500,
    description: 'Fractional ordering key — midpoint between neighbors',
  })
  @IsNumber()
  position: number;
}
