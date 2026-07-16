import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityAction,
  Prisma,
  Priority,
  Role,
  WorkItemStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';
import { WorkItemQueryDto } from './dto/work-item-query.dto';

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

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    this.assertManager(currentUser);

    await this.ensureItemExists(id);

    await this.prisma.workItem.delete({
      where: {
        id,
      },
    });
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

  private addCalculatedFields<T extends WorkItemWithDueDate>(workItem: T) {
    return {
      ...workItem,
      isOverdue: this.isOverdue(workItem),
    };
  }

  private isOverdue(workItem: WorkItemWithDueDate): boolean {
    const isComplete =
      workItem.status === WorkItemStatus.DONE ||
      workItem.status === WorkItemStatus.CANCELLED;

    return !isComplete && workItem.dueDate < new Date();
  }
}
