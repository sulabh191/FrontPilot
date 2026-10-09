import "server-only";
import { ApiError, unwrap } from "@frontpilot/api-client";
import { getPublicApi } from "@/shared/lib/api";
import type { WidgetConfig } from "../types";

// The widget's public settings, from the API's public endpoint.
// The API picks only safe fields (name, greeting, starter questions);
// private instructions and tool settings never leave the server.
export async function getWidgetConfig(slug: string): Promise<WidgetConfig | null> {
  try {
    return unwrap(await getPublicApi().GET("/v1/widget/{slug}", { params: { path: { slug } } }));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null; // unknown business
    throw error;
  }
}
