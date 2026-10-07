import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator";
import { openApiSchema } from "../../common/openapi/zod-schema";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { Tenant } from "../tenants/tenant.types";
import {
  appointmentListSchema,
  appointmentStatuses,
  listAppointmentsQuerySchema,
  type ListAppointmentsQuery,
} from "./appointments.schemas";
import { AppointmentsService } from "./appointments.service";

@ApiTags("appointments")
@ApiBearerAuth()
@Controller("v1/appointments")
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: "List appointments, soonest first" })
  @ApiQuery({ name: "status", required: false, enum: appointmentStatuses })
  @ApiQuery({ name: "from", required: false, description: "ISO date-time, e.g. 2026-10-06T00:00:00Z" })
  @ApiOkResponse({ schema: openApiSchema(appointmentListSchema, "output") })
  list(
    @CurrentTenant() tenant: Tenant,
    @Query(new ZodValidationPipe(listAppointmentsQuerySchema)) query: ListAppointmentsQuery,
  ) {
    return this.appointments.list(tenant, query);
  }
}
