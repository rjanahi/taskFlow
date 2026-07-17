import { Module } from '@nestjs/common';
import { TimeExtensionsController } from './time-extensions/time-extensions.controller';
import { TimeExtensionsService } from './time-extensions/time-extensions.service';
import { WorkflowController } from './workflow/workflow.controller';
import { WorkflowService } from './workflow/workflow.service';
import { WorkItemsController } from './work-items.controller';
import { WorkItemsService } from './work-items.service';

@Module({
  controllers: [
    WorkItemsController,
    WorkflowController,
    TimeExtensionsController,
  ],

  providers: [WorkItemsService, WorkflowService, TimeExtensionsService],

  exports: [WorkItemsService, WorkflowService, TimeExtensionsService],
})
export class WorkItemsModule {}
