import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import {
  InvitationsController,
  WorkspacesController,
} from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  controllers: [WorkspacesController, InvitationsController],
  providers: [WorkspacesService, InvitationsService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
