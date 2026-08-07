import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

/**
 * Shared app configuration used by both the production bootstrap (main.ts)
 * and the e2e test harness, so tests exercise the exact runtime pipeline.
 */
export function configureApp(app: NestExpressApplication): void {
  app.setGlobalPrefix('api');
  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}
