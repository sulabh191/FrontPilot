import { formatCurrency } from "@/shared/lib/format";
import { groupByStage } from "../lib/group-by-stage";
import { leadStages, type Lead } from "../types";
import { LeadCard } from "./lead-card";

export function LeadsBoard({ leads }: { leads: Lead[] }) {
  const columns = groupByStage(leads);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {leadStages.map((stage) => {
        const stageLeads = columns[stage];
        const total = stageLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
        return (
          <section key={stage} aria-label={`${stage} leads`} className="bg-muted/60 rounded-xl p-3">
            <header className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">
                {stage} <span className="text-muted-foreground font-normal">({stageLeads.length})</span>
              </h2>
              <span className="text-muted-foreground text-xs">{formatCurrency(total)}</span>
            </header>
            <div className="space-y-3">
              {stageLeads.length === 0 ? (
                <p className="text-muted-foreground px-1 py-6 text-center text-xs">No leads</p>
              ) : (
                stageLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
