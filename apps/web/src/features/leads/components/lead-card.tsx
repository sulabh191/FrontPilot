import { Card, CardContent } from "@/shared/ui/card";
import { formatCurrency } from "@/shared/lib/format";
import type { Lead } from "../types";
import { LeadScoreBadge } from "./lead-score-badge";

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Card size="sm" className="shadow-none">
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{lead.name}</p>
          <LeadScoreBadge score={lead.score} />
        </div>
        <p className="text-sm text-muted-foreground">{lead.service}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{lead.source}</span>
          <span className="font-medium text-foreground">{formatCurrency(lead.estimatedValue)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{lead.createdAt}</p>
      </CardContent>
    </Card>
  );
}
