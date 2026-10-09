"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/shared/ui/button";

// Shown when a dashboard page can't load its data, most often because the
// FrontPilot API is down or unreachable. Next.js passes the error and a reset()
// function that re-renders the page (re-fetching the data).
export function ServiceUnavailable({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <h2 className="text-lg font-semibold">We can&apos;t load your dashboard right now</h2>
      <p className="text-muted-foreground text-sm">
        FrontPilot is having trouble reaching its servers. Your data is safe; please try again in
        a moment.
      </p>
      <Button onClick={reset}>
        <RotateCw /> Try again
      </Button>
      {/* In production Next.js hides the real message; the digest links this to the server log. */}
      {error.digest && <p className="text-muted-foreground text-xs">Reference: {error.digest}</p>}
    </div>
  );
}
