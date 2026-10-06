import { Controller, Get, Inject } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { sql, type Database } from "@frontpilot/db";
import { DATABASE } from "../../database/database.constants";

// Used by hosting platforms and monitoring to check the service is alive.
@ApiTags("health")
@Controller("health")
export class HealthController {
  // The database is injected: this class never creates a connection itself.
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @Get()
  @ApiOperation({ summary: "Service and database status" })
  async check() {
    const database = await this.db
      .execute(sql`select 1`)
      .then(() => "up" as const)
      .catch(() => "down" as const);

    return {
      status: database === "up" ? "ok" : "degraded",
      service: "frontpilot-api",
      checks: { database },
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
