import { randomUUID } from "node:crypto";
import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

export type RequestWithId = Request & { id: string };

// Runs first for every request:
// 1. gives it a request ID (reusing one sent by a caller or proxy), returned in X-Request-Id
// 2. logs one line when the response finishes: method, path, status, duration
// The same ID appears in error responses, so a user's bug report can be matched to the logs.
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.header("x-request-id");
    const id = incoming && incoming.length <= 100 ? incoming : randomUUID();
    (req as RequestWithId).id = id;
    res.setHeader("X-Request-Id", id);

    const started = process.hrtime.bigint();
    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - started) / 1_000_000;
      const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms id=${id}`;
      if (res.statusCode >= 500) this.logger.error(line);
      else if (res.statusCode >= 400) this.logger.warn(line);
      else this.logger.log(line);
    });

    next();
  }
}
