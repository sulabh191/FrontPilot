import type { SmsMessage, SmsProvider, SmsResult } from "../sms-provider";

type TwilioConfig = { accountSid: string; authToken: string; fromNumber: string };

// Real SMS through Twilio's REST API (plain fetch, no SDK).
export class TwilioSmsProvider implements SmsProvider {
  readonly name = "twilio";

  constructor(private readonly config: TwilioConfig) {}

  async send({ to, body }: SmsMessage): Promise<SmsResult> {
    const { accountSid, authToken, fromNumber } = this.config;
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
    });
    const data = (await response.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (!response.ok || !data.sid) {
      return { ok: false, error: data.message ?? `Twilio returned ${response.status}` };
    }
    return { ok: true, id: data.sid };
  }
}
