import { Module } from "@nestjs/common";
import { AvailabilityController } from "./availability.controller";
import { AvailabilityRepository } from "./availability.repository";
import { AvailabilityService } from "./availability.service";

@Module({
  controllers: [AvailabilityController],
  providers: [AvailabilityService, AvailabilityRepository],
  exports: [AvailabilityService], // the agent's check_availability tool (phase E)
})
export class AvailabilityModule {}
