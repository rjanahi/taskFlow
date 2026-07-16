import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import {
  HttpExceptionFilter,
} from './common/filters/http-exception.filter';

function formatValidationErrors(
  errors: ValidationError[],
) {
  return errors.map((validationError) => ({
    field: validationError.property,
    messages: Object.values(
      validationError.constraints ?? {},
    ),
  }));
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin:
      process.env.FRONTEND_URL ??
      'http://localhost:3000',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (
        errors: ValidationError[],
      ) =>
        new BadRequestException({
          message: 'Validation failed',
          details: formatValidationErrors(errors),
        }),
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(process.env.PORT ?? 3001);

  await app.listen(port);

  console.log(
    `API running at http://localhost:${port}/api`,
  );
}

void bootstrap();