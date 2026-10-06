import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module";

// Root module: every feature module is registered here.
@Module({
  imports: [HealthModule],
})
export class AppModule {}
