import "reflect-metadata";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { buildOpenApiDocument } from "../openapi";

// Writes the API contract to apps/api/openapi.json without starting the server.
// The file is committed: changes to the API show up as a reviewable diff,
// and clients are generated from it.
async function main() {
  const app = await NestFactory.create(AppModule, { logger: ["error"] });
  const document = buildOpenApiDocument(app);
  const target = join(__dirname, "..", "..", "openapi.json");
  writeFileSync(target, JSON.stringify(document, null, 2) + "\n");
  await app.close();
  console.log(`OpenAPI spec written to ${target}`);
}

void main();
