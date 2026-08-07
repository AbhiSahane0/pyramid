import { Global, Module } from '@nestjs/common';
import { WorkspaceSeedService } from './workspace-seed.service';

@Global()
@Module({
  providers: [WorkspaceSeedService],
  exports: [WorkspaceSeedService],
})
export class SeedModule {}
