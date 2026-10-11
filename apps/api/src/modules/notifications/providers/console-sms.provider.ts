import { Logger } from "@nestjs/common";
import { maskPhone } from "../../../common/logging/mask";
import type { SmsMessage, SmsProvider, SmsResult } from "../sms-provider";

// Development: prints the text instead of sending it. No account needed.
// The number is masked (PII); the body is shown so developers can check the wording.
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";
  private readonly logger = new Logger("SMS");

  async send({ to, body }: SmsMessage): Promise<SmsResult> {
    this.logger.log(`📱 to ${maskPhone(to)}: ${body}`);
    return { ok: true, id: `console_${Date.now()}` };
  }
}
