import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Tenant } from "../../modules/tenants/tenant.types";
import type { AuthenticatedRequest } from "./auth.guard";

// Gives a controller the authenticated business:  list(@CurrentTenant() tenant: Tenant)
// The tenant always comes from the verified token, never from the URL or body.
export const CurrentTenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Tenant =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().tenant,
);
