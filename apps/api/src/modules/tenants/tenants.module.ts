import { Module } from "@nestjs/common";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";

@Module({
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService], // the auth guard needs it
})
export class TenantsModule {}
