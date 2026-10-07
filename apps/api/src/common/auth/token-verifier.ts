// What the auth guard needs from any login system: "whose token is this?"
// The guard depends on this interface, not on a specific provider, so switching
// from the dev token to Supabase/Clerk means adding a new implementation only.
export type VerifiedIdentity = { tenantSlug: string };

export interface TokenVerifier {
  verify(token: string): Promise<VerifiedIdentity | null>;
}

// Injection token for the active TokenVerifier implementation.
export const TOKEN_VERIFIER = Symbol("TOKEN_VERIFIER");
