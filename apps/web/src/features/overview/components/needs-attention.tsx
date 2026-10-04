import Link from "next/link";
import { getInitials } from "@/shared/lib/format";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { AttentionItem } from "../types";

export function NeedsAttention({ items }: { items: AttentionItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs your attention</CardTitle>
        <CardAction>
          <Link href="/dashboard/conversations" className="text-sm text-indigo-600 hover:underline">
            All conversations
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">You&apos;re all caught up.</p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar>
                  <AvatarFallback>{getInitials(item.customer)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.customer}</p>
                  <p className="text-muted-foreground truncate text-sm">&ldquo;{item.message}&rdquo;</p>
                  <p className="mt-1 text-xs text-amber-600">
                    {item.reason} · {item.receivedAt}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
