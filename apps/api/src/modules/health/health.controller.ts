import { Controller, Get } from "@nestjs/common";

// Used by hosting platforms and monitoring to check the service is alive.
@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      status: "ok",
      service: "frontpilot-api",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
