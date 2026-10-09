import "server-only";
import { cache } from "react";
import { unwrap } from "@frontpilot/api-client";
import { getApi } from "./api";

export type Tenant = {
  id: string;
  name: string;
  slug: string; // short public name used in URLs, e.g. /chat/rapid-plumbing
  timeZone: string; // IANA name, e.g. "America/New_York"
};

// The business whose dashboard is being viewed: whoever the API token belongs to.
// When real login arrives, the token comes from the signed-in user's session
// and no caller changes.
// cache() runs this once per request, so the layout and the page share one API call.
export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  return unwrap(await getApi().GET("/v1/me"));
});
