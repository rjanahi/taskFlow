import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ActivityAction,
  PrismaClient,
  Priority,
  Role,
  TimeExtensionStatus,
  WorkItemStatus,
} from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;

const WORK_ITEM_IDS = {
  backlog: '11111111-1111-4111-8111-111111111111',
  assigned: '22222222-2222-4222-8222-222222222222',
  inProgress: '33333333-3333-4333-8333-333333333333',
  inReview: '44444444-4444-4444-8444-444444444444',
  done: '55555555-5555-4555-8555-555555555555',
  cancelled: '66666666-6666-4666-8666-666666666666',
  overdue: '77777777-7777-4777-8777-777777777777',
} as const;

const EXTENSION_REQUEST_ID =
  '88888888-8888-4888-8888-888888888888';

function dateFromNow(days: number, hours = 0): Date {
  return new Date(
    Date.now() + days * DAY_IN_MS + hours * HOUR_IN_MS,
  );
}

async function seedUsers() {
  const managerPassword = await hash('Manager123!', 12);
  const memberPassword = await hash('Member123!', 12);

  const manager = await prisma.user.upsert({
    where: {
      email: 'manager@taskflow.local',
    },
    update: {
      name: 'Maya Manager',
      passwordHash: managerPassword,
      role: Role.MANAGER,
    },
    create: {
      name: 'Maya Manager',
      email: 'manager@taskflow.local',
      passwordHash: managerPassword,
      role: Role.MANAGER,
    },
  });

  const memberOne = await prisma.user.upsert({
    where: {
      email: 'member1@taskflow.local',
    },
    update: {
      name: 'Alex Member',
      passwordHash: memberPassword,
      role: Role.MEMBER,
    },
    create: {
      name: 'Alex Member',
      email: 'member1@taskflow.local',
      passwordHash: memberPassword,
      role: Role.MEMBER,
    },
  });

  const memberTwo = await prisma.user.upsert({
    where: {
      email: 'member2@taskflow.local',
    },
    update: {
      name: 'Sam Member',
      passwordHash: memberPassword,
      role: Role.MEMBER,
    },
    create: {
      name: 'Sam Member',
      email: 'member2@taskflow.local',
      passwordHash: memberPassword,
      role: Role.MEMBER,
    },
  });

  const memberThree = await prisma.user.upsert({
    where: {
      email: 'member3@taskflow.local',
    },
    update: {
      name: 'Jordan Member',
      passwordHash: memberPassword,
      role: Role.MEMBER,
    },
    create: {
      name: 'Jordan Member',
      email: 'member3@taskflow.local',
      passwordHash: memberPassword,
      role: Role.MEMBER,
    },
  });

  return {
    manager,
    memberOne,
    memberTwo,
    memberThree,
  };
}

