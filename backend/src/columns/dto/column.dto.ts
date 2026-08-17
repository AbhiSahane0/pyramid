import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { BOARD_COLORS, type BoardColor } from '../board-colors';

export class CreateColumnDto {
  @ApiProperty({ example: 'Blocked' })
  @IsString()
  @Length(1, 30)
  name: string;

  @ApiPropertyOptional({ enum: BOARD_COLORS, default: 'slate' })
  @IsOptional()
  @IsIn(BOARD_COLORS)
  color?: BoardColor;

  @ApiPropertyOptional({
    description: 'Work in this column is finished',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDone?: boolean;
}

export class UpdateColumnDto {
  @ApiPropertyOptional({ example: 'Blocked' })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  name?: string;

  @ApiPropertyOptional({ enum: BOARD_COLORS })
  @IsOptional()
  @IsIn(BOARD_COLORS)
  color?: BoardColor;

  @ApiPropertyOptional({ description: 'Work in this column is finished' })
  @IsOptional()
  @IsBoolean()
  isDone?: boolean;
}

export class ReorderColumnsDto {
  @ApiProperty({
    type: [String],
    description: 'Every column id in the workspace, in the order to display',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  columnIds: string[];
}

export class DeleteColumnDto {
  @ApiPropertyOptional({
    description:
      'Where to put the tasks in this column. Required when it holds any.',
  })
  @IsOptional()
  @IsString()
  moveTasksTo?: string;
}
