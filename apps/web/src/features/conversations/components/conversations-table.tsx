import { ToneBadge, type Tone } from "@/shared/components/tone-badge";
import { getInitials } from "@/shared/lib/format";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Card } from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import type { Conversation, ConversationStatus } from "../types";

const statusTone: Record<ConversationStatus, Tone> = {
  "Needs you": "warning",
  Open: "neutral",
  "Resolved by AI": "success",
};

export function ConversationsTable({ conversations }: { conversations: Conversation[] }) {
  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Customer</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(c.customer)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{c.customer}</p>
                    <p className="text-muted-foreground text-xs">{c.messageCount} messages</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="max-w-sm">
                <p className="truncate">{c.summary}</p>
                <p className="text-muted-foreground truncate text-xs">
                  Last: &ldquo;{c.lastMessage}&rdquo;
                </p>
              </TableCell>
              <TableCell className="text-muted-foreground">{c.channel}</TableCell>
              <TableCell>
                <ToneBadge tone={statusTone[c.status]}>{c.status}</ToneBadge>
              </TableCell>
              <TableCell className="text-muted-foreground pr-4 text-right">{c.updatedAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
