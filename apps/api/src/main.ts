import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import type { Env } from "./config/env.schema";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // Every error, anywhere, becomes the same JSON shape.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Only these browser origins may call the API (the web app for now; widget sites later).
  app.enableCors({
    origin: config.get("CORS_ORIGINS", { infer: true }),
    credentials: true,
    exposedHeaders: ["X-Request-Id"],
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
  SwaggerModule.setup("docs", app, document, { jsonDocumentUrl: "docs-json" });

  // Close database connections etc. cleanly when the process stops.
  app.enableShutdownHooks();

  const port = config.get("PORT", { infer: true });
  await app.listen(port);
  Logger.log(`FrontPilot API running on http://localhost:${port} (docs: /docs)`, "Bootstrap");
}

void bootstrap();
