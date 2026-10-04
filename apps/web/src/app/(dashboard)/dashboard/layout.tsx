import { AppShell } from "@/shared/components/app-shell";

// Later, the business name comes from the signed-in organization.
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <AppShell businessName="Rapid Plumbing">{children}</AppShell>;
}
