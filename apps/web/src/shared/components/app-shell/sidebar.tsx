import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Separator } from "@/shared/ui/separator";
import { SidebarNav } from "./sidebar-nav";

type SidebarProps = {
  businessName: string;
};

export function Sidebar({ businessName }: SidebarProps) {
  const initials = businessName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-64 shrink-0 flex-col border-r">
      <Link href="/" className="px-6 py-5 text-lg font-semibold tracking-tight">
        Front<span className="text-indigo-600">Pilot</span>
      </Link>

      <div className="mx-3 mb-4 flex items-center gap-3 rounded-lg border px-3 py-2">
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">Business</p>
          <p className="truncate text-sm font-medium">{businessName}</p>
        </div>
      </div>

      <SidebarNav />

      <Separator />
      <Link
        href="/demo/rapid-plumbing"
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 px-6 py-4 text-sm"
      >
        <ExternalLink className="size-4" />
        View demo website
      </Link>
    </aside>
  );
}