async function seedWorkItems(
  users: Awaited<ReturnType<typeof seedUsers>>,
): Promise<void> {
  const {
    manager,
    memberOne,
    memberTwo,
    memberThree,
  } = users;

  const seededIds = Object.values(WORK_ITEM_IDS);

  /*
   * This deletes only our known sample work items.
   * Related assignments, activities and extension requests
   * are deleted through the cascade rules in the schema.
   */
  await prisma.workItem.deleteMany({
    where: {
      id: {
        in: seededIds,
      },
    },
  });

  const dueDates = {
    backlog: dateFromNow(10),
    assigned: dateFromNow(5),
    inProgress: dateFromNow(3),
    inReview: dateFromNow(1),
    done: dateFromNow(-1),
    cancelled: dateFromNow(7),
    overdue: dateFromNow(-2),
  };

  await prisma.workItem.createMany({
    data: [
      {
        id: WORK_ITEM_IDS.backlog,
        title: 'Prepare laptop replacement plan',
        description:
          'Review ageing laptops and prepare a replacement recommendation.',
        priority: Priority.MEDIUM,
        category: 'Hardware',
        dueDate: dueDates.backlog,
        status: WorkItemStatus.BACKLOG,
        createdById: manager.id,
        createdAt: dateFromNow(-2),
      },
      {
        id: WORK_ITEM_IDS.assigned,
        title: 'Set up finance shared drive',
        description:
          'Create the shared folder structure and apply the approved access permissions.',
        priority: Priority.HIGH,
        category: 'Access Request',
        dueDate: dueDates.assigned,
        status: WorkItemStatus.ASSIGNED,
        createdById: manager.id,
        createdAt: dateFromNow(-3),
      },
      {
        id: WORK_ITEM_IDS.inProgress,
        title: 'Upgrade meeting room software',
        description:
          'Upgrade the video conferencing software and confirm camera and microphone compatibility.',
        priority: Priority.HIGH,
        category: 'Software',
        dueDate: dueDates.inProgress,
        status: WorkItemStatus.IN_PROGRESS,
        createdById: manager.id,
        createdAt: dateFromNow(-5),
      },
      {
        id: WORK_ITEM_IDS.inReview,
        title: 'Review account offboarding checklist',
        description:
          'Validate the revised employee account offboarding process.',
        priority: Priority.MEDIUM,
        category: 'Security',
        dueDate: dueDates.inReview,
        status: WorkItemStatus.IN_REVIEW,
        createdById: manager.id,
        createdAt: dateFromNow(-6),
      },
      {
        id: WORK_ITEM_IDS.done,
        title: 'Configure reception printer',
        description:
          'Install the printer, configure secure printing and test scanning.',
        priority: Priority.LOW,
        category: 'Hardware',
        dueDate: dueDates.done,
        status: WorkItemStatus.DONE,
        createdById: manager.id,
        createdAt: dateFromNow(-8),
      },
      {
        id: WORK_ITEM_IDS.cancelled,
        title: 'Deploy legacy browser extension',
        description:
          'Deployment was cancelled after the vendor withdrew support.',
        priority: Priority.LOW,
        category: 'Software',
        dueDate: dueDates.cancelled,
        status: WorkItemStatus.CANCELLED,
        createdById: manager.id,
        createdAt: dateFromNow(-4),
      },
      {
        id: WORK_ITEM_IDS.overdue,
        title: 'Resolve warehouse Wi-Fi issue',
        description:
          'Investigate unstable Wi-Fi coverage around the warehouse loading area.',
        priority: Priority.URGENT,
        category: 'Network',
        dueDate: dueDates.overdue,
        status: WorkItemStatus.IN_PROGRESS,
        createdById: manager.id,
        createdAt: dateFromNow(-7),
      },
    ],
  });

  await prisma.workItemAssignment.createMany({
    data: [
      {
        workItemId: WORK_ITEM_IDS.assigned,
        memberId: memberOne.id,
        assignedById: manager.id,
        assignedAt: dateFromNow(-2),
      },
      {
        workItemId: WORK_ITEM_IDS.inProgress,
        memberId: memberOne.id,
        assignedById: manager.id,
        assignedAt: dateFromNow(-4),
      },
      {
        workItemId: WORK_ITEM_IDS.inProgress,
        memberId: memberTwo.id,
        assignedById: manager.id,
        assignedAt: dateFromNow(-4),
      },
      {
        workItemId: WORK_ITEM_IDS.inReview,
        memberId: memberTwo.id,
        assignedById: manager.id,
        assignedAt: dateFromNow(-5),
      },
      {
        workItemId: WORK_ITEM_IDS.done,
        memberId: memberThree.id,
        assignedById: manager.id,
        assignedAt: dateFromNow(-7),
      },
      {
        workItemId: WORK_ITEM_IDS.cancelled,
        memberId: memberOne.id,
        assignedById: manager.id,
        assignedAt: dateFromNow(-3),
      },
      {
        workItemId: WORK_ITEM_IDS.overdue,
        memberId: memberThree.id,
        assignedById: manager.id,
        assignedAt: dateFromNow(-6),
      },
    ],
  });

  await prisma.activity.createMany({
    data: [
      {
        workItemId: WORK_ITEM_IDS.backlog,
        actorId: manager.id,
        action: ActivityAction.ITEM_CREATED,
        toStatus: WorkItemStatus.BACKLOG,
        details: {
          message: 'Work item created',
        },
        createdAt: dateFromNow(-2),
      },

      {
        workItemId: WORK_ITEM_IDS.assigned,
        actorId: manager.id,
        action: ActivityAction.ITEM_CREATED,
        toStatus: WorkItemStatus.BACKLOG,
        details: {
          message: 'Work item created',
        },
        createdAt: dateFromNow(-3),
      },
      {
        workItemId: WORK_ITEM_IDS.assigned,
        actorId: manager.id,
        action: ActivityAction.MEMBERS_ASSIGNED,
        fromStatus: WorkItemStatus.BACKLOG,
        toStatus: WorkItemStatus.ASSIGNED,
        details: {
          memberIds: [memberOne.id],
          memberNames: [memberOne.name],
        },
        createdAt: dateFromNow(-2),
      },

      {
        workItemId: WORK_ITEM_IDS.inProgress,
        actorId: manager.id,
        action: ActivityAction.ITEM_CREATED,
        toStatus: WorkItemStatus.BACKLOG,
        details: {
          message: 'Work item created',
        },
        createdAt: dateFromNow(-5),
      },
      {
        workItemId: WORK_ITEM_IDS.inProgress,
        actorId: manager.id,
        action: ActivityAction.MEMBERS_ASSIGNED,
        fromStatus: WorkItemStatus.BACKLOG,
        toStatus: WorkItemStatus.ASSIGNED,
        details: {
          memberIds: [memberOne.id, memberTwo.id],
          memberNames: [memberOne.name, memberTwo.name],
        },
        createdAt: dateFromNow(-4),
      },
      {
        workItemId: WORK_ITEM_IDS.inProgress,
        actorId: memberOne.id,
        action: ActivityAction.WORK_STARTED,
        fromStatus: WorkItemStatus.ASSIGNED,
        toStatus: WorkItemStatus.IN_PROGRESS,
        createdAt: dateFromNow(-3),
      },

      {
        workItemId: WORK_ITEM_IDS.inReview,
        actorId: manager.id,
        action: ActivityAction.ITEM_CREATED,
        toStatus: WorkItemStatus.BACKLOG,
        createdAt: dateFromNow(-6),
      },
      {
        workItemId: WORK_ITEM_IDS.inReview,
        actorId: manager.id,
        action: ActivityAction.MEMBERS_ASSIGNED,
        fromStatus: WorkItemStatus.BACKLOG,
        toStatus: WorkItemStatus.ASSIGNED,
        details: {
          memberIds: [memberTwo.id],
          memberNames: [memberTwo.name],
        },
        createdAt: dateFromNow(-5),
      },
      {
        workItemId: WORK_ITEM_IDS.inReview,
        actorId: memberTwo.id,
        action: ActivityAction.WORK_STARTED,
        fromStatus: WorkItemStatus.ASSIGNED,
        toStatus: WorkItemStatus.IN_PROGRESS,
        createdAt: dateFromNow(-4),
      },
      {
        workItemId: WORK_ITEM_IDS.inReview,
        actorId: memberTwo.id,
        action: ActivityAction.SUBMITTED_FOR_REVIEW,
        fromStatus: WorkItemStatus.IN_PROGRESS,
        toStatus: WorkItemStatus.IN_REVIEW,
        createdAt: dateFromNow(-1),
      },

      {
        workItemId: WORK_ITEM_IDS.done,
        actorId: manager.id,
        action: ActivityAction.ITEM_CREATED,
        toStatus: WorkItemStatus.BACKLOG,
        createdAt: dateFromNow(-8),
      },
      {
        workItemId: WORK_ITEM_IDS.done,
        actorId: manager.id,
        action: ActivityAction.MEMBERS_ASSIGNED,
        fromStatus: WorkItemStatus.BACKLOG,
        toStatus: WorkItemStatus.ASSIGNED,
        details: {
          memberIds: [memberThree.id],
          memberNames: [memberThree.name],
        },
        createdAt: dateFromNow(-7),
      },
      {
        workItemId: WORK_ITEM_IDS.done,
        actorId: memberThree.id,
        action: ActivityAction.WORK_STARTED,
        fromStatus: WorkItemStatus.ASSIGNED,
        toStatus: WorkItemStatus.IN_PROGRESS,
        createdAt: dateFromNow(-6),
      },
      {
        workItemId: WORK_ITEM_IDS.done,
        actorId: memberThree.id,
        action: ActivityAction.SUBMITTED_FOR_REVIEW,
        fromStatus: WorkItemStatus.IN_PROGRESS,
        toStatus: WorkItemStatus.IN_REVIEW,
        createdAt: dateFromNow(-3),
      },
      {
        workItemId: WORK_ITEM_IDS.done,
        actorId: manager.id,
        action: ActivityAction.REVIEW_ACCEPTED,
        fromStatus: WorkItemStatus.IN_REVIEW,
        toStatus: WorkItemStatus.DONE,
        createdAt: dateFromNow(-2),
      },

      {
        workItemId: WORK_ITEM_IDS.cancelled,
        actorId: manager.id,
        action: ActivityAction.ITEM_CREATED,
        toStatus: WorkItemStatus.BACKLOG,
        createdAt: dateFromNow(-4),
      },
      {
        workItemId: WORK_ITEM_IDS.cancelled,
        actorId: manager.id,
        action: ActivityAction.MEMBERS_ASSIGNED,
        fromStatus: WorkItemStatus.BACKLOG,
        toStatus: WorkItemStatus.ASSIGNED,
        details: {
          memberIds: [memberOne.id],
          memberNames: [memberOne.name],
        },
        createdAt: dateFromNow(-3),
      },
      {
        workItemId: WORK_ITEM_IDS.cancelled,
        actorId: manager.id,
        action: ActivityAction.ITEM_CANCELLED,
        fromStatus: WorkItemStatus.ASSIGNED,
        toStatus: WorkItemStatus.CANCELLED,
        details: {
          reason: 'Vendor support was withdrawn',
        },
        createdAt: dateFromNow(-2),
      },

      {
        workItemId: WORK_ITEM_IDS.overdue,
        actorId: manager.id,
        action: ActivityAction.ITEM_CREATED,
        toStatus: WorkItemStatus.BACKLOG,
        createdAt: dateFromNow(-7),
      },
      {
        workItemId: WORK_ITEM_IDS.overdue,
        actorId: manager.id,
        action: ActivityAction.MEMBERS_ASSIGNED,
        fromStatus: WorkItemStatus.BACKLOG,
        toStatus: WorkItemStatus.ASSIGNED,
        details: {
          memberIds: [memberThree.id],
          memberNames: [memberThree.name],
        },
        createdAt: dateFromNow(-6),
      },
      {
        workItemId: WORK_ITEM_IDS.overdue,
        actorId: memberThree.id,
        action: ActivityAction.WORK_STARTED,
        fromStatus: WorkItemStatus.ASSIGNED,
        toStatus: WorkItemStatus.IN_PROGRESS,
        createdAt: dateFromNow(-5),
      },
    ],
  });

  await prisma.timeExtensionRequest.create({
    data: {
      id: EXTENSION_REQUEST_ID,
      workItemId: WORK_ITEM_IDS.inProgress,
      requestedById: memberOne.id,
      currentDueDate: dueDates.inProgress,
      proposedDueDate: dateFromNow(6),
      reason:
        'The meeting room hardware requires an additional compatibility test.',
      status: TimeExtensionStatus.PENDING,
      createdAt: dateFromNow(-1),
    },
  });

  await prisma.activity.create({
    data: {
      workItemId: WORK_ITEM_IDS.inProgress,
      actorId: memberOne.id,
      action: ActivityAction.TIME_EXTENSION_REQUESTED,
      details: {
        currentDueDate: dueDates.inProgress.toISOString(),
        proposedDueDate: dateFromNow(6).toISOString(),
        reason:
          'The meeting room hardware requires an additional compatibility test.',
      },
      createdAt: dateFromNow(-1),
    },
  });
}

async function main(): Promise<void> {
  console.log('Starting TaskFlow seed...');

  const users = await seedUsers();

  await seedWorkItems(users);

  console.log('TaskFlow seed completed.');
  console.log('');
  console.log('Manager:');
  console.log('  Email: manager@taskflow.local');
  console.log('  Password: Manager123!');
  console.log('');
  console.log('Members:');
  console.log('  Email: member1@taskflow.local');
  console.log('  Email: member2@taskflow.local');
  console.log('  Email: member3@taskflow.local');
  console.log('  Password: Member123!');
}

main()
  .catch((error: unknown) => {
    console.error('TaskFlow seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });