import { Logger } from "@nestjs/common";
import type { SmsMessage, SmsProvider, SmsResult } from "../sms-provider";

// Development: prints the text instead of sending it. No account needed.
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";
  private readonly logger = new Logger("SMS");

  async send({ to, body }: SmsMessage): Promise<SmsResult> {
    this.logger.log(`📱 to ${to}: ${body}`);
    return { ok: true, id: `console_${Date.now()}` };
  }
}
