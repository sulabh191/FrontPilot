import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator";
import { openApiSchema } from "../../common/openapi/zod-schema";
import type { Tenant } from "../tenants/tenant.types";
import { overviewSchema } from "./overview.schemas";
import { OverviewService } from "./overview.service";

@ApiTags("overview")
@ApiBearerAuth()
@Controller("v1/overview")
export class OverviewController {
  constructor(private readonly overview: OverviewService) {}

  @Get()
  @ApiOperation({ summary: "Dashboard summary: last 7 days, items needing attention, upcoming visits" })
  @ApiOkResponse({ schema: openApiSchema(overviewSchema, "output") })
  get(@CurrentTenant() tenant: Tenant) {
    return this.overview.get(tenant);
  }
}
