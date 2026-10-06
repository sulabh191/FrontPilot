import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./config/env.schema";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./modules/health/health.module";

// Root module: every feature module is registered here.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"], // apps/api/.env.local (ignored by Git)
      validate: validateEnv,
    }),
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
