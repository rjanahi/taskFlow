import { Priority, Role, WorkItemStatus } from '../generated/prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { PrismaService } from '../prisma/prisma.service';
import { WorkItemsService } from './work-items.service';

describe('WorkItemsService overdue calculation', () => {
  let service: WorkItemsService;

  let prismaMock: {
    workItem: {
      findMany: jest.Mock;
    };
  };

  const manager: AuthenticatedUser = {
    id: 'manager-1',
    name: 'Manager',
    email: 'manager@test.local',
    role: Role.MANAGER,
  };

  beforeEach(() => {
    prismaMock = {
      workItem: {
        findMany: jest.fn(),
      },
    };

    service = new WorkItemsService(prismaMock as unknown as PrismaService);
  });

  function createItem(status: WorkItemStatus, dueDate: Date) {
    return {
      id: crypto.randomUUID(),
      title: 'Test item',
      description: 'Test description',
      priority: Priority.MEDIUM,
      category: 'Software',
      status,
      dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
      },
      assignments: [],
      attachment: null,
    };
  }

  it('marks an active past-due item as overdue', async () => {
    prismaMock.workItem.findMany.mockResolvedValue([
      createItem(WorkItemStatus.IN_PROGRESS, new Date(Date.now() - 60_000)),
    ]);

    const result = await service.findAll(manager, {});

    expect(result[0].isOverdue).toBe(true);
  });

  it.each([WorkItemStatus.DONE, WorkItemStatus.CANCELLED])(
    'does not mark %s items as overdue',
    async (status) => {
      prismaMock.workItem.findMany.mockResolvedValue([
        createItem(status, new Date(Date.now() - 60_000)),
      ]);

      const result = await service.findAll(manager, {});

      expect(result[0].isOverdue).toBe(false);
    },
  );
});
