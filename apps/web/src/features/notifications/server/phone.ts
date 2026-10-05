// Convert what a customer typed ("(413) 555-0123", "413.555.0123") into E.164 ("+14135550123").
// Assumes US/Canada numbers unless the customer included a "+" country code.
export function toE164(phone: string, defaultCountryCode = "1"): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.length === 10) return `+${defaultCountryCode}${digits}`;
  if (digits.length === 11 && digits.startsWith(defaultCountryCode)) return `+${digits}`;
  return null;
}
