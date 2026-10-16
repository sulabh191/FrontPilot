CREATE TYPE "public"."knowledge_source" AS ENUM('text', 'markdown', 'pdf', 'docx', 'url');--> statement-breakpoint
CREATE TYPE "public"."knowledge_status" AS ENUM('processing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "knowledge_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"title" text NOT NULL,
	"source_type" "knowledge_source" NOT NULL,
	"file_name" text,
	"source_url" text,
	"content_hash" text NOT NULL,
	"status" "knowledge_status" DEFAULT 'processing' NOT NULL,
	"error" text,
	"embedding_model" text NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_documents_tenant_created_idx" ON "knowledge_documents" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_documents_tenant_hash_unique" ON "knowledge_documents" USING btree ("tenant_id","content_hash");