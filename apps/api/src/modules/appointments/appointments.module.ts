import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { AppointmentApprovalsService } from "./appointment-approvals.service";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsRepository } from "./appointments.repository";
import { AppointmentsService } from "./appointments.service";

@Module({
  imports: [NotificationsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository, AppointmentApprovalsService],
  exports: [AppointmentsService, AppointmentsRepository], // approvals and booking (phase D) build on these
})
export class AppointmentsModule {}
