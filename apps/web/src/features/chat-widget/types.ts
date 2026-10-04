export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  suggestions?: string[]; // tappable replies shown under this message
};

// The public, safe-to-expose settings the widget needs. Never include
// private settings like internal instructions here: this goes to the browser.
export type WidgetConfig = {
  tenantSlug: string;
  businessName: string;
  agentName: string;
  greeting: string;
  suggestedQuestions: string[];
};
