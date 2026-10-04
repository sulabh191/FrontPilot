import { cn } from "cn";
import { Badge } from "@/shared/ui/badge";

export type Tone = "success" | "warning" | "danger" | "neutral";

const toneStyles: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  neutral: "bg-muted text-muted-foreground",
};

// A status pill whose color carries meaning. Features map their own statuses to a tone.
export function ToneBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <Badge className={cn("border-transparent", toneStyles[tone])}>{children}</Badge>;
}
