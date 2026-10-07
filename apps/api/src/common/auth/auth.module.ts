import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TenantsModule } from "../../modules/tenants/tenants.module";
import { AuthGuard } from "./auth.guard";
import { DevTokenVerifier } from "./dev-token.verifier";
import { TOKEN_VERIFIER } from "./token-verifier";

@Module({
  imports: [TenantsModule],
  providers: [
    // Swap this one line for a real provider (e.g. SupabaseTokenVerifier) later.
    { provide: TOKEN_VERIFIER, useClass: DevTokenVerifier },
    // APP_GUARD = applied to every route in the app.
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
