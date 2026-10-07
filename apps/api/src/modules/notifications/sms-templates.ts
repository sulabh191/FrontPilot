// The wording of every customer text, in one place.
type BookingInfo = { businessName: string; customerName: string; when: string; service: string };

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export const smsTemplates = {
  bookingConfirmed: (b: BookingInfo) =>
    `Hi ${firstName(b.customerName)}, your ${b.businessName} visit (${b.service}) is confirmed for ${b.when}. Reply STOP to opt out.`,

  bookingDeclined: (b: BookingInfo) =>
    `Hi ${firstName(b.customerName)}, sorry, ${b.businessName} can't make ${b.when}. We'll contact you shortly to find another time. Reply STOP to opt out.`,
};
