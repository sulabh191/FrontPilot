import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator";
import { openApiSchema } from "../../common/openapi/zod-schema";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { Tenant } from "../tenants/tenant.types";
import { previewRequestSchema, previewResponseSchema, type PreviewRequest } from "./agent.schemas";
import { AgentService } from "./agent.service";

@ApiTags("agent")
@ApiBearerAuth()
@Controller("v1/agent")
export class AgentController {
  constructor(private readonly agent: AgentService) {}

  // Lets the owner try their agent: nothing is saved and no bookings are made.
  @Post("preview")
  @HttpCode(200)
  @ApiOperation({ summary: "Test the agent with a sample conversation (no data is saved, no bookings)" })
  @ApiBody({
    schema: openApiSchema(previewRequestSchema),
    examples: {
      question: { value: { messages: [{ role: "user", content: "How much is drain cleaning?" }] } },
      availability: { value: { messages: [{ role: "user", content: "Can someone come tomorrow morning?" }] } },
    },
  })
  @ApiOkResponse({ schema: openApiSchema(previewResponseSchema, "output") })
  async preview(
    @CurrentTenant() tenant: Tenant,
    @Body(new ZodValidationPipe(previewRequestSchema)) body: PreviewRequest,
  ) {
    const result = await this.agent.respond({ tenant, conversationId: null, history: body.messages }, () => {});
    return {
      reply: result.text,
      suggestions: result.suggestions,
      toolCalls: result.toolCalls,
      usage: { model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens },
    };
  }
}
