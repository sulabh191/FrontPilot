import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator";
import { openApiSchema } from "../../common/openapi/zod-schema";
import type { Tenant } from "./tenant.types";
import { tenantSchema } from "./tenants.schemas";

@ApiTags("account")
@ApiBearerAuth()
@Controller("v1/me")
export class TenantsController {
  // No auth code here: the global guard already verified the token,
  // and @CurrentTenant() hands over the business it belongs to.
  @Get()
  @ApiOperation({ summary: "The business the current token belongs to" })
  @ApiOkResponse({ schema: openApiSchema(tenantSchema, "output") })
  @ApiUnauthorizedResponse({ description: "Missing or invalid token" })
  me(@CurrentTenant() tenant: Tenant) {
    return tenant;
  }
}
