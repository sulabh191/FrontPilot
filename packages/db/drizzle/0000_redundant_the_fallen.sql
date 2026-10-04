CREATE TYPE "public"."appointment_status" AS ENUM('confirmed', 'awaiting_approval', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."approval_mode" AS ENUM('review', 'auto');--> statement-breakpoint
CREATE TYPE "public"."booked_by" AS ENUM('ai_agent', 'staff');--> statement-breakpoint
CREATE TYPE "public"."channel" AS ENUM('website_chat', 'email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('open', 'needs_owner', 'resolved_by_ai');--> statement-breakpoint
CREATE TYPE "public"."lead_score" AS ENUM('hot', 'warm', 'cold');--> statement-breakpoint
CREATE TYPE "public"."lead_stage" AS ENUM('new', 'qualified', 'booked', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."tone" AS ENUM('friendly', 'professional', 'casual');--> statement-breakpoint
CREATE TABLE "agent_settings" (
	"tenant_id" text PRIMARY KEY NOT NULL,
	"agent_name" text NOT NULL,
	"greeting" text NOT NULL,
	"tone" "tone" DEFAULT 'friendly' NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"tools" jsonb NOT NULL,
	"approval_mode" "approval_mode" DEFAULT 'review' NOT NULL,
	"suggested_questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"lead_id" uuid,
	"customer_name" text NOT NULL,
	"service" text NOT NULL,
	"address" text,
	"starts_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'awaiting_approval' NOT NULL,
	"booked_by" "booked_by" DEFAULT 'ai_agent' NOT NULL,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"channel" "channel" DEFAULT 'website_chat' NOT NULL,
	"customer_name" text,
	"status" "conversation_status" DEFAULT 'open' NOT NULL,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"conversation_id" uuid,
	"name" text NOT NULL,
	"phone" text,
	"service" text NOT NULL,
	"score" "lead_score" DEFAULT 'warm' NOT NULL,
	"stage" "lead_stage" DEFAULT 'new' NOT NULL,
	"estimated_value" integer,
	"source" "channel" DEFAULT 'website_chat' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"tenant_id" text NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "agent_settings" ADD CONSTRAINT "agent_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_tenant_starts_idx" ON "appointments" USING btree ("tenant_id","starts_at");--> statement-breakpoint
CREATE INDEX "conversations_tenant_updated_idx" ON "conversations" USING btree ("tenant_id","updated_at");--> statement-breakpoint
CREATE INDEX "leads_tenant_stage_idx" ON "leads" USING btree ("tenant_id","stage");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id","created_at");