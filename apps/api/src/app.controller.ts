import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { AppService } from './app.service';

interface HealthResponse {
  status: string;
  database: string;
  userCount: number;
}

@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Public endpoint (no authentication required)
  @Public()
  @Get()
  getHealth(): Promise<HealthResponse> {
    return this.appService.getHealth();
  }
}
