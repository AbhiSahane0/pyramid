import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, Length } from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({ example: 'API design doc' })
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiProperty({ example: 'https://docs.example.com/api-design' })
  @IsUrl({ require_protocol: true })
  url: string;
}
