import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';
import { IsEmail, IsEnum, IsString, Length } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Design Team' })
  @IsString()
  @Length(1, 100)
  name: string;
}

export class UpdateWorkspaceDto {
  @ApiProperty({ example: 'Design Team' })
  @IsString()
  @Length(1, 100)
  name: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: [WorkspaceRole.ADMIN, WorkspaceRole.MEMBER] })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}

export class CreateInvitationDto {
  @ApiProperty({ example: 'teammate@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    enum: [WorkspaceRole.ADMIN, WorkspaceRole.MEMBER],
    default: WorkspaceRole.MEMBER,
  })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole = WorkspaceRole.MEMBER;
}
