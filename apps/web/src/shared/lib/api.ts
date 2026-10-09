import "server-only";
import { createApiClient, type ApiClient } from "@frontpilot/api-client";

// The web server's connections to the FrontPilot API.
// "server-only" keeps API_TOKEN out of the browser bundle: only Server
// Components and Server Actions can import this file.
let client: ApiClient | undefined;
let publicClient: ApiClient | undefined;

function apiUrl(): string {
  const baseUrl = process.env.API_URL;
  if (!baseUrl) throw new Error("API_URL must be set in apps/web/.env.local");
  return baseUrl;
}

// For the dashboard: sends the business's token, so the API knows whose data to return.
export function getApi(): ApiClient {
  if (!client) {
    const token = process.env.API_TOKEN;
    if (!token) throw new Error("API_TOKEN must be set in apps/web/.env.local");
    client = createApiClient({ baseUrl: apiUrl(), token });
  }
  return client;
}

// For public endpoints (widget config): no token. Calling them exactly as a
// stranger's website would means we never rely on access the public doesn't have.
export function getPublicApi(): ApiClient {
  publicClient ??= createApiClient({ baseUrl: apiUrl() });
  return publicClient;
}
