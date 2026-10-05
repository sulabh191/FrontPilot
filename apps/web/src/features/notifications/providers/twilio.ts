import "server-only";
import type { SmsProvider } from "../types";

// Real SMS through Twilio's REST API. Plain fetch, no SDK needed.
// Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER.
export function createTwilioProvider(): SmsProvider {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    throw new Error("Twilio is selected but TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER are missing");
  }

  return {
    name: "twilio",
    async send({ to, body }) {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      });
      const data = (await response.json().catch(() => ({}))) as { sid?: string; message?: string };
      if (!response.ok || !data.sid) {
        return { ok: false, error: data.message ?? `Twilio returned ${response.status}` };
      }
      return { ok: true, id: data.sid };
    },
  };
}
