import { NestFactory } from '@nestjs/core';
import { configureApp } from './app.config';
import { AppModule } from './app.module';

console.log('1. main.ts loaded');

async function bootstrap(): Promise<void> {
  console.log('2. before NestFactory.create');

  const app = await NestFactory.create(AppModule);

  console.log('3. after NestFactory.create');

  configureApp(app);

  console.log('4. after configureApp');

  const port = Number(process.env.PORT ?? 3001);

  await app.listen(port);

  console.log(`5. API running at http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});