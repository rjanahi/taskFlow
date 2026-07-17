import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityAction,
  Prisma,
  Role,
  TimeExtensionStatus,
  WorkItemStatus,
} from '../../generated/prisma/client';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTimeExtensionDto } from './dto/create-time-extension.dto';
import { ReviewTimeExtensionDto } from './dto/review-time-extension.dto';
import { TimeExtensionQueryDto } from './dto/time-extension-query.dto';

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

const timeExtensionRequestSelect = {
  id: true,
  currentDueDate: true,
  proposedDueDate: true,
  reason: true,
  status: true,
  reviewNote: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,

  workItem: {
    select: {
      id: true,
      title: true,
      dueDate: true,
      status: true,
    },
  },

  requestedBy: {
    select: userSummarySelect,
  },

  reviewedBy: {
    select: userSummarySelect,
  },
} satisfies Prisma.TimeExtensionRequestSelect;

@Injectable()
export class TimeExtensionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    workItemId: string,
    createDto: CreateTimeExtensionDto,
    currentUser: AuthenticatedUser,
  ) {
    this.assertMember(currentUser);

    const workItem = await this.prisma.workItem.findFirst({
      where: {
        id: workItemId,

        assignments: {
          some: {
            memberId: currentUser.id,
          },
        },
      },

      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
      },
    });

    /*
     * A Member receives the same response when the
     * item does not exist and when it is not assigned
     * to them. This prevents leaking another item's
     * existence.
     */
    if (!workItem) {
      throw new NotFoundException('Work item not found');
    }

    if (this.isTerminalStatus(workItem.status)) {
      throw new ConflictException(
        'Time extensions cannot be requested for Done or Cancelled items',
      );
    }

    const proposedDueDate = new Date(createDto.proposedDueDate);

    const now = new Date();

    if (proposedDueDate <= now) {
      throw new BadRequestException(
        'The proposed due date must be in the future',
      );
    }

    if (proposedDueDate <= workItem.dueDate) {
      throw new BadRequestException(
        'The proposed due date must be later than the current due date',
      );
    }

    const existingPendingRequest =
      await this.prisma.timeExtensionRequest.findFirst({
        where: {
          workItemId,
          status: TimeExtensionStatus.PENDING,
        },

        select: {
          id: true,
        },
      });

    if (existingPendingRequest) {
      throw new ConflictException(
        'This work item already has a pending time-extension request',
      );
    }

    const reason = createDto.reason.trim();

    return this.prisma.$transaction(async (transaction) => {
      const request = await transaction.timeExtensionRequest.create({
        data: {
          workItemId,
          requestedById: currentUser.id,
          currentDueDate: workItem.dueDate,
          proposedDueDate,
          reason,
          status: TimeExtensionStatus.PENDING,
        },

        select: timeExtensionRequestSelect,
      });

      await transaction.activity.create({
        data: {
          workItemId,
          actorId: currentUser.id,
          action: ActivityAction.TIME_EXTENSION_REQUESTED,

          details: {
            requestId: request.id,
            currentDueDate: workItem.dueDate.toISOString(),
            proposedDueDate: proposedDueDate.toISOString(),
            reason,
          },
        },
      });

      return request;
    });
  }

  async findAll(currentUser: AuthenticatedUser, query: TimeExtensionQueryDto) {
    const where: Prisma.TimeExtensionRequestWhereInput = {};

    if (query.status !== undefined) {
      where.status = query.status;
    }

    /*
     * Managers can see all requests.
     * Members can see only requests that they created.
     */
    if (currentUser.role === Role.MEMBER) {
      where.requestedById = currentUser.id;
    }

    return this.prisma.timeExtensionRequest.findMany({
      where,
      select: timeExtensionRequestSelect,

      orderBy: [
        {
          status: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async approve(
    requestId: string,
    reviewDto: ReviewTimeExtensionDto,
    currentUser: AuthenticatedUser,
  ) {
    this.assertManager(currentUser);

    await this.prisma.$transaction(async (transaction) => {
      const request = await transaction.timeExtensionRequest.findUnique({
        where: {
          id: requestId,
        },

        select: {
          id: true,
          status: true,
          proposedDueDate: true,

          workItem: {
            select: {
              id: true,
              dueDate: true,
              status: true,
            },
          },
        },
      });

      if (!request) {
        throw new NotFoundException('Time-extension request not found');
      }

      this.assertPending(request.status);

      if (this.isTerminalStatus(request.workItem.status)) {
        throw new ConflictException(
          'The due date cannot be extended because the work item is Done or Cancelled',
        );
      }

      /*
       * The item due date could have been edited after
       * the Member submitted the request.
       */
      if (request.proposedDueDate <= request.workItem.dueDate) {
        throw new ConflictException(
          'The proposed due date is no longer later than the current work item due date',
        );
      }

      const reviewNote = reviewDto.note?.trim() || null;

      /*
       * Including PENDING in the update condition
       * prevents two Managers from reviewing the same
       * request successfully at the same time.
       */
      const updateResult = await transaction.timeExtensionRequest.updateMany({
        where: {
          id: requestId,
          status: TimeExtensionStatus.PENDING,
        },

        data: {
          status: TimeExtensionStatus.APPROVED,
          reviewedById: currentUser.id,
          reviewedAt: new Date(),
          reviewNote,
        },
      });

      if (updateResult.count !== 1) {
        throw new ConflictException(
          'This time-extension request has already been reviewed',
        );
      }

      await transaction.workItem.update({
        where: {
          id: request.workItem.id,
        },

        data: {
          dueDate: request.proposedDueDate,
        },
      });

      await transaction.activity.create({
        data: {
          workItemId: request.workItem.id,
          actorId: currentUser.id,
          action: ActivityAction.TIME_EXTENSION_APPROVED,

          details: {
            requestId,
            previousDueDate: request.workItem.dueDate.toISOString(),
            approvedDueDate: request.proposedDueDate.toISOString(),
            ...(reviewNote
              ? {
                  note: reviewNote,
                }
              : {}),
          },
        },
      });
    });

    return this.findOneRequest(requestId);
  }

  async reject(
    requestId: string,
    reviewDto: ReviewTimeExtensionDto,
    currentUser: AuthenticatedUser,
  ) {
    this.assertManager(currentUser);

    await this.prisma.$transaction(async (transaction) => {
      const request = await transaction.timeExtensionRequest.findUnique({
        where: {
          id: requestId,
        },

        select: {
          id: true,
          status: true,
          proposedDueDate: true,

          workItem: {
            select: {
              id: true,
              dueDate: true,
            },
          },
        },
      });

      if (!request) {
        throw new NotFoundException('Time-extension request not found');
      }

      this.assertPending(request.status);

      const reviewNote = reviewDto.note?.trim() || null;

      const updateResult = await transaction.timeExtensionRequest.updateMany({
        where: {
          id: requestId,
          status: TimeExtensionStatus.PENDING,
        },

        data: {
          status: TimeExtensionStatus.REJECTED,
          reviewedById: currentUser.id,
          reviewedAt: new Date(),
          reviewNote,
        },
      });

      if (updateResult.count !== 1) {
        throw new ConflictException(
          'This time-extension request has already been reviewed',
        );
      }

      await transaction.activity.create({
        data: {
          workItemId: request.workItem.id,
          actorId: currentUser.id,
          action: ActivityAction.TIME_EXTENSION_REJECTED,

          details: {
            requestId,
            currentDueDate: request.workItem.dueDate.toISOString(),
            rejectedProposedDueDate: request.proposedDueDate.toISOString(),
            ...(reviewNote
              ? {
                  note: reviewNote,
                }
              : {}),
          },
        },
      });
    });

    return this.findOneRequest(requestId);
  }

  private async findOneRequest(requestId: string) {
    const request = await this.prisma.timeExtensionRequest.findUnique({
      where: {
        id: requestId,
      },

      select: timeExtensionRequestSelect,
    });

    if (!request) {
      throw new NotFoundException('Time-extension request not found');
    }

    return request;
  }

  private assertPending(status: TimeExtensionStatus): void {
    if (status !== TimeExtensionStatus.PENDING) {
      throw new ConflictException(
        'This time-extension request has already been reviewed',
      );
    }
  }

  private assertMember(currentUser: AuthenticatedUser): void {
    if (currentUser.role !== Role.MEMBER) {
      throw new ForbiddenException('Only Members can request more time');
    }
  }

  private assertManager(currentUser: AuthenticatedUser): void {
    if (currentUser.role !== Role.MANAGER) {
      throw new ForbiddenException(
        'Only Managers can review time-extension requests',
      );
    }
  }

  private isTerminalStatus(status: WorkItemStatus): boolean {
    return (
      status === WorkItemStatus.DONE || status === WorkItemStatus.CANCELLED
    );
  }
}
