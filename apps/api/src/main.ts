import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import type { Env } from "./config/env.schema";
import { buildOpenApiDocument } from "./openapi";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // Error format and CORS (shared with the end-to-end tests).
  configureApp(app);

  // OpenAPI spec + interactive docs. The same document is exported to openapi.json.
  const document = buildOpenApiDocument(app);
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
