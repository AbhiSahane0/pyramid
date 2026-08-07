import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { IsEnum, IsNumber } from 'class-validator';

/** Drag & drop: drop a task into a column at a fractional position. */
export class MoveTaskDto {
  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiProperty({
    example: 1500,
    description: 'Fractional ordering key — midpoint between neighbors',
  })
  @IsNumber()
  position: number;
}
