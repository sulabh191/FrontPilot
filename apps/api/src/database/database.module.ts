import { Global, Inject, Logger, Module, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDatabase } from "@frontpilot/db";
import type { Env } from "../config/env.schema";
import { DATABASE } from "./database.constants";

const CONNECTION = Symbol("DATABASE_CONNECTION");

// @Global: registered once, available to every module without importing it again.
@Global()
@Module({
  providers: [
    {
      // Factory provider: built once at startup from validated config.
      provide: CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createDatabase(config.get("DATABASE_URL", { infer: true })),
    },
    {
      provide: DATABASE,
      inject: [CONNECTION],
      useFactory: (connection: ReturnType<typeof createDatabase>) => connection.db,
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(CONNECTION) private readonly connection: ReturnType<typeof createDatabase>) {}

  // Close the connection pool cleanly when the API stops.
  async onApplicationShutdown() {
    await this.connection.close();
    this.logger.log("Database connections closed");
  }
}
