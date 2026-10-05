import { ToneBadge, type Tone } from "@/shared/components/tone-badge";
import { Card } from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import type { Appointment, AppointmentStatus } from "../types";
import { ApprovalActions } from "./approval-actions";

const statusTone: Record<AppointmentStatus, Tone> = {
  Confirmed: "success",
  "Awaiting approval": "warning",
  Cancelled: "danger",
};

export function AppointmentsTable({ appointments }: { appointments: Appointment[] }) {
  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">When</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Booked by</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((a) => (
            <TableRow key={a.id} className={a.status === "Cancelled" ? "opacity-60" : undefined}>
              <TableCell className="pl-4">
                <p className="font-medium">{a.date}</p>
                <p className="text-muted-foreground text-xs">{a.time}</p>
              </TableCell>
              <TableCell>
                <p className="font-medium">{a.customer}</p>
                <p className="text-muted-foreground text-xs">{a.address}</p>
              </TableCell>
              <TableCell>{a.service}</TableCell>
              <TableCell className="text-muted-foreground">{a.bookedBy}</TableCell>
              <TableCell>
                <ToneBadge tone={statusTone[a.status]}>{a.status}</ToneBadge>
              </TableCell>
              <TableCell className="pr-4 text-right">
                {a.status === "Awaiting approval" && <ApprovalActions appointmentId={a.id} />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
