import { cn } from "cn";
import { Badge } from "@/shared/ui/badge";
import type { LeadScore } from "../types";

const scoreStyles: Record<LeadScore, string> = {
  Hot: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  Warm: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Cold: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
};

export function LeadScoreBadge({ score }: { score: LeadScore }) {
  return <Badge className={cn("border-transparent", scoreStyles[score])}>{score}</Badge>;
}
