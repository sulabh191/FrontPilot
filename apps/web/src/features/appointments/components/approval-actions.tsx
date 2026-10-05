"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { approveAppointment, declineAppointment, type ApprovalResult } from "../server/actions";

// Approve / Decline buttons for one appointment awaiting approval.
export function ApprovalActions({ appointmentId }: { appointmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: (id: string) => Promise<ApprovalResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action(appointmentId);
      // On success the page refreshes and this row changes; only errors need showing.
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button size="sm" disabled={isPending} onClick={() => run(approveAppointment)}>
          <Check /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(declineAppointment)}
        >
          <X /> Decline
        </Button>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
