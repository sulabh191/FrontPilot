import Link from "next/link";

// Makes it clear to visitors that this is a demo, not a real company.
export function DemoBanner() {
  return (
    <div className="bg-slate-900 px-4 py-2 text-center text-xs text-slate-200">
      This is a fictional business website built to demo{" "}
      <Link href="/" className="font-semibold text-white underline underline-offset-2">
        FrontPilot
      </Link>
      . Try the chat assistant in the corner.{" "}
      <Link href="/dashboard" className="underline underline-offset-2">
        See the business dashboard
      </Link>
    </div>
  );
}
