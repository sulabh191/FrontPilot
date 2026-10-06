import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RequestContextMiddleware } from "./common/middleware/request-context.middleware";
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes("*path");
  }
}
