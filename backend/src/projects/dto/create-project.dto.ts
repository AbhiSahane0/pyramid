import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Design Homepage' })
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.NO_PRIORITY })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ example: '2026-09-12', format: 'date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'User id of the project lead' })
  @IsOptional()
  @IsString()
  leadId?: string;
}
