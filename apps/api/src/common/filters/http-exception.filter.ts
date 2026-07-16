import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ExceptionResponseBody {
  message?: string | string[];
  error?: string;
  details?: unknown;
}

const errorNames: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  500: 'Internal Server Error',
};

@Catch()
export class HttpExceptionFilter
  implements ExceptionFilter
{
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'An unexpected error occurred';
    let error =
      errorNames[status] ?? 'Request Error';
    let details: unknown;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const body =
          exceptionResponse as ExceptionResponseBody;

        if (Array.isArray(body.message)) {
          message = 'Validation failed';
          details = {
            errors: body.message,
          };
        } else if (body.message) {
          message = body.message;
        }

        if (body.error) {
          error = body.error;
        }

        if (body.details !== undefined) {
          details = body.details;
        }
      }
    } else {
      console.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      ...(details !== undefined ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }
}