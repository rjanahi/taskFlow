import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { type AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import { Role } from '../../generated/prisma/client';
import { WorkflowNoteDto } from './dto/workflow-note.dto';
import { WorkflowService } from './workflow.service';
import { WorkflowAction } from './workflow.types';

@Controller('work-items')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post(':id/actions/start')
  @Roles(Role.MEMBER)
  @HttpCode(HttpStatus.OK)
  startWork(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.workflowService.transition(
      id,
      WorkflowAction.START,
      currentUser,
    );
  }

  @Post(':id/actions/submit-review')
  @Roles(Role.MEMBER)
  @HttpCode(HttpStatus.OK)
  submitForReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.workflowService.transition(
      id,
      WorkflowAction.SUBMIT_REVIEW,
      currentUser,
    );
  }

  @Post(':id/actions/accept')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.workflowService.transition(
      id,
      WorkflowAction.ACCEPT,
      currentUser,
    );
  }

  @Post(':id/actions/send-back')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  sendBack(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() workflowNoteDto: WorkflowNoteDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.workflowService.transition(
      id,
      WorkflowAction.SEND_BACK,
      currentUser,
      workflowNoteDto.note,
    );
  }

  @Post(':id/actions/cancel')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() workflowNoteDto: WorkflowNoteDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.workflowService.transition(
      id,
      WorkflowAction.CANCEL,
      currentUser,
      workflowNoteDto.note,
    );
  }

  @Post(':id/actions/reopen')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  reopen(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() workflowNoteDto: WorkflowNoteDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.workflowService.transition(
      id,
      WorkflowAction.REOPEN,
      currentUser,
      workflowNoteDto.note,
    );
  }
}
