import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  });

  const port = Number(process.env.PORT ?? 3001);

  await app.listen(port);

  console.log(`API running at http://localhost:${port}/api`);
}

void bootstrap();