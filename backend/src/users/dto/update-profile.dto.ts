import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Dexter' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Designer',
    description: 'Job title or role',
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  title?: string;

  @ApiPropertyOptional({
    example: 'Dexuser',
    description: 'One word, like a nickname',
  })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'username may only contain letters, numbers, dots, dashes and underscores',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'Profile picture. Must be an https URL.',
    example: 'https://api.dicebear.com/9.x/bottts/png?seed=dexter',
  })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  avatarUrl?: string;
}
