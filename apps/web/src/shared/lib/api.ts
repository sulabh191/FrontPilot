import "server-only";
import { createApiClient, type ApiClient } from "@frontpilot/api-client";

// The dashboard's connection to the FrontPilot API.
// "server-only" keeps API_TOKEN out of the browser bundle: only Server
// Components and Server Actions can import this file.
let client: ApiClient | undefined;

export function getApi(): ApiClient {
  if (!client) {
    const baseUrl = process.env.API_URL;
    const token = process.env.API_TOKEN;
    if (!baseUrl || !token) {
      throw new Error("API_URL and API_TOKEN must be set in apps/web/.env.local");
    }
    client = createApiClient({ baseUrl, token });
  }
  return client;
}
