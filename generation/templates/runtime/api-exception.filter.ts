import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

type ErrorResponseBody = {
  statusCode: number;
  message: string | string[];
  code: string;
  details?: unknown;
  path: string;
  timestamp: string;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const mapped = this.mapException(exception);
    const body: ErrorResponseBody = {
      statusCode: mapped.statusCode,
      message: mapped.message,
      code: mapped.code,
      ...(mapped.details !== undefined ? { details: mapped.details } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (mapped.statusCode >= 500) {
      const logDetail =
        exception instanceof Error ? exception.message : String(mapped.message);
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}: ${logDetail}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(mapped.statusCode).json(body);
  }

  private mapException(exception: unknown): {
    statusCode: number;
    message: string | string[];
    code: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse() as
        | string
        | {
            message?: string | string[];
            error?: string;
            code?: string;
            details?: unknown;
          };

      if (typeof payload === 'string') {
        return {
          statusCode,
          message: payload,
          code: `HTTP_${statusCode}`,
        };
      }

      const rawMessage = payload?.message ?? exception.message;
      const message: string | string[] = Array.isArray(rawMessage)
        ? rawMessage.map((m) => String(m))
        : typeof rawMessage === 'string' && rawMessage.length > 0
          ? rawMessage
          : String(exception.message ?? 'Bad Request');

      return {
        statusCode,
        message,
        code: payload?.code ?? payload?.error ?? `HTTP_${statusCode}`,
        details: payload?.details,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.mapPrismaKnownRequestError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          'Некорректные данные запроса. Проверьте обязательные поля и форматы значений.',
        code: 'PRISMA_VALIDATION_ERROR',
      };
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Сервис базы данных временно недоступен.',
        code: 'DATABASE_UNAVAILABLE',
      };
    }

    if (exception instanceof Prisma.PrismaClientRustPanicError) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Внутренняя ошибка сервера.',
        code: 'DATABASE_ENGINE_PANIC',
      };
    }

    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Внутренняя ошибка сервера.',
        code: 'INTERNAL_ERROR',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Внутренняя ошибка сервера.',
      code: 'INTERNAL_ERROR',
    };
  }

  private mapPrismaKnownRequestError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): {
    statusCode: number;
    message: string;
    code: string;
    details?: unknown;
  } {
    switch (exception.code) {
      case 'P2002': {
        const target = Array.isArray(exception.meta?.target)
          ? exception.meta?.target.join(', ')
          : String(exception.meta?.target ?? '');
        return {
          statusCode: HttpStatus.CONFLICT,
          message: target
            ? `Запись с таким значением уже существует (${target}).`
            : 'Запись с таким значением уже существует.',
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          details: exception.meta,
        };
      }
      case 'P2003':
        return {
          statusCode: HttpStatus.CONFLICT,
          message:
            'Операцию нельзя выполнить из-за связанных данных или некорректной ссылки.',
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          details: exception.meta,
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Запись не найдена.',
          code: 'RECORD_NOT_FOUND',
          details: exception.meta,
        };
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Ошибка при обработке данных в базе.',
          code: exception.code,
          details: exception.meta,
        };
    }
  }
}

