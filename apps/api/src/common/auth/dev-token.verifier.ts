import { timingSafeEqual } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../../config/env.schema";
import type { TokenVerifier, VerifiedIdentity } from "./token-verifier";

// Development login: one shared secret from .env.local stands for the demo business.
// Never used in production; a real identity provider replaces it.
@Injectable()
export class DevTokenVerifier implements TokenVerifier {
  private readonly logger = new Logger(DevTokenVerifier.name);
  private readonly expected: Buffer | null;
  private readonly tenantSlug: string;

  constructor(config: ConfigService<Env, true>) {
    const token = config.get("DEV_AUTH_TOKEN", { infer: true });
    this.expected = token ? Buffer.from(token) : null;
    this.tenantSlug = config.get("DEV_TENANT_SLUG", { infer: true });
    if (!token) this.logger.warn("DEV_AUTH_TOKEN is not set: all protected endpoints will return 401");
  }

  async verify(token: string): Promise<VerifiedIdentity | null> {
    if (!this.expected) return null;
    const given = Buffer.from(token);
    // Constant-time comparison: response timing doesn't reveal how much of the token matched.
    const matches = given.length === this.expected.length && timingSafeEqual(given, this.expected);
    return matches ? { tenantSlug: this.tenantSlug } : null;
  }
}
