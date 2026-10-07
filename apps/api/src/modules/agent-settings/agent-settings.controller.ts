import { Body, Controller, Get, Put } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator";
import { openApiSchema } from "../../common/openapi/zod-schema";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { Tenant } from "../tenants/tenant.types";
import { agentSettingsSchema, type AgentSettings } from "./agent-settings.schemas";
import { AgentSettingsService } from "./agent-settings.service";

@ApiTags("agent-settings")
@ApiBearerAuth()
@Controller("v1/agent-settings")
export class AgentSettingsController {
  constructor(private readonly settings: AgentSettingsService) {}

  @Get()
  @ApiOperation({ summary: "The agent's configuration (defaults if never saved)" })
  @ApiOkResponse({ schema: openApiSchema(agentSettingsSchema, "output") })
  get(@CurrentTenant() tenant: Tenant) {
    return this.settings.get(tenant.id);
  }

  // PUT = replace the whole settings object (all fields required).
  @Put()
  @ApiOperation({ summary: "Replace the agent's configuration" })
  @ApiBody({ schema: openApiSchema(agentSettingsSchema) })
  @ApiOkResponse({ schema: openApiSchema(agentSettingsSchema, "output") })
  @ApiBadRequestResponse({ description: "Validation failed; see error.details for each field" })
  update(
    @CurrentTenant() tenant: Tenant,
    @Body(new ZodValidationPipe(agentSettingsSchema)) body: AgentSettings,
  ) {
    return this.settings.update(tenant.id, body);
  }
}
