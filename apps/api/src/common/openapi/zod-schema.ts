import type { SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import { z } from "zod";

// Turns a Zod schema into an OpenAPI schema for Swagger decorators, e.g.
// @ApiBody({ schema: openApiSchema(createLeadSchema) })
// One schema → runtime validation + API docs + generated client types.
export function openApiSchema(schema: z.ZodType): SchemaObject {
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema, { io: "input" }) as Record<string, unknown>;
  return jsonSchema as SchemaObject;
}
