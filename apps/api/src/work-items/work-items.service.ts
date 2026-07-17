import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import {
  ActivityAction,
  Prisma,
  Role,
  WorkItemStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import {
  ATTACHMENT_EXTENSION_BY_MIME_TYPE,
  ATTACHMENT_STORAGE_DIRECTORY,
} from './attachments.constants';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { WorkItemQueryDto } from './dto/work-item-query.dto';
import { AssignWorkItemDto } from './dto/assign-work-item.dto';

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

const attachmentSummarySelect = {
  id: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AttachmentSelect;

const workItemListSelect = {
  id: true,
  title: true,
  description: true,
  priority: true,
  category: true,
  dueDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,

  createdBy: {
    select: userSummarySelect,
  },

  assignments: {
    orderBy: {
      assignedAt: 'asc',
    },
    select: {
      assignedAt: true,
      member: {
        select: userSummarySelect,
      },
    },
  },

  attachment: {
    select: attachmentSummarySelect,
  },
} satisfies Prisma.WorkItemSelect;

const workItemDetailSelect = {
  ...workItemListSelect,

  assignments: {
    orderBy: {
      assignedAt: 'asc',
    },
    select: {
      assignedAt: true,

      member: {
        select: userSummarySelect,
      },

      assignedBy: {
        select: userSummarySelect,
      },
    },
  },

  activities: {
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      action: true,
      fromStatus: true,
      toStatus: true,
      details: true,
      createdAt: true,

      actor: {
        select: userSummarySelect,
      },
    },
  },

  timeExtensionRequests: {
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      currentDueDate: true,
      proposedDueDate: true,
      reason: true,
      status: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,

      requestedBy: {
        select: userSummarySelect,
      },

      reviewedBy: {
        select: userSummarySelect,
      },
    },
  },
} satisfies Prisma.WorkItemSelect;

type WorkItemWithDueDate = {
  dueDate: Date;
  status: WorkItemStatus;
};

