import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./common/auth/auth.module";
import { RequestContextMiddleware } from "./common/middleware/request-context.middleware";
import { validateEnv } from "./config/env.schema";
import { DatabaseModule } from "./database/database.module";
import { AgentSettingsModule } from "./modules/agent-settings/agent-settings.module";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { AvailabilityModule } from "./modules/availability/availability.module";
import { ConversationsModule } from "./modules/conversations/conversations.module";
import { HealthModule } from "./modules/health/health.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { OverviewModule } from "./modules/overview/overview.module";
import { TenantsModule } from "./modules/tenants/tenants.module";

// Root module: every feature module is registered here.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"], // apps/api/.env.local (ignored by Git)
      validate: validateEnv,
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    TenantsModule,
    OverviewModule,
    LeadsModule,
    ConversationsModule,
    AppointmentsModule,
    AvailabilityModule,
    AgentSettingsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes("*path");
  }
}
