import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { AgentService } from "../agent/agent.service";
import type { AgentEvent } from "../agent/runner/agent-runner";
import { AgentSettingsService } from "../agent-settings/agent-settings.service";
import { ConversationsRepository } from "../conversations/conversations.repository";
import { TenantsService } from "../tenants/tenants.service";
import type { Tenant } from "../tenants/tenant.types";
import type { ChatRequest } from "./chat.schemas";

export const MAX_MESSAGES_PER_CONVERSATION = 60;

export type PreparedTurn = { tenant: Tenant; conversationId: string };

@Injectable()
export class ChatService {
  constructor(
    private readonly tenants: TenantsService,
    private readonly conversations: ConversationsRepository,
    private readonly agent: AgentService,
    private readonly settings: AgentSettingsService,
  ) {}

  // Everything that can fail with a normal HTTP error happens here, BEFORE streaming starts.
  async prepareTurn(request: ChatRequest): Promise<PreparedTurn> {
    const tenant = await this.tenants.findBySlug(request.tenantSlug);
    if (!tenant) throw new NotFoundException("Unknown business");

    let conversationId: string;
    if (request.conversationId) {
      // Tenant-scoped lookup: an id from another business is "not found".
      const existing = await this.conversations.findOne(tenant.id, request.conversationId);
      if (!existing) throw new NotFoundException("Conversation not found");
      conversationId = existing.id;
      if ((await this.conversations.countMessages(conversationId)) >= MAX_MESSAGES_PER_CONVERSATION) {
        throw new HttpException("This conversation is too long. Please start a new chat.", HttpStatus.TOO_MANY_REQUESTS);
      }
    } else {
      conversationId = await this.conversations.create(tenant.id);
    }

    await this.conversations.appendMessage({
      conversationId,
      tenantId: tenant.id,
      role: "user",
      content: request.message,
    });
    return { tenant, conversationId };
  }

  // Runs the agent on the server-owned history and saves its reply.
  async reply(turn: PreparedTurn, onEvent: (event: AgentEvent) => void, signal: AbortSignal) {
    const history = await this.conversations.recentMessages(turn.conversationId);
    const result = await this.agent.respond(
      { tenant: turn.tenant, conversationId: turn.conversationId, history },
      onEvent,
      signal,
    );
    await this.conversations.appendMessage({
      conversationId: turn.conversationId,
      tenantId: turn.tenant.id,
      role: "assistant",
      content: result.text,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });
    return result;
  }

  async widgetConfig(slug: string) {
    const tenant = await this.tenants.findBySlug(slug);
    if (!tenant) throw new NotFoundException("Unknown business");
    const settings = await this.settings.get(tenant.id);
    return {
      tenantSlug: tenant.slug,
      businessName: tenant.name,
      agentName: settings.agentName,
      greeting: settings.greeting,
      suggestedQuestions: settings.suggestedQuestions,
    };
  }
}
