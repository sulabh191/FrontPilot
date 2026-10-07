import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator";
import { openApiSchema } from "../../common/openapi/zod-schema";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { Tenant } from "../tenants/tenant.types";
import { leadListSchema, leadStages, listLeadsQuerySchema, type ListLeadsQuery } from "./leads.schemas";
import { LeadsService } from "./leads.service";

// HTTP layer only: parse input, call the service, return the result.
@ApiTags("leads")
@ApiBearerAuth()
@Controller("v1/leads")
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @ApiOperation({ summary: "List the business's leads, newest first" })
  @ApiQuery({ name: "stage", required: false, enum: leadStages })
  @ApiOkResponse({ schema: openApiSchema(leadListSchema, "output") })
  list(
    @CurrentTenant() tenant: Tenant,
    @Query(new ZodValidationPipe(listLeadsQuerySchema)) query: ListLeadsQuery,
  ) {
    return this.leads.list(tenant.id, query);
  }
}
