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

export interface WorkItemAssignmentSummary {
  assignedAt: string;
  member: AuthenticatedUser;
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