// Personal data must not appear in plain text in logs: logs are shipped to other
// tools, kept for months and read by people who don't need customers' details.
// Mask what identifies a person, keeping just enough to debug ("which number was it?").

const DOT = "•";

// "+14135550123"   → "+1••••••0123"   (country code + last 4 digits)
// "(413) 555-0123" → "••••••0123"
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "(none)";
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length <= 4) return DOT.repeat(3); // too short to keep any digits safely

  const last4 = digits.slice(-4);
  // International format: keep the country code (digits before the 10-digit national number).
  const countryCode = trimmed.startsWith("+") && digits.length > 10 ? digits.slice(0, digits.length - 10) : "";
  const hidden = digits.length - countryCode.length - last4.length;
  return `${countryCode ? `+${countryCode}` : ""}${DOT.repeat(hidden)}${last4}`;
}
