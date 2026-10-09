import { Logger } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { beforeAll, describe, expect, it } from "vitest";
import type { Env } from "../../config/env.schema";
import { DevTokenVerifier } from "./dev-token.verifier";

const SECRET = "a-long-development-secret-123";

// A fake ConfigService: just the two settings the verifier reads.
function verifierWith(token: string | undefined) {
  const values: Record<string, unknown> = { DEV_AUTH_TOKEN: token, DEV_TENANT_SLUG: "rapid-plumbing" };
  const config = { get: (key: string) => values[key] } as unknown as ConfigService<Env, true>;
  return new DevTokenVerifier(config);
}

describe("DevTokenVerifier", () => {
  beforeAll(() => Logger.overrideLogger(false));

  it("accepts the configured token and names its business", async () => {
    await expect(verifierWith(SECRET).verify(SECRET)).resolves.toEqual({ tenantSlug: "rapid-plumbing" });
  });

  it("rejects a wrong token of the same length", async () => {
    const wrong = SECRET.replace(/.$/, "X");
    await expect(verifierWith(SECRET).verify(wrong)).resolves.toBeNull();
  });

  it("rejects shorter and longer tokens without throwing", async () => {
    // timingSafeEqual throws on different lengths; the verifier must check length first.
    await expect(verifierWith(SECRET).verify(SECRET.slice(0, 5))).resolves.toBeNull();
    await expect(verifierWith(SECRET).verify(`${SECRET}-extra`)).resolves.toBeNull();
  });

  it("rejects everything when no token is configured", async () => {
    await expect(verifierWith(undefined).verify("")).resolves.toBeNull();
    await expect(verifierWith(undefined).verify("anything")).resolves.toBeNull();
  });
});