type WorkItemForResponse = WorkItemWithDueDate & {
  id: string;

  attachment: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

interface AttachmentFile {
  absolutePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

@Injectable()
export class WorkItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createWorkItemDto: CreateWorkItemDto,
    currentUser: AuthenticatedUser,
  ) {
    this.assertManager(currentUser);

    const workItem = await this.prisma.workItem.create({
      data: {
        title: createWorkItemDto.title.trim(),
        description: createWorkItemDto.description.trim(),
        category: createWorkItemDto.category.trim(),
        priority: createWorkItemDto.priority,
        dueDate: new Date(createWorkItemDto.dueDate),
        status: WorkItemStatus.BACKLOG,
        createdById: currentUser.id,

        activities: {
          create: {
            action: ActivityAction.ITEM_CREATED,
            toStatus: WorkItemStatus.BACKLOG,

            actor: {
              connect: {
                id: currentUser.id,
              },
            },

            details: {
              message: 'Work item created',
            },
          },
        },
      },
      select: workItemDetailSelect,
    });

    return this.addCalculatedFields(workItem);
  }

  async findAll(currentUser: AuthenticatedUser, query: WorkItemQueryDto) {
    if (currentUser.role === Role.MEMBER && query.assigneeId !== undefined) {
      throw new ForbiddenException('Only managers can filter by assignee');
    }

    const where = this.buildWorkItemFilter(currentUser, query);

    const workItems = await this.prisma.workItem.findMany({
      where,
      select: workItemListSelect,
      orderBy: [
        {
          dueDate: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return workItems.map((workItem) => this.addCalculatedFields(workItem));
  }

  async findOne(id: string, currentUser: AuthenticatedUser) {
    const where = this.buildAccessibleItemFilter(id, currentUser);

    const workItem = await this.prisma.workItem.findFirst({
      where,
      select: workItemDetailSelect,
    });

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    return this.addCalculatedFields(workItem);
  }

  async update(
    id: string,
    updateWorkItemDto: UpdateWorkItemDto,
    currentUser: AuthenticatedUser,
  ) {
    this.assertManager(currentUser);

    const changedFields = Object.keys(updateWorkItemDto);

    if (changedFields.length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    await this.ensureItemExists(id);

    const data: Prisma.WorkItemUpdateInput = {
      activities: {
        create: {
          action: ActivityAction.ITEM_UPDATED,

          actor: {
            connect: {
              id: currentUser.id,
            },
          },

          details: {
            changedFields,
          },
        },
      },
    };

    if (updateWorkItemDto.title !== undefined) {
      data.title = updateWorkItemDto.title.trim();
    }

    if (updateWorkItemDto.description !== undefined) {
      data.description = updateWorkItemDto.description.trim();
    }

    if (updateWorkItemDto.priority !== undefined) {
      data.priority = updateWorkItemDto.priority;
    }

    if (updateWorkItemDto.category !== undefined) {
      data.category = updateWorkItemDto.category.trim();
    }

    if (updateWorkItemDto.dueDate !== undefined) {
      data.dueDate = new Date(updateWorkItemDto.dueDate);
    }

    const workItem = await this.prisma.workItem.update({
      where: {
        id,
      },
      data,
      select: workItemDetailSelect,
    });

    return this.addCalculatedFields(workItem);
  }

  async assignMembers(
    id: string,
    assignWorkItemDto: AssignWorkItemDto,
    currentUser: AuthenticatedUser,
  ) {
    this.assertManager(currentUser);

    const workItem = await this.prisma.workItem.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        status: true,

        assignments: {
          select: {
            memberId: true,

            member: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    const requestedMemberIds = assignWorkItemDto.memberIds;

    const requestedMembers =
      requestedMemberIds.length === 0
        ? []
        : await this.prisma.user.findMany({
            where: {
              id: {
                in: requestedMemberIds,
              },

              role: Role.MEMBER,
            },

            select: {
              id: true,
              name: true,
              email: true,
            },
          });

    if (requestedMembers.length !== requestedMemberIds.length) {
      throw new BadRequestException(
        'Every assignee must be an existing Member',
      );
    }

    const currentMemberIds = workItem.assignments.map(
      (assignment) => assignment.memberId,
    );

    const currentMemberIdSet = new Set(currentMemberIds);

    const requestedMemberIdSet = new Set(requestedMemberIds);

    const addedMemberIds = requestedMemberIds.filter(
      (memberId) => !currentMemberIdSet.has(memberId),
    );

    const removedMemberIds = currentMemberIds.filter(
      (memberId) => !requestedMemberIdSet.has(memberId),
    );

    if (addedMemberIds.length === 0 && removedMemberIds.length === 0) {
      throw new BadRequestException('The assignee list is unchanged');
    }

    const nextStatus = this.calculateAssignmentStatus(
      workItem.status,
      requestedMemberIds.length,
    );

    const assignmentAction = this.getAssignmentActivityAction(
      currentMemberIds.length,
      requestedMemberIds.length,
    );

    const memberById = new Map(
      requestedMembers.map((member) => [member.id, member]),
    );

    const previousMemberNames = workItem.assignments.map(
      (assignment) => assignment.member.name,
    );

    const newMemberNames = requestedMemberIds.map(
      (memberId) => memberById.get(memberId)?.name ?? memberId,
    );

    const addedMemberNames = addedMemberIds.map(
      (memberId) => memberById.get(memberId)?.name ?? memberId,
    );

    const removedMemberNames = workItem.assignments
      .filter((assignment) => removedMemberIds.includes(assignment.memberId))
      .map((assignment) => assignment.member.name);

    const returnedToBacklog =
      nextStatus === WorkItemStatus.BACKLOG &&
      workItem.status !== WorkItemStatus.BACKLOG;

    await this.prisma.$transaction(async (transaction) => {
      if (removedMemberIds.length > 0) {
        await transaction.workItemAssignment.deleteMany({
          where: {
            workItemId: id,

            memberId: {
              in: removedMemberIds,
            },
          },
        });
      }

      if (addedMemberIds.length > 0) {
        await transaction.workItemAssignment.createMany({
          data: addedMemberIds.map((memberId) => ({
            workItemId: id,
            memberId,
            assignedById: currentUser.id,
          })),
        });
      }

      if (nextStatus !== workItem.status) {
        await transaction.workItem.update({
          where: {
            id,
          },

          data: {
            status: nextStatus,
          },
        });
      }

      await transaction.activity.create({
        data: {
          workItemId: id,
          actorId: currentUser.id,
          action: assignmentAction,

          fromStatus:
            nextStatus !== workItem.status ? workItem.status : undefined,

          toStatus: nextStatus !== workItem.status ? nextStatus : undefined,

          details: {
            previousMemberIds: currentMemberIds,
            previousMemberNames,
            newMemberIds: requestedMemberIds,
            newMemberNames,
            addedMemberIds,
            addedMemberNames,
            removedMemberIds,
            removedMemberNames,
          },
        },
      });

      if (returnedToBacklog) {
        await transaction.activity.create({
          data: {
            workItemId: id,
            actorId: null,
            action: ActivityAction.RETURNED_TO_BACKLOG,
            fromStatus: workItem.status,
            toStatus: WorkItemStatus.BACKLOG,

            details: {
              reason:
                'The item was automatically returned to Backlog because all assignees were removed',
            },
          },
        });
      }
    });

    const updatedWorkItem = await this.prisma.workItem.findUnique({
      where: {
        id,
      },
      select: workItemDetailSelect,
    });

    if (!updatedWorkItem) {
      throw new NotFoundException('Work item not found');
    }

    return this.addCalculatedFields(updatedWorkItem);
  }

  async uploadAttachment(
    id: string,
    file: Express.Multer.File,
    currentUser: AuthenticatedUser,
  ) {
    this.assertManager(currentUser);

    const workItem = await this.prisma.workItem.findUnique({
      where: {
        id,
      },
      select: {
        id: true,

        attachment: {
          select: {
            storagePath: true,
          },
        },
      },
    });

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    const extension = ATTACHMENT_EXTENSION_BY_MIME_TYPE[file.mimetype];

    if (!extension) {
      throw new BadRequestException(
        'Only JPEG, PNG and WebP images are allowed',
      );
    }

    await mkdir(ATTACHMENT_STORAGE_DIRECTORY, {
      recursive: true,
    });

    const storedName = `${randomUUID()}.${extension}`;

    const absolutePath = join(ATTACHMENT_STORAGE_DIRECTORY, storedName);

    const storagePath = relative(process.cwd(), absolutePath);

    await writeFile(absolutePath, file.buffer, {
      flag: 'wx',
    });

    try {
      const attachment = await this.prisma.$transaction(async (transaction) => {
        const savedAttachment = await transaction.attachment.upsert({
          where: {
            workItemId: id,
          },

          create: {
            originalName: file.originalname,
            storedName,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            storagePath,
            workItemId: id,
            uploadedById: currentUser.id,
          },

          update: {
            originalName: file.originalname,
            storedName,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            storagePath,
            uploadedById: currentUser.id,
          },

          select: attachmentSummarySelect,
        });

        await transaction.activity.create({
          data: {
            workItemId: id,
            actorId: currentUser.id,

            action: workItem.attachment
              ? ActivityAction.ATTACHMENT_REPLACED
              : ActivityAction.ATTACHMENT_ADDED,

            details: {
              originalName: file.originalname,
              mimeType: file.mimetype,
              sizeBytes: file.size,
            },
          },
        });

        return savedAttachment;
      });

      if (workItem.attachment) {
        const previousAbsolutePath = this.resolveAttachmentPath(
          workItem.attachment.storagePath,
        );

        await this.safeUnlink(previousAbsolutePath);
      }

      return {
        ...attachment,
        fileUrl: `/api/work-items/${id}/attachment`,
      };
    } catch (error: unknown) {
      await this.safeUnlink(absolutePath);
      throw error;
    }
  }

  async getAttachmentFile(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<AttachmentFile> {
    const workItem = await this.prisma.workItem.findFirst({
      where: this.buildAccessibleItemFilter(id, currentUser),

      select: {
        attachment: {
          select: {
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            storagePath: true,
          },
        },
      },
    });

    if (!workItem?.attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const absolutePath = this.resolveAttachmentPath(
      workItem.attachment.storagePath,
    );

    try {
      await access(absolutePath);
    } catch (error: unknown) {
      if (this.getNodeErrorCode(error) === 'ENOENT') {
        throw new NotFoundException('Attachment file not found');
      }

      throw new InternalServerErrorException(
        'The attachment could not be accessed',
      );
    }

    return {
      absolutePath,
      originalName: workItem.attachment.originalName,
      mimeType: workItem.attachment.mimeType,
      sizeBytes: workItem.attachment.sizeBytes,
    };
  }

  async removeAttachment(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    this.assertManager(currentUser);

    const workItem = await this.prisma.workItem.findUnique({
      where: {
        id,
      },

      select: {
        id: true,

        attachment: {
          select: {
            originalName: true,
            storagePath: true,
          },
        },
      },
    });

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    if (!workItem.attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.attachment.delete({
        where: {
          workItemId: id,
        },
      });

      await transaction.activity.create({
        data: {
          workItemId: id,
          actorId: currentUser.id,
          action: ActivityAction.ATTACHMENT_REMOVED,

          details: {
            originalName: workItem.attachment?.originalName,
          },
        },
      });
    });

    const absolutePath = this.resolveAttachmentPath(
      workItem.attachment.storagePath,
    );

    await this.safeUnlink(absolutePath);
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    this.assertManager(currentUser);

    const workItem = await this.prisma.workItem.findUnique({
      where: {
        id,
      },

      select: {
        id: true,

        attachment: {
          select: {
            storagePath: true,
          },
        },
      },
    });

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    await this.prisma.workItem.delete({
      where: {
        id,
      },
    });

    if (workItem.attachment) {
      const absolutePath = this.resolveAttachmentPath(
        workItem.attachment.storagePath,
      );

      await this.safeUnlink(absolutePath);
    }
  }

  // HELPERS
  private calculateAssignmentStatus(
    currentStatus: WorkItemStatus,
    assigneeCount: number,
  ): WorkItemStatus {
    if (currentStatus === WorkItemStatus.BACKLOG && assigneeCount > 0) {
      return WorkItemStatus.ASSIGNED;
    }

    if (this.isActiveAssignedStatus(currentStatus) && assigneeCount === 0) {
      return WorkItemStatus.BACKLOG;
    }

    return currentStatus;
  }

  private isActiveAssignedStatus(status: WorkItemStatus): boolean {
    const statusesWithAssignments: WorkItemStatus[] = [
      WorkItemStatus.ASSIGNED,
      WorkItemStatus.IN_PROGRESS,
      WorkItemStatus.IN_REVIEW,
    ];

    return statusesWithAssignments.includes(status);
  }

  private getAssignmentActivityAction(
    previousCount: number,
    nextCount: number,
  ): ActivityAction {
    if (previousCount === 0 && nextCount > 0) {
      return ActivityAction.MEMBERS_ASSIGNED;
    }

    if (nextCount === 0) {
      return ActivityAction.MEMBERS_REMOVED;
    }

    return ActivityAction.MEMBERS_REASSIGNED;
  }

  private buildWorkItemFilter(
    currentUser: AuthenticatedUser,
    query: WorkItemQueryDto,
  ): Prisma.WorkItemWhereInput {
    const filters: Prisma.WorkItemWhereInput[] = [];

    if (query.status !== undefined) {
      filters.push({
        status: query.status,
      });
    }

    if (query.priority !== undefined) {
      filters.push({
        priority: query.priority,
      });
    }

    if (currentUser.role === Role.MANAGER && query.assigneeId !== undefined) {
      filters.push({
        assignments: {
          some: {
            memberId: query.assigneeId,
          },
        },
      });
    }

    if (currentUser.role === Role.MEMBER) {
      filters.push({
        assignments: {
          some: {
            memberId: currentUser.id,
          },
        },
      });
    }

    if (filters.length === 0) {
      return {};
    }

    return {
      AND: filters,
    };
  }

  private buildAccessibleItemFilter(
    id: string,
    currentUser: AuthenticatedUser,
  ): Prisma.WorkItemWhereInput {
    if (currentUser.role === Role.MANAGER) {
      return {
        id,
      };
    }

    return {
      id,

      assignments: {
        some: {
          memberId: currentUser.id,
        },
      },
    };
  }

  private async ensureItemExists(id: string): Promise<void> {
    const workItem = await this.prisma.workItem.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }
  }

  private assertManager(currentUser: AuthenticatedUser): void {
    if (currentUser.role !== Role.MANAGER) {
      throw new ForbiddenException('Only managers can perform this action');
    }
  }

  private addCalculatedFields<T extends WorkItemForResponse>(workItem: T) {
    return {
      ...workItem,

      attachment: workItem.attachment
        ? {
            ...workItem.attachment,
            fileUrl: `/api/work-items/${workItem.id}/attachment`,
          }
        : null,

      isOverdue: this.isOverdue(workItem),
    };
  }

  private isOverdue(workItem: WorkItemWithDueDate): boolean {
    const isComplete =
      workItem.status === WorkItemStatus.DONE ||
      workItem.status === WorkItemStatus.CANCELLED;

    return !isComplete && workItem.dueDate < new Date();
  }

  private resolveAttachmentPath(storagePath: string): string {
    const storageRoot = resolve(ATTACHMENT_STORAGE_DIRECTORY);

    const absolutePath = resolve(process.cwd(), storagePath);

    const isInsideStorage = absolutePath.startsWith(`${storageRoot}${sep}`);

    if (!isInsideStorage) {
      throw new InternalServerErrorException('Invalid attachment storage path');
    }

    return absolutePath;
  }

  private async safeUnlink(absolutePath: string): Promise<void> {
    try {
      await unlink(absolutePath);
    } catch (error: unknown) {
      if (this.getNodeErrorCode(error) === 'ENOENT') {
        return;
      }

      console.warn(`Unable to delete attachment file: ${absolutePath}`, error);
    }
  }

  private getNodeErrorCode(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (
        error as {
          code?: unknown;
        }
      ).code;

      return typeof code === 'string' ? code : undefined;
    }

    return undefined;
  }
}
