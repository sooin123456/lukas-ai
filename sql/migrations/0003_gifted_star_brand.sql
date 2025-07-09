CREATE TABLE "company_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_name" text NOT NULL,
	"file_size" integer,
	"file_type" text NOT NULL,
	"file_url" text,
	"content" text,
	"status" text DEFAULT 'processing' NOT NULL,
	"metadata" jsonb,
	"is_private" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" jsonb,
	"metadata" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_chunks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "document_qa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"document_id" uuid,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"source_chunks" jsonb,
	"confidence" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_qa" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text,
	"tags" jsonb,
	"source_documents" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_base" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "meeting_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"participants" jsonb,
	"settings" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "meeting_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid,
	"summary" text NOT NULL,
	"action_items" jsonb,
	"key_points" jsonb,
	"decisions" jsonb,
	"next_steps" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting_summaries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "meeting_transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid,
	"speaker_id" text,
	"speaker_name" text,
	"content" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"confidence" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting_transcripts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"price" double precision NOT NULL,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"features" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"feature" text NOT NULL,
	"usage_count" double precision DEFAULT 0 NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usage_tracking" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"plan_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_company_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."company_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_qa" ADD CONSTRAINT "document_qa_document_id_company_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."company_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_summaries" ADD CONSTRAINT "meeting_summaries_meeting_id_meeting_sessions_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_transcripts" ADD CONSTRAINT "meeting_transcripts_meeting_id_meeting_sessions_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "company-documents-policy" ON "company_documents" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "company_documents"."user_id") WITH CHECK ((select auth.uid()) = "company_documents"."user_id");--> statement-breakpoint
CREATE POLICY "document-chunks-policy" ON "document_chunks" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = (SELECT user_id FROM company_documents WHERE id = "document_chunks"."document_id")) WITH CHECK ((select auth.uid()) = (SELECT user_id FROM company_documents WHERE id = "document_chunks"."document_id"));--> statement-breakpoint
CREATE POLICY "document-qa-policy" ON "document_qa" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "document_qa"."user_id") WITH CHECK ((select auth.uid()) = "document_qa"."user_id");--> statement-breakpoint
CREATE POLICY "knowledge-base-policy" ON "knowledge_base" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "knowledge_base"."user_id") WITH CHECK ((select auth.uid()) = "knowledge_base"."user_id");--> statement-breakpoint
CREATE POLICY "meeting-sessions-policy" ON "meeting_sessions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "meeting_sessions"."user_id") WITH CHECK ((select auth.uid()) = "meeting_sessions"."user_id");--> statement-breakpoint
CREATE POLICY "meeting-summaries-policy" ON "meeting_summaries" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = (SELECT user_id FROM meeting_sessions WHERE id = "meeting_summaries"."meeting_id")) WITH CHECK ((select auth.uid()) = (SELECT user_id FROM meeting_sessions WHERE id = "meeting_summaries"."meeting_id"));--> statement-breakpoint
CREATE POLICY "meeting-transcripts-policy" ON "meeting_transcripts" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = (SELECT user_id FROM meeting_sessions WHERE id = "meeting_transcripts"."meeting_id")) WITH CHECK ((select auth.uid()) = (SELECT user_id FROM meeting_sessions WHERE id = "meeting_transcripts"."meeting_id"));--> statement-breakpoint
CREATE POLICY "select-usage-policy" ON "usage_tracking" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "usage_tracking"."user_id");--> statement-breakpoint
CREATE POLICY "update-usage-policy" ON "usage_tracking" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "usage_tracking"."user_id") WITH CHECK ((select auth.uid()) = "usage_tracking"."user_id");--> statement-breakpoint
CREATE POLICY "select-subscription-policy" ON "user_subscriptions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "user_subscriptions"."user_id");--> statement-breakpoint
CREATE POLICY "update-subscription-policy" ON "user_subscriptions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "user_subscriptions"."user_id") WITH CHECK ((select auth.uid()) = "user_subscriptions"."user_id");