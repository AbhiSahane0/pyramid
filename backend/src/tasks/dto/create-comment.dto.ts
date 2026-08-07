import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Looks good — ready for review.' })
  @IsString()
  @Length(1, 2000)
  body: string;

  @ApiPropertyOptional({ description: 'Comment id being replied to' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
