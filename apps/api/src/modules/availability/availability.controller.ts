import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator";
import { openApiSchema } from "../../common/openapi/zod-schema";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { Tenant } from "../tenants/tenant.types";
import { availabilityQuerySchema, availabilitySchema, type AvailabilityQuery } from "./availability.schemas";
import { AvailabilityService } from "./availability.service";

@ApiTags("availability")
@ApiBearerAuth()
@Controller("v1/availability")
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: "Free appointment slots on one day" })
  @ApiQuery({ name: "date", required: true, example: "2026-10-07" })
  @ApiOkResponse({ schema: openApiSchema(availabilitySchema, "output") })
  async get(
    @CurrentTenant() tenant: Tenant,
    @Query(new ZodValidationPipe(availabilityQuerySchema)) { date }: AvailabilityQuery,
  ) {
    const result = await this.availability.getSlots(tenant.id, date);
    if (result.status === "closed") {
      return { date, timeZone: result.timeZone, available: false, reason: result.reason, slots: [] };
    }
    const tz = result.timeZone;
    return {
      date,
      timeZone: tz,
      available: true,
      slots: result.slots.map((slot) => ({
        startsAt: slot.toISOString(),
        label: slot.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }),
        value: slot.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
      })),
    };
  }
}
