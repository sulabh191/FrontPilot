import "server-only";
import type { SmsProvider } from "../types";

// Development provider: prints the text instead of sending it. No account needed.
export const consoleProvider: SmsProvider = {
  name: "console",
  async send({ to, body }) {
    console.info(`\n📱 [sms → ${to}]\n${body}\n`);
    return { ok: true, id: `console_${Date.now()}` };
  },
};
