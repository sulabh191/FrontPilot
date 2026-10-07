import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./schema";

// Typed client for the FrontPilot API, generated from apps/api/openapi.json.
// Every path, query param, request body and response is checked by TypeScript:
// rename a field in the API, regenerate, and every caller that breaks shows up.

export type { components, paths };

export type ApiClientOptions = {
  baseUrl: string;
  token?: string; // owner endpoints need a bearer token; public ones don't
};

export function createApiClient({ baseUrl, token }: ApiClientOptions) {
  const client = createClient<paths>({ baseUrl });
  if (token) {
    const auth: Middleware = {
      onRequest({ request }) {
        request.headers.set("Authorization", `Bearer ${token}`);
        return request;
      },
    };
    client.use(auth);
  }
  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;

// Our standard error body (see the API's exception filter).
export type ApiErrorBody = {
  error: { statusCode: number; code: string; message: string; details?: unknown; requestId: string };
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody | undefined,
  ) {
    super(body?.error.message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
  }
}

// Unwraps an openapi-fetch result: returns the data or throws ApiError.
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.data !== undefined && !result.error) return result.data;
  throw new ApiError(result.response.status, result.error as ApiErrorBody | undefined);
}
