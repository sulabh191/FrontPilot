import { Sidebar } from "./sidebar";

type AppShellProps = {
  businessName: string;
  children: React.ReactNode;
};

// The frame around every dashboard page: sidebar on the left, page content on the right.
export function AppShell({ businessName, children }: AppShellProps) {
  return (
    <div className="bg-muted/40 flex min-h-screen">
      <Sidebar businessName={businessName} />
      <main className="flex-1 overflow-x-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
