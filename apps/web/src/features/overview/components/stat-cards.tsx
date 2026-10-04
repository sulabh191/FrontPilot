import { Card, CardContent } from "@/shared/ui/card";
import type { Stat } from "../types";

export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent>
            <p className="text-muted-foreground text-sm">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
            <p className="mt-1 text-xs text-emerald-600">{stat.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
