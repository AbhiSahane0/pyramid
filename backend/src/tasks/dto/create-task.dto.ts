import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Write API Documentation' })
  @IsString()
  @Length(1, 300)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Board column. Defaults to the leftmost one.',
  })
  @IsOptional()
  @IsString()
  columnId?: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.NO_PRIORITY })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ format: 'date', example: '2026-09-12' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ format: 'date', example: '2026-09-18' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Project this task belongs to' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Parent task id — makes this a subtask' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'User ids assigned to the task',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @ApiPropertyOptional({
    description: 'Label ids to tag the task with',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];

  @ApiPropertyOptional({ description: 'Reporter user id' })
  @IsOptional()
  @IsString()
  reporterId?: string;
}
