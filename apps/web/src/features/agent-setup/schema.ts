import { z } from "zod";

export const toneOptions = ["friendly", "professional", "casual"] as const;
export const approvalModes = ["review", "auto"] as const;

export const toolKeys = ["answerQuestions", "qualifyLeads", "bookAppointments", "followUps"] as const;
export type ToolKey = (typeof toolKeys)[number];

// One schema is the single source of truth: it validates input on the server
// AND defines the TypeScript type used everywhere else.
export const agentSettingsSchema = z.object({
  agentName: z.string().trim().min(2, "Give your agent a name (at least 2 characters).").max(40),
  greeting: z.string().trim().min(5, "Write a short greeting.").max(200),
  tone: z.enum(toneOptions),
  instructions: z.string().trim().max(2000, "Keep instructions under 2,000 characters."),
  tools: z.object({
    answerQuestions: z.boolean(),
    qualifyLeads: z.boolean(),
    bookAppointments: z.boolean(),
    followUps: z.boolean(),
  }),
  approvalMode: z.enum(approvalModes),
  suggestedQuestions: z
    .array(z.string().trim().min(2, "Each option needs at least 2 characters.").max(40, "Keep each option under 40 characters."))
    .max(4),
});

export const MAX_SUGGESTED_QUESTIONS = 4;

export type AgentSettings = z.infer<typeof agentSettingsSchema>;
