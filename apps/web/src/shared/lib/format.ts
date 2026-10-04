export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

// "10 min ago", "3 hr ago", "yesterday", "Oct 1"
export function formatRelativeTime(date: Date, now = new Date()): string {
  const minutes = Math.round((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// { date: "Mon, Oct 5", time: "9:00 AM" }
export function formatDateParts(date: Date): { date: string; time: string } {
  return {
    date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}
