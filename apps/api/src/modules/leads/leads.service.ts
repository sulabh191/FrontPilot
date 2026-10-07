import { Injectable } from "@nestjs/common";
import { LeadsRepository } from "./leads.repository";
import type { ListLeadsQuery } from "./leads.schemas";

// Business logic layer. Thin for now; rules (e.g. lead scoring) grow here, not in controllers.
@Injectable()
export class LeadsService {
  constructor(private readonly repo: LeadsRepository) {}

  async list(tenantId: string, filter: ListLeadsQuery) {
    const rows = await this.repo.findAll(tenantId, filter);
    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        smsConsent: row.smsConsent,
        service: row.service,
        score: row.score,
        stage: row.stage,
        estimatedValue: row.estimatedValue,
        source: row.source,
        conversationId: row.conversationId,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }
}
