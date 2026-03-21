import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { RuntimeEnvironment } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService<RuntimeEnvironment, true>>(
    ConfigService,
  );

  const allowedOrigins = configService
    .getOrThrow('CORS_ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    exposedHeaders: ['Content-Range'],
    credentials: false,
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);
}
bootstrap();
