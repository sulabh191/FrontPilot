import { Clock } from "lucide-react";
import type { Appointment } from "../types";

export function ApprovalBanner({ appointments }: { appointments: Appointment[] }) {
  const pending = appointments.filter((a) => a.status === "Awaiting approval");
  if (pending.length === 0) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <Clock className="size-4 shrink-0" />
      <p>
        <span className="font-medium">
          {pending.length} booking{pending.length > 1 ? "s" : ""} waiting for your approval.
        </span>{" "}
        Approve or decline them below. Customers were told their time is pending.
      </p>
    </div>
  );
}
