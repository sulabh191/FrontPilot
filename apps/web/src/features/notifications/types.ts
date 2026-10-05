export type SmsMessage = {
  to: string; // E.164, e.g. "+14135550123"
  body: string;
};

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

// Every SMS provider implements this one function. Swapping providers
// (console → Twilio → another) changes configuration, not callers.
export type SmsProvider = {
  name: string;
  send: (message: SmsMessage) => Promise<SendResult>;
};
