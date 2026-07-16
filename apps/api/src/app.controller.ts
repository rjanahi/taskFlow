import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

interface HealthResponse {
  status: string;
  database: string;
  userCount: number;
}

@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth(): Promise<HealthResponse> {
    return this.appService.getHealth();
  }
}