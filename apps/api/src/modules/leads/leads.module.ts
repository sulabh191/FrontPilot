import { Module } from "@nestjs/common";
import { LeadsController } from "./leads.controller";
import { LeadsRepository } from "./leads.repository";
import { LeadsService } from "./leads.service";

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, LeadsRepository],
})
export class LeadsModule {}
