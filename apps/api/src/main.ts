import { NestFactory } from '@nestjs/core';
import { configureApp } from './app.config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const port = Number(process.env.PORT ?? 3001);

  await app.listen(port);

  console.log(`API running at http://localhost:${port}/api`);
}

void bootstrap();
