import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { z } from "zod";

// Validates (and converts) incoming data with a Zod schema before it reaches a controller.
// Usage: @Body(new ZodValidationPipe(createLeadSchema)) body: CreateLead
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        details: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
