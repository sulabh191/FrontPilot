import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it } from "vitest";
import type { AgentSettings } from "../../agent-settings/agent-settings.schemas";
import { BookAppointmentTool } from "./book-appointment.tool";
import { CheckAvailabilityTool } from "./check-availability.tool";
import { SuggestRepliesTool } from "./suggest-replies.tool";
import { ToolRegistry } from "./tool-registry.service";

// Fake tools: only their names and side-effect flags matter here.
const fakeTool = (name: string, sideEffects: boolean) => ({
  definition: { name, input_schema: { type: "object" as const } },
  sideEffects,
  execute: async () => ({ content: "" }),
});

const settings = (bookAppointments: boolean) =>
  ({ tools: { answerQuestions: true, qualifyLeads: true, bookAppointments, followUps: false } }) as AgentSettings;

const names = (tools: { definition: { name: string } }[]) => tools.map((tool) => tool.definition.name);

describe("ToolRegistry", () => {
  let registry: ToolRegistry;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ToolRegistry,
        { provide: SuggestRepliesTool, useValue: fakeTool("suggest_replies", false) },
        { provide: CheckAvailabilityTool, useValue: fakeTool("check_availability", false) },
        { provide: BookAppointmentTool, useValue: fakeTool("book_appointment", true) },
      ],
    }).compile();
    registry = moduleRef.get(ToolRegistry);
  });

  it("offers only suggested replies when booking is turned off", () => {
    expect(names(registry.enabledFor(settings(false), { preview: false }))).toEqual(["suggest_replies"]);
  });

  it("offers the booking tools when the owner turned booking on", () => {
    expect(names(registry.enabledFor(settings(true), { preview: false }))).toEqual([
      "suggest_replies",
      "check_availability",
      "book_appointment",
    ]);
  });

  it("never offers a tool with side effects in preview mode", () => {
    expect(names(registry.enabledFor(settings(true), { preview: true }))).toEqual([
      "suggest_replies",
      "check_availability",
    ]);
  });

  it("knows which tool is display-only", () => {
    expect(registry.isDisplayOnly("suggest_replies")).toBe(true);
    expect(registry.isDisplayOnly("book_appointment")).toBe(false);
  });
});
