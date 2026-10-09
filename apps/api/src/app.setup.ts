import type { INestApplication } from "@nestjs/common";
import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import type { Env } from "./config/env.schema";

// App-wide HTTP behaviour, shared by main.ts and the end-to-end tests,
// so the tests exercise exactly what production runs.
export function configureApp(app: INestApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // Every error, anywhere, becomes the same JSON shape.
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS, decided per request:
  // - public widget endpoints (/v1/chat, /v1/widget/…) are embedded on businesses' own
  //   websites, so any origin may call them (no cookies involved);
  // - everything else only from our own apps (CORS_ORIGINS).
  const trustedOrigins = config.get("CORS_ORIGINS", { infer: true });
  app.enableCors((req: Request, callback: (err: Error | null, options: CorsOptions) => void) => {
    const isPublicWidgetRoute = /^\/v1\/(chat|widget\/)/.test(req.url ?? "");
    callback(null, {
      origin: isPublicWidgetRoute ? true : trustedOrigins,
      credentials: !isPublicWidgetRoute,
      exposedHeaders: ["X-Request-Id"],
    });
  });
}
