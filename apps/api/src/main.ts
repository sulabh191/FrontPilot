import "reflect-metadata";
import { Logger } from "@nestjs/common";
import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { Request } from "express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import type { Env } from "./config/env.schema";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  // OpenAPI spec + interactive docs. The spec at /docs-json generates typed clients.
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("FrontPilot API")
      .setDescription("Backend for the FrontPilot web app, iOS app and chat widget.")
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "docs-json",
    swaggerOptions: { persistAuthorization: true }, // keep the token after a page refresh
  });

  // Close database connections etc. cleanly when the process stops.
  app.enableShutdownHooks();

  const port = config.get("PORT", { infer: true });
  await app.listen(port);
  Logger.log(`FrontPilot API running on http://localhost:${port} (docs: /docs)`, "Bootstrap");
}

void bootstrap();
