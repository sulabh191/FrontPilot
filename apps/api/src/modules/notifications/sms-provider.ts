// The contract every SMS implementation fulfils. Services depend on this,
// never on Twilio directly, so providers are swapped by configuration and
// tests can inject a fake that records messages instead of sending them.
export type SmsMessage = { to: string; body: string }; // to: E.164, e.g. +14135550123
export type SmsResult = { ok: true; id: string } | { ok: false; error: string };

export interface SmsProvider {
  readonly name: string;
  send(message: SmsMessage): Promise<SmsResult>;
}

export const SMS_PROVIDER = Symbol("SMS_PROVIDER");
