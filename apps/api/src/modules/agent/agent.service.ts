import { Inject, Injectable } from "@nestjs/common";
import { AgentSettingsService } from "../agent-settings/agent-settings.service";
import type { Tenant } from "../tenants/tenant.types";
import { BusinessFactsService } from "./knowledge/business-facts.service";
import { buildSystemPrompt } from "./prompt/system-prompt";
import { AGENT_RUNNER, type AgentEvent, type AgentMessage, type AgentRunner } from "./runner/agent-runner";
import { ToolRegistry } from "./tools/tool-registry.service";

export type RespondInput = {
  tenant: Tenant;
  conversationId: string | null; // null = preview (nothing is saved or booked)
  history: AgentMessage[];
};

// The agent's front door: gathers what one reply needs, then hands off to the runner.
// It knows nothing about HTTP or streaming formats; callers decide what to do with events.
@Injectable()
export class AgentService {
  constructor(
    private readonly settings: AgentSettingsService,
    private readonly facts: BusinessFactsService,
    private readonly tools: ToolRegistry,
    @Inject(AGENT_RUNNER) private readonly runner: AgentRunner,
  ) {}

  async respond(input: RespondInput, onEvent: (event: AgentEvent) => void, signal?: AbortSignal) {
    const preview = input.conversationId === null;
    const [settings, businessFacts] = await Promise.all([
      this.settings.get(input.tenant.id),
      this.facts.forTenant(input.tenant.id),
    ]);

    const system = buildSystemPrompt({
      businessName: input.tenant.name,
      settings,
      businessFacts,
      now: new Date(),
      timeZone: input.tenant.timeZone,
      previewMode: preview,
    });

    return this.runner.run(
      {
        system,
        history: input.history,
        tools: this.tools.enabledFor(settings, { preview }),
        context: { tenant: input.tenant, conversationId: input.conversationId, settings },
      },
      onEvent,
      signal,
    );
  }
}
