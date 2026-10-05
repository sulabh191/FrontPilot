import "server-only";
import { consoleProvider } from "../providers/console";
import { createTwilioProvider } from "../providers/twilio";
import type { SendResult, SmsProvider } from "../types";
import { toE164 } from "./phone";

let provider: SmsProvider | null = null;

// SMS_PROVIDER=console (default) or twilio
function getProvider(): SmsProvider {
  provider ??= process.env.SMS_PROVIDER === "twilio" ? createTwilioProvider() : consoleProvider;
  return provider;
}

// Sends a text and NEVER throws: a failed SMS must not break a booking or an approval.
// Failures are logged so they can be retried or investigated.
export async function sendSms(rawPhone: string, body: string): Promise<SendResult> {
  const to = toE164(rawPhone);
  if (!to) {
    console.warn(`[sms] skipped: "${rawPhone}" is not a valid phone number`);
    return { ok: false, error: "Invalid phone number" };
  }
  try {
    const result = await getProvider().send({ to, body });
    if (!result.ok) console.error(`[sms] ${getProvider().name} failed: ${result.error}`);
    return result;
  } catch (error) {
    console.error("[sms] provider error", error);
    return { ok: false, error: "Provider error" };
  }
}
