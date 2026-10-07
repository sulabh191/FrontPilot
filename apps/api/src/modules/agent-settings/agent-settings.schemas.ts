import { z } from "zod";

// Same rules as the web form: one definition validates the API request
// and documents it. Exported so the agent module can read settings later.
export const agentSettingsSchema = z.object({
  agentName: z.string().trim().min(2, "Give your agent a name (at least 2 characters).").max(40),
  greeting: z.string().trim().min(5, "Write a short greeting.").max(200),
  tone: z.enum(["friendly", "professional", "casual"]),
  instructions: z.string().trim().max(2000, "Keep instructions under 2,000 characters."),
  tools: z.object({
    answerQuestions: z.boolean(),
    qualifyLeads: z.boolean(),
    bookAppointments: z.boolean(),
    followUps: z.boolean(),
  }),
  approvalMode: z.enum(["review", "auto"]),
  suggestedQuestions: z
    .array(
      z
        .string()
        .trim()
        .min(2, "Each option needs at least 2 characters.")
        .max(40, "Keep each option under 40 characters."),
    )
    .max(4),
});

export type AgentSettings = z.infer<typeof agentSettingsSchema>;
