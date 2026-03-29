import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule } from './app.module';
import { RuntimeEnvironment } from './config/env.validation';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { FIELD_LABELS } from './common/field-labels.generated';

function prettifyFieldName(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  const withSpaces = field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
  if (!withSpaces) return field;
  return withSpaces[0].toUpperCase() + withSpaces.slice(1);
}

function constraintToRuMessage(field: string, constraint: string): string {
  const label = prettifyFieldName(field);
  switch (constraint) {
    case 'isNotEmpty':
      return `Поле "${label}" обязательно`;
    case 'isString':
      return `Поле "${label}" должно быть строкой`;
    case 'isInt':
      return `Поле "${label}" должно быть целым числом`;
    case 'isUUID':
      return `Поле "${label}" должно быть UUID`;
    case 'isNumberString':
      return `Поле "${label}" должно быть числом`;
    case 'isNumber':
      return `Поле "${label}" должно быть числом`;
    case 'isIso8601':
      return `Поле "${label}" должно содержать корректную дату`;
    case 'isEnum':
    case 'isIn':
      return `Поле "${label}" содержит недопустимое значение`;
    default:
      return `Поле "${label}" заполнено некорректно`;
  }
}

function buildValidationMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];

  const walk = (errorList: ValidationError[]) => {
    for (const error of errorList) {
      if (error.constraints) {
        const constraints = Object.keys(error.constraints);
        // If field is empty, "required" is enough; skip type noise.
        const filtered = constraints.includes('isNotEmpty')
          ? ['isNotEmpty']
          : constraints;
        filtered.forEach((constraint) =>
          messages.push(constraintToRuMessage(error.property, constraint)),
        );
      }
      if (error.children?.length) walk(error.children);
    }
  };

  walk(errors);
  return Array.from(new Set(messages));
}

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

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: false,
      exceptionFactory: (errors) =>
        new BadRequestException(buildValidationMessages(errors)),
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  const port = configService.get('PORT', 3000);
  await app.listen(port);
}
bootstrap();
