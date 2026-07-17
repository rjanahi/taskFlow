import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  const appServiceMock = {
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('should return the application health status', async () => {
      const healthResponse = {
        status: 'ok',
        database: 'connected',
        userCount: 3,
      };

      appServiceMock.getHealth.mockResolvedValue(healthResponse);

      await expect(appController.getHealth()).resolves.toEqual(healthResponse);
      expect(appServiceMock.getHealth).toHaveBeenCalledTimes(1);
    });
  });
});
