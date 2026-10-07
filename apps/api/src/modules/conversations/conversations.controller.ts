import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
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
import {
  conversationDetailSchema,
  conversationIdParamSchema,
  conversationListSchema,
  conversationStatuses,
  listConversationsQuerySchema,
  type ListConversationsQuery,
} from "./conversations.schemas";
import { ConversationsService } from "./conversations.service";

@ApiTags("conversations")
@ApiBearerAuth()
@Controller("v1/conversations")
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: "List conversations; ones needing the owner come first" })
  @ApiQuery({ name: "status", required: false, enum: conversationStatuses })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "1–100, default 50" })
  @ApiOkResponse({ schema: openApiSchema(conversationListSchema, "output") })
  list(
    @CurrentTenant() tenant: Tenant,
    @Query(new ZodValidationPipe(listConversationsQuerySchema)) query: ListConversationsQuery,
  ) {
    return this.conversations.list(tenant.id, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "One conversation with all its messages" })
  @ApiOkResponse({ schema: openApiSchema(conversationDetailSchema, "output") })
  @ApiNotFoundResponse({ description: "No such conversation for this business" })
  get(
    @CurrentTenant() tenant: Tenant,
    @Param("id", new ZodValidationPipe(conversationIdParamSchema)) id: string,
  ) {
    return this.conversations.get(tenant.id, id);
  }
}
