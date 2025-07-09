CREATE TABLE "assistant_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"model" text DEFAULT 'gpt-4' NOT NULL,
	"language" text DEFAULT 'ko' NOT NULL,
	"context" text DEFAULT 'general',
	"max_tokens" text DEFAULT '1000',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assistant_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "assistant_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "assistant-settings-policy" ON "assistant_settings" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "assistant_settings"."user_id") WITH CHECK ((select auth.uid()) = "assistant_settings"."user_id");--> statement-breakpoint
CREATE POLICY "conversations-policy" ON "conversations" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "conversations"."user_id") WITH CHECK ((select auth.uid()) = "conversations"."user_id");--> statement-breakpoint
CREATE POLICY "messages-policy" ON "messages" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = (SELECT user_id FROM conversations WHERE id = "messages"."conversation_id")) WITH CHECK ((select auth.uid()) = (SELECT user_id FROM conversations WHERE id = "messages"."conversation_id"));