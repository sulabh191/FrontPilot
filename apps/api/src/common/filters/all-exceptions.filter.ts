import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import type { RequestWithId } from "../middleware/request-context.middleware";

// The one error format every client (web, iOS, widget) can rely on.
export type ApiErrorBody = {
  error: {
    statusCode: number;
    code: string; // machine-readable, e.g. "BAD_REQUEST", "NOT_FOUND"
    message: string; // human-readable
    details?: unknown; // e.g. validation issues per field
    requestId: string;
  };
};

// Catches every error thrown anywhere in a request and turns it into ApiErrorBody.
// Unexpected errors are logged with their stack trace but never shown to the client.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<RequestWithId>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Something went wrong. Please try again.";
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === "string") {
        message = response;
      } else {
        const body = response as { message?: string | string[]; details?: unknown };
        message = Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? exception.message);
        details = body.details;
      }
    } else {
      // A bug or an outage: log everything, tell the client nothing internal.
      this.logger.error(
        `Unhandled error on ${req.method} ${req.originalUrl} id=${req.id}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorBody = {
      error: {
        statusCode,
        code: HttpStatus[statusCode] ?? "ERROR",
        message,
        ...(details !== undefined && { details }),
        requestId: req.id,
      },
    };
    res.status(statusCode).json(body);
  }
}
