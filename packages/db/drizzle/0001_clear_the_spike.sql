ALTER TABLE "tenants" ADD COLUMN "time_zone" text DEFAULT 'America/New_York' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "opening_hours" jsonb;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "appointment_minutes" integer DEFAULT 60 NOT NULL;