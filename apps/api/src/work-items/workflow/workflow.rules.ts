import {
  ActivityAction,
  Role,
  WorkItemStatus,
} from '../../generated/prisma/client';
import { WorkflowAction } from './workflow.types';

interface NextStatusContext {
  hasAssignees: boolean;
}

export interface WorkflowRule {
  allowedRoles: Role[];
  allowedFromStatuses: WorkItemStatus[];
  activityAction: ActivityAction;
  requiresAssignment?: boolean;

  getNextStatus(context: NextStatusContext): WorkItemStatus;
}

export const WORKFLOW_RULES: Record<WorkflowAction, WorkflowRule> = {
  [WorkflowAction.START]: {
    allowedRoles: [Role.MEMBER],
    allowedFromStatuses: [WorkItemStatus.ASSIGNED],
    activityAction: ActivityAction.WORK_STARTED,
    requiresAssignment: true,

    getNextStatus: () => WorkItemStatus.IN_PROGRESS,
  },

  [WorkflowAction.SUBMIT_REVIEW]: {
    allowedRoles: [Role.MEMBER],
    allowedFromStatuses: [WorkItemStatus.IN_PROGRESS],
    activityAction: ActivityAction.SUBMITTED_FOR_REVIEW,
    requiresAssignment: true,

    getNextStatus: () => WorkItemStatus.IN_REVIEW,
  },

  [WorkflowAction.ACCEPT]: {
    allowedRoles: [Role.MANAGER],
    allowedFromStatuses: [WorkItemStatus.IN_REVIEW],
    activityAction: ActivityAction.REVIEW_ACCEPTED,

    getNextStatus: () => WorkItemStatus.DONE,
  },

  [WorkflowAction.SEND_BACK]: {
    allowedRoles: [Role.MANAGER],
    allowedFromStatuses: [WorkItemStatus.IN_REVIEW],
    activityAction: ActivityAction.SENT_BACK,

    getNextStatus: () => WorkItemStatus.IN_PROGRESS,
  },

  [WorkflowAction.CANCEL]: {
    allowedRoles: [Role.MANAGER],
    allowedFromStatuses: [
      WorkItemStatus.BACKLOG,
      WorkItemStatus.ASSIGNED,
      WorkItemStatus.IN_PROGRESS,
      WorkItemStatus.IN_REVIEW,
    ],
    activityAction: ActivityAction.ITEM_CANCELLED,

    getNextStatus: () => WorkItemStatus.CANCELLED,
  },

  [WorkflowAction.REOPEN]: {
    allowedRoles: [Role.MANAGER],
    allowedFromStatuses: [WorkItemStatus.DONE, WorkItemStatus.CANCELLED],
    activityAction: ActivityAction.ITEM_REOPENED,

    getNextStatus: ({ hasAssignees }) =>
      hasAssignees ? WorkItemStatus.ASSIGNED : WorkItemStatus.BACKLOG,
  },
};
