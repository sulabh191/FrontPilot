import { Inject, Injectable } from "@nestjs/common";
import { eq, tenants, type Database } from "@frontpilot/db";
import { DATABASE } from "../../database/database.constants";
import type { Tenant } from "./tenant.types";

@Injectable()
export class TenantsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findBySlug(slug: string): Promise<Tenant | null> {
    const [row] = await this.db
      .select({ id: tenants.id, name: tenants.name, slug: tenants.slug, timeZone: tenants.timeZone })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    return row ?? null;
  }
}
