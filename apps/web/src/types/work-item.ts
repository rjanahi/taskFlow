import { AuthenticatedUser } from './auth';

export type WorkItemStatus =
  | 'BACKLOG'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE'
  | 'CANCELLED';

export type Priority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT';

export type ActivityAction =
  | 'ITEM_CREATED'
  | 'ITEM_UPDATED'
  | 'MEMBERS_ASSIGNED'
  | 'MEMBERS_REASSIGNED'
  | 'MEMBERS_REMOVED'
  | 'WORK_STARTED'
  | 'SUBMITTED_FOR_REVIEW'
  | 'REVIEW_ACCEPTED'
  | 'SENT_BACK'
  | 'ITEM_CANCELLED'
  | 'ITEM_REOPENED'
  | 'STATUS_CHANGED'
  | 'TIME_EXTENSION_REQUESTED'
  | 'TIME_EXTENSION_APPROVED'
  | 'TIME_EXTENSION_REJECTED'
  | 'ATTACHMENT_ADDED'
  | 'ATTACHMENT_REPLACED'
  | 'ATTACHMENT_REMOVED'
  | 'RETURNED_TO_BACKLOG';

export type TimeExtensionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type WorkflowAction =
  | 'start'
  | 'submit-review'
  | 'accept'
  | 'send-back'
  | 'cancel'
  | 'reopen';

export interface WorkItemAssignmentSummary {
  assignedAt: string;
  member: AuthenticatedUser;
}

export interface WorkItemAssignmentDetail
  extends WorkItemAssignmentSummary {
  assignedBy: AuthenticatedUser;
}

export interface AttachmentSummary {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  fileUrl: string;
}

export interface Activity {
  id: string;
  action: ActivityAction;
  fromStatus: WorkItemStatus | null;
  toStatus: WorkItemStatus | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  actor: AuthenticatedUser | null;
}

export interface TimeExtensionRequest {
  id: string;
  currentDueDate: string;
  proposedDueDate: string;
  reason: string;
  status: TimeExtensionStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requestedBy: AuthenticatedUser;
  reviewedBy: AuthenticatedUser | null;
}

export interface WorkItemSummary {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  dueDate: string;
  status: WorkItemStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: AuthenticatedUser;
  assignments: WorkItemAssignmentSummary[];
  attachment: AttachmentSummary | null;
  isOverdue: boolean;
}

export interface WorkItemDetail
  extends Omit<WorkItemSummary, 'assignments'> {
  assignments: WorkItemAssignmentDetail[];
  activities: Activity[];
  timeExtensionRequests: TimeExtensionRequest[];
}

export interface WorkItemFilters {
  status?: WorkItemStatus;
  priority?: Priority;
  assigneeId?: string;
}

export interface CreateWorkItemInput {
  title: string;
  description: string;
  priority: Priority;
  category: string;
  dueDate: string;
}

export type UpdateWorkItemInput =
  Partial<CreateWorkItemInput>;

export interface CreateTimeExtensionInput {
  proposedDueDate: string;
  reason: string;
}