import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { getInitials } from "@/shared/lib/format";
import { Separator } from "@/shared/ui/separator";
import { SidebarNav } from "./sidebar-nav";

type SidebarProps = {
  businessName: string;
};

export function Sidebar({ businessName }: SidebarProps) {
  const initials = getInitials(businessName);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <Link href="/" className="px-6 py-5 text-lg font-semibold tracking-tight">
        Front<span className="text-indigo-600">Pilot</span>
      </Link>

      <div className="mx-3 mb-4 flex items-center gap-3 rounded-lg border px-3 py-2">
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Business</p>
          <p className="truncate text-sm font-medium">{businessName}</p>
        </div>
      </div>

      <SidebarNav />

      <Separator />
      <Link
        href="/demo/rapid-plumbing"
        className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground hover:text-foreground"
      >
        <ExternalLink className="size-4" />
        View demo website
      </Link>
    </aside>
  );
}
