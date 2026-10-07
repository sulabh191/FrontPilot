import { Controller, Get, HttpCode, Param, Post, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator";
import { openApiSchema } from "../../common/openapi/zod-schema";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { Tenant } from "../tenants/tenant.types";
import { AppointmentApprovalsService } from "./appointment-approvals.service";
import {
  appointmentIdParamSchema,
  appointmentListSchema,
  approvalResultSchema,
  appointmentStatuses,
  listAppointmentsQuerySchema,
  type ListAppointmentsQuery,
} from "./appointments.schemas";
import { AppointmentsService } from "./appointments.service";

@ApiTags("appointments")
@ApiBearerAuth()
@Controller("v1/appointments")
export class AppointmentsController {
  constructor(
    private readonly appointments: AppointmentsService,
    private readonly approvals: AppointmentApprovalsService,
  ) {}

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

  @Post(":id/approve")
  @HttpCode(200)
  @ApiOperation({ summary: "Approve a booking awaiting approval; texts the customer if they agreed" })
  @ApiOkResponse({ schema: openApiSchema(approvalResultSchema, "output") })
  @ApiNotFoundResponse({ description: "No such appointment for this business" })
  @ApiConflictResponse({ description: "The booking is not awaiting approval anymore" })
  approve(
    @CurrentTenant() tenant: Tenant,
    @Param("id", new ZodValidationPipe(appointmentIdParamSchema)) id: string,
  ) {
    return this.approvals.approve(tenant.id, id);
  }

  @Post(":id/decline")
  @HttpCode(200)
  @ApiOperation({ summary: "Decline a booking awaiting approval; frees the slot" })
  @ApiOkResponse({ schema: openApiSchema(approvalResultSchema, "output") })
  @ApiNotFoundResponse({ description: "No such appointment for this business" })
  @ApiConflictResponse({ description: "The booking is not awaiting approval anymore" })
  decline(
    @CurrentTenant() tenant: Tenant,
    @Param("id", new ZodValidationPipe(appointmentIdParamSchema)) id: string,
  ) {
    return this.approvals.decline(tenant.id, id);
  }
}
