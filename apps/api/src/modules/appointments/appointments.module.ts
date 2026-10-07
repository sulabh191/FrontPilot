import { Module } from "@nestjs/common";
import { AvailabilityModule } from "../availability/availability.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AppointmentApprovalsService } from "./appointment-approvals.service";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsRepository } from "./appointments.repository";
import { AppointmentsService } from "./appointments.service";
import { BookingService } from "./booking.service";

@Module({
  imports: [NotificationsModule, AvailabilityModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository, AppointmentApprovalsService, BookingService],
  exports: [AppointmentsService, AppointmentsRepository, BookingService], // the agent's booking tool uses BookingService
})
export class AppointmentsModule {}
