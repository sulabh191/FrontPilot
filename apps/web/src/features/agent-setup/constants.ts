import type { AgentSettings, ToolKey } from "./schema";

export const toneLabels: Record<AgentSettings["tone"], { label: string; example: string }> = {
  friendly: { label: "Friendly", example: "Happy to help! We can come by tomorrow at 9." },
  professional: { label: "Professional", example: "We have availability tomorrow at 9:00 AM." },
  casual: { label: "Casual", example: "Sure thing, tomorrow at 9 works for us." },
};

export const toolLabels: Record<ToolKey, { label: string; description: string }> = {
  answerQuestions: {
    label: "Answer questions",
    description: "Reply to visitors using your services, prices and policies.",
  },
  qualifyLeads: {
    label: "Qualify leads",
    description: "Ask about the job, budget and timeline, and score each lead.",
  },
  bookAppointments: {
    label: "Book appointments",
    description: "Offer open time slots and book them for the customer.",
  },
  followUps: {
    label: "Follow up",
    description: "Send reminders before appointments and check in afterwards.",
  },
};
