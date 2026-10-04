import { AppShell } from "@/shared/components/app-shell";
import { getCurrentTenant } from "@/shared/lib/tenant";

// Live data from the database: render on every request, never pre-render at build time.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const tenant = await getCurrentTenant();
  return <AppShell businessName={tenant.name}>{children}</AppShell>;
}
