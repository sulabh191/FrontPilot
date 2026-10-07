import { z } from "zod";

// Every environment variable the API uses, validated once at startup.
// A missing or malformed value stops the app immediately with a clear message,
// instead of failing later in the middle of a request.
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url({ message: "DATABASE_URL must be a postgres:// URL" }),
  // Browser origins allowed to call the API (comma-separated), e.g. the web app.
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),
  // Development-only auth: a shared secret that acts as the demo business's login.
  // Replaced by a real identity provider later. Leave empty to disable.
  DEV_AUTH_TOKEN: z.string().min(16, "DEV_AUTH_TOKEN must be at least 16 characters").optional(),
  DEV_TENANT_SLUG: z.string().default("rapid-plumbing"),
  // Claude. The key is optional so the API can start without it; the agent reports a clear error.
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().default("claude-haiku-4-5-20251001"),
  // SMS: "console" prints texts in the log (development), "twilio" sends real ones.
  SMS_PROVIDER: z.enum(["console", "twilio"]).default("console"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
})
  // Cross-field rule: choosing Twilio requires its three credentials.
  .superRefine((env, ctx) => {
    if (env.SMS_PROVIDER !== "twilio") return;
    for (const key of ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"] as const) {
      if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: "required when SMS_PROVIDER=twilio" });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return result.data;
}
