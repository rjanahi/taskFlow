import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, WorkItemStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import { WorkItemsService } from '../work-items.service';
import { WORKFLOW_RULES, WorkflowRule } from './workflow.rules';
import { WorkflowAction } from './workflow.types';

const ACTION_LABELS: Record<WorkflowAction, string> = {
  [WorkflowAction.START]: 'start work',
  [WorkflowAction.SUBMIT_REVIEW]: 'submit the item for review',
  [WorkflowAction.ACCEPT]: 'accept the item',
  [WorkflowAction.SEND_BACK]: 'send the item back',
  [WorkflowAction.CANCEL]: 'cancel the item',
  [WorkflowAction.REOPEN]: 'reopen the item',
};

@Injectable()
export class WorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workItemsService: WorkItemsService,
  ) {}

  async transition(
    workItemId: string,
    action: WorkflowAction,
    currentUser: AuthenticatedUser,
    note?: string,
  ) {
    await this.prisma.$transaction(async (transaction) => {
      const workItem = await transaction.workItem.findUnique({
        where: {
          id: workItemId,
        },

        select: {
          id: true,
          status: true,

          assignments: {
            select: {
              memberId: true,
            },
          },
        },
      });

      if (!workItem) {
        throw new NotFoundException('Work item not found');
      }

      const rule = WORKFLOW_RULES[action];

      this.assertRoleAllowed(rule, currentUser);

      this.assertTransitionAllowed(rule, action, workItem.status);

      if (rule.requiresAssignment) {
        this.assertMemberAssigned(currentUser, workItem.assignments);
      }

      const nextStatus = rule.getNextStatus({
        hasAssignees: workItem.assignments.length > 0,
      });

      /*
       * The current status is included in the update
       * condition. If another request changed the status
       * after we read it, this update will affect zero
       * records instead of overwriting the newer status.
       */
      const updateResult = await transaction.workItem.updateMany({
        where: {
          id: workItemId,
          status: workItem.status,
        },

        data: {
          status: nextStatus,
        },
      });

      if (updateResult.count !== 1) {
        throw new ConflictException(
          'The work item changed during this request. Refresh and try again.',
        );
      }

      await transaction.activity.create({
        data: {
          workItemId,
          actorId: currentUser.id,
          action: rule.activityAction,
          fromStatus: workItem.status,
          toStatus: nextStatus,

          details: this.buildActivityDetails(action, note),
        },
      });
    });

    return this.workItemsService.findOne(workItemId, currentUser);
  }

  private assertRoleAllowed(
    rule: WorkflowRule,
    currentUser: AuthenticatedUser,
  ): void {
    if (!rule.allowedRoles.includes(currentUser.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this workflow action',
      );
    }
  }

  private assertTransitionAllowed(
    rule: WorkflowRule,
    action: WorkflowAction,
    currentStatus: WorkItemStatus,
  ): void {
    if (!rule.allowedFromStatuses.includes(currentStatus as never)) {
      const actionLabel = ACTION_LABELS[action];

      throw new ConflictException(
        `Cannot ${actionLabel} while the item is ${currentStatus}`,
      );
    }
  }

  private assertMemberAssigned(
    currentUser: AuthenticatedUser,
    assignments: Array<{
      memberId: string;
    }>,
  ): void {
    if (currentUser.role !== Role.MEMBER) {
      throw new ForbiddenException('This action requires a Member account');
    }

    const isAssigned = assignments.some(
      (assignment) => assignment.memberId === currentUser.id,
    );

    if (!isAssigned) {
      throw new ForbiddenException(
        'Only an assigned Member can perform this action',
      );
    }
  }

  private buildActivityDetails(
    action: WorkflowAction,
    note?: string,
  ): Prisma.InputJsonValue {
    return {
      workflowAction: action,
      ...(note?.trim()
        ? {
            note: note.trim(),
          }
        : {}),
    };
  }
}
