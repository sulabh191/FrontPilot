import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { TenantsService } from "../../modules/tenants/tenants.service";
import type { Tenant } from "../../modules/tenants/tenant.types";
import { IS_PUBLIC } from "./public.decorator";
import { TOKEN_VERIFIER, type TokenVerifier } from "./token-verifier";

export type AuthenticatedRequest = Request & { tenant: Tenant };

// Runs before every endpoint (registered globally). It decides WHO is calling,
// so controllers and services never deal with tokens.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKEN_VERIFIER) private readonly verifier: TokenVerifier,
    private readonly tenants: TenantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = (request.header("authorization") ?? "").split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const identity = await this.verifier.verify(token);
    if (!identity) throw new UnauthorizedException("Invalid token");

    const tenant = await this.tenants.findBySlug(identity.tenantSlug);
    if (!tenant) throw new UnauthorizedException("Unknown business");

    request.tenant = tenant; // read later by @CurrentTenant()
    return true;
  }
}
