import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";

// Builds the API contract (OpenAPI). Used by main.ts for /docs and by the export
// script that writes openapi.json, from which typed clients (TypeScript, Swift) are generated.
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("FrontPilot API")
      .setDescription("Backend for the FrontPilot web app, iOS app and chat widget.")
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  );
  // Our schemas come from Zod as JSON Schema 2020-12 (e.g. nullable as type: [..., "null"]),
  // which is what OpenAPI 3.1 uses.
  document.openapi = "3.1.0";
  return document;
}
