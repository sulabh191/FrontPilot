import { type ExecutionContext, Logger, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Tenant } from "../../modules/tenants/tenant.types";
import { TenantsService } from "../../modules/tenants/tenants.service";
import { AuthGuard } from "./auth.guard";
import { Public } from "./public.decorator";
import { TOKEN_VERIFIER } from "./token-verifier";

// The guard is real; the token verifier and the tenant lookup are fakes injected through DI.

const tenant: Tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Rapid Plumbing",
  slug: "rapid-plumbing",
  timeZone: "America/New_York",
};

// Real decorators on example classes, so the guard reads real @Public() metadata.
class ExampleController {
  @Public()
  openRoute() {}
  protectedRoute() {}
}
@Public()
class PublicController {
  anyRoute() {}
}

type FakeRequest = { headers: Record<string, string>; header(name: string): string | undefined; tenant?: Tenant };

// The guard only needs: which handler/class is being called, and the request.
function contextFor(handler: object, cls: object, authorization?: string) {
  const request: FakeRequest = {
    headers: authorization ? { authorization } : {},
    header(name) {
      return this.headers[name.toLowerCase()];
    },
  };
  const context = {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

const protectedRoute = (authorization?: string) =>
  contextFor(ExampleController.prototype.protectedRoute, ExampleController, authorization);

describe("AuthGuard", () => {
  let guard: AuthGuard;
  const verifier = { verify: vi.fn() };
  const tenants = { findBySlug: vi.fn() };

  beforeAll(() => Logger.overrideLogger(false));

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthGuard,
        Reflector,
        { provide: TOKEN_VERIFIER, useValue: verifier },
        { provide: TenantsService, useValue: tenants },
      ],
    }).compile();
    guard = moduleRef.get(AuthGuard);
  });

  it("lets a @Public() route through without looking at any token", async () => {
    const { context } = contextFor(ExampleController.prototype.openRoute, ExampleController);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it("lets every route of a @Public() controller through", async () => {
    const { context } = contextFor(PublicController.prototype.anyRoute, PublicController);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it.each([
    ["no Authorization header", undefined],
    ["a different scheme", "Basic dXNlcjpwYXNz"],
    ["'Bearer' with no token", "Bearer"],
  ])("rejects %s with 401 before asking the verifier", async (_label, header) => {
    const { context } = protectedRoute(header);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow("Missing bearer token");
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it("rejects a token the verifier doesn't recognise", async () => {
    verifier.verify.mockResolvedValue(null);
    const { context } = protectedRoute("Bearer wrong-token");

    await expect(guard.canActivate(context)).rejects.toThrow("Invalid token");
    expect(tenants.findBySlug).not.toHaveBeenCalled();
  });

  it("rejects a valid token whose business no longer exists", async () => {
    verifier.verify.mockResolvedValue({ tenantSlug: "closed-down" });
    tenants.findBySlug.mockResolvedValue(null);

    await expect(guard.canActivate(protectedRoute("Bearer old-token").context)).rejects.toThrow("Unknown business");
  });

  it("attaches the token's business to the request (never one chosen by the caller)", async () => {
    verifier.verify.mockResolvedValue({ tenantSlug: "rapid-plumbing" });
    tenants.findBySlug.mockResolvedValue(tenant);
    const { context, request } = protectedRoute("Bearer good-token");

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifier.verify).toHaveBeenCalledWith("good-token");
    expect(tenants.findBySlug).toHaveBeenCalledWith("rapid-plumbing"); // from the token
    expect(request.tenant).toEqual(tenant); // what @CurrentTenant() reads
  });
});
