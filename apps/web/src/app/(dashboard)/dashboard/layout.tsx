import { AppShell } from "@/shared/components/app-shell";
import { getCurrentTenant } from "@/shared/lib/tenant";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const tenant = await getCurrentTenant();
  return <AppShell businessName={tenant.name}>{children}</AppShell>;
}
