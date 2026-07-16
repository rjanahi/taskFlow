import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

interface HealthResponse {
  status: string;
  database: string;
  userCount: number;
}

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthResponse> {
    const userCount = await this.prisma.user.count();

    return {
      status: 'ok',
      database: 'connected',
      userCount,
    };
  }
}
