import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { InsightsService } from './insights.service';

@Module({
  controllers: [AssistantController],
  providers: [AssistantService, InsightsService],
  exports: [InsightsService],
})
export class AssistantModule {}
