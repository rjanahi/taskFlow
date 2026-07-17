import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow/workflow.controller';
import { WorkflowService } from './workflow/workflow.service';
import { WorkItemsController } from './work-items.controller';
import { WorkItemsService } from './work-items.service';

@Module({
  controllers: [WorkItemsController, WorkflowController],

  providers: [WorkItemsService, WorkflowService],

  exports: [WorkItemsService, WorkflowService],
})
export class WorkItemsModule {}
