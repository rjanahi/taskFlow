import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.config';
import { Priority, Role } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

describe('TaskFlow API integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let managerId: string;
  let memberId: string;

  const managerCredentials = {
    email: 'manager.integration@test.local',
    password: 'Manager123!',
  };

  const memberCredentials = {
    email: 'member.integration@test.local',
    password: 'Member123!',
  };

  beforeAll(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();

    configureApp(app);

    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await clearDatabase();
    await createTestUsers();
  });

  afterAll(async () => {
    await clearDatabase();
    await app.close();
  });

  async function clearDatabase(): Promise<void> {
    await prisma.$transaction([
      prisma.attachment.deleteMany(),
      prisma.activity.deleteMany(),
      prisma.timeExtensionRequest.deleteMany(),
      prisma.workItemAssignment.deleteMany(),
      prisma.workItem.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  }

  async function createTestUsers(): Promise<void> {
    const [managerPasswordHash, memberPasswordHash] = await Promise.all([
      hash(managerCredentials.password, 12),
      hash(memberCredentials.password, 12),
    ]);

    const manager = await prisma.user.create({
      data: {
        name: 'Integration Manager',
        email: managerCredentials.email,
        passwordHash: managerPasswordHash,
        role: Role.MANAGER,
      },
    });

    const member = await prisma.user.create({
      data: {
        name: 'Integration Member',
        email: memberCredentials.email,
        passwordHash: memberPasswordHash,
        role: Role.MEMBER,
      },
    });

    managerId = manager.id;
    memberId = member.id;
  }

  async function login(email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    return response.body.accessToken as string;
  }

  it('logs in, creates an item and assigns it', async () => {
    const managerToken = await login(
      managerCredentials.email,
      managerCredentials.password,
    );

    const createResponse = await request(app.getHttpServer())
      .post('/api/work-items')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Integration test work item',
        description: 'Created during the API integration test.',
        priority: Priority.HIGH,
        category: 'Software',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      title: 'Integration test work item',
      status: 'BACKLOG',
      priority: Priority.HIGH,
      createdBy: {
        id: managerId,
      },
      assignments: [],
    });

    const workItemId = createResponse.body.id as string;

    const assignmentResponse = await request(app.getHttpServer())
      .put(`/api/work-items/${workItemId}/assignees`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        memberIds: [memberId],
      })
      .expect(200);

    expect(assignmentResponse.body.status).toBe('ASSIGNED');

    expect(assignmentResponse.body.assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          member: expect.objectContaining({
            id: memberId,
            role: Role.MEMBER,
          }),
        }),
      ]),
    );

    expect(assignmentResponse.body.activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'MEMBERS_ASSIGNED',
          fromStatus: 'BACKLOG',
          toStatus: 'ASSIGNED',
        }),
      ]),
    );
  });

  it('returns 401 without an access token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/work-items')
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication is required',
      path: '/api/work-items',
    });
  });

  it('returns 403 when a Member creates an item', async () => {
    const memberToken = await login(
      memberCredentials.email,
      memberCredentials.password,
    );

    const response = await request(app.getHttpServer())
      .post('/api/work-items')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Forbidden item',
        description: 'A Member should not create this.',
        priority: Priority.LOW,
        category: 'Software',
        dueDate: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .expect(403);

    expect(response.body).toMatchObject({
      statusCode: 403,
      error: 'Forbidden',
      message: 'You do not have permission to perform this action',
    });
  });

  it('returns 400 for invalid work item input', async () => {
    const managerToken = await login(
      managerCredentials.email,
      managerCredentials.password,
    );

    const response = await request(app.getHttpServer())
      .post('/api/work-items')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'A',
        description: '',
        priority: 'EXTREME',
        category: '',
        dueDate: 'not-a-date',
        status: 'DONE',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
    });

    expect(response.body.details).toBeDefined();
  });

  it('rejects invalid login credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: managerCredentials.email,
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid email or password',
    });
  });
});
