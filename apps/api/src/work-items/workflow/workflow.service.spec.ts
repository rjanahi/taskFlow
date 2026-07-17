import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  ActivityAction,
  Role,
  WorkItemStatus,
} from '../../generated/prisma/client';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkItemsService } from '../work-items.service';
import { WorkflowService } from './workflow.service';
import { WorkflowAction } from './workflow.types';

interface TransactionMock {
  workItem: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };

  activity: {
    create: jest.Mock;
  };
}

describe('WorkflowService', () => {
  let service: WorkflowService;

  let transactionMock: TransactionMock;

  let prismaMock: {
    $transaction: jest.Mock;
  };

  let workItemsServiceMock: {
    findOne: jest.Mock;
  };

  const member: AuthenticatedUser = {
    id: 'member-1',
    name: 'Test Member',
    email: 'member@test.local',
    role: Role.MEMBER,
  };

  const manager: AuthenticatedUser = {
    id: 'manager-1',
    name: 'Test Manager',
    email: 'manager@test.local',
    role: Role.MANAGER,
  };

  beforeEach(() => {
    transactionMock = {
      workItem: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },

      activity: {
        create: jest.fn(),
      },
    };

    prismaMock = {
      $transaction: jest.fn(
        async (callback: (transaction: TransactionMock) => Promise<unknown>) =>
          callback(transactionMock),
      ),
    };

    workItemsServiceMock = {
      findOne: jest.fn(),
    };

    service = new WorkflowService(
      prismaMock as unknown as PrismaService,
      workItemsServiceMock as unknown as WorkItemsService,
    );
  });

  it('allows an assigned Member to start work', async () => {
    transactionMock.workItem.findUnique.mockResolvedValue({
      id: 'item-1',
      status: WorkItemStatus.ASSIGNED,
      assignments: [
        {
          memberId: member.id,
        },
      ],
    });

    transactionMock.workItem.updateMany.mockResolvedValue({
      count: 1,
    });

    transactionMock.activity.create.mockResolvedValue({});

    workItemsServiceMock.findOne.mockResolvedValue({
      id: 'item-1',
      status: WorkItemStatus.IN_PROGRESS,
    });

    const result = await service.transition(
      'item-1',
      WorkflowAction.START,
      member,
    );

    expect(transactionMock.workItem.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'item-1',
        status: WorkItemStatus.ASSIGNED,
      },

      data: {
        status: WorkItemStatus.IN_PROGRESS,
      },
    });

    expect(transactionMock.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workItemId: 'item-1',
        actorId: member.id,
        action: ActivityAction.WORK_STARTED,
        fromStatus: WorkItemStatus.ASSIGNED,
        toStatus: WorkItemStatus.IN_PROGRESS,
      }),
    });

    expect(result).toEqual({
      id: 'item-1',
      status: WorkItemStatus.IN_PROGRESS,
    });
  });

  it('allows a Manager to accept an item in review', async () => {
    transactionMock.workItem.findUnique.mockResolvedValue({
      id: 'item-1',
      status: WorkItemStatus.IN_REVIEW,
      assignments: [
        {
          memberId: member.id,
        },
      ],
    });

    transactionMock.workItem.updateMany.mockResolvedValue({
      count: 1,
    });

    transactionMock.activity.create.mockResolvedValue({});

    workItemsServiceMock.findOne.mockResolvedValue({
      id: 'item-1',
      status: WorkItemStatus.DONE,
    });

    await service.transition('item-1', WorkflowAction.ACCEPT, manager);

    expect(transactionMock.workItem.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'item-1',
        status: WorkItemStatus.IN_REVIEW,
      },

      data: {
        status: WorkItemStatus.DONE,
      },
    });

    expect(transactionMock.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: ActivityAction.REVIEW_ACCEPTED,
        fromStatus: WorkItemStatus.IN_REVIEW,
        toStatus: WorkItemStatus.DONE,
      }),
    });
  });

  it('rejects an illegal status transition', async () => {
    transactionMock.workItem.findUnique.mockResolvedValue({
      id: 'item-1',
      status: WorkItemStatus.IN_PROGRESS,
      assignments: [
        {
          memberId: member.id,
        },
      ],
    });

    await expect(
      service.transition('item-1', WorkflowAction.START, member),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transactionMock.workItem.updateMany).not.toHaveBeenCalled();

    expect(transactionMock.activity.create).not.toHaveBeenCalled();
  });

  it('rejects an unassigned Member', async () => {
    transactionMock.workItem.findUnique.mockResolvedValue({
      id: 'item-1',
      status: WorkItemStatus.ASSIGNED,
      assignments: [
        {
          memberId: 'different-member',
        },
      ],
    });

    await expect(
      service.transition('item-1', WorkflowAction.START, member),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(transactionMock.workItem.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a Member performing a Manager action', async () => {
    transactionMock.workItem.findUnique.mockResolvedValue({
      id: 'item-1',
      status: WorkItemStatus.IN_REVIEW,
      assignments: [
        {
          memberId: member.id,
        },
      ],
    });

    await expect(
      service.transition('item-1', WorkflowAction.ACCEPT, member),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(transactionMock.workItem.updateMany).not.toHaveBeenCalled();
  });

  it('detects a concurrent status change', async () => {
    transactionMock.workItem.findUnique.mockResolvedValue({
      id: 'item-1',
      status: WorkItemStatus.ASSIGNED,
      assignments: [
        {
          memberId: member.id,
        },
      ],
    });

    transactionMock.workItem.updateMany.mockResolvedValue({
      count: 0,
    });

    await expect(
      service.transition('item-1', WorkflowAction.START, member),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transactionMock.activity.create).not.toHaveBeenCalled();
  });
});
