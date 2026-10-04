import Link from "next/link";
import { Badge } from "@/shared/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { UpcomingAppointment } from "../types";

export function UpcomingAppointments({ appointments }: { appointments: UpcomingAppointment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming appointments</CardTitle>
        <CardAction>
          <Link href="/dashboard/appointments" className="text-sm text-indigo-600 hover:underline">
            View all
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {appointments.map((appt) => (
            <li
              key={appt.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{appt.customer}</p>
                <p className="text-muted-foreground text-xs">
                  {appt.service} · {appt.when}
                </p>
              </div>
              <Badge variant={appt.status === "Confirmed" ? "secondary" : "outline"}>
                {appt.status}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
