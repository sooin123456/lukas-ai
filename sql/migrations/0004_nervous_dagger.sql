CREATE TABLE "ai_cost_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"total_cost" numeric(10, 2),
	"feature_costs" jsonb,
	"token_usage" jsonb,
	"predictions" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_cost_analysis" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_optimization_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"impact" text NOT NULL,
	"estimated_savings" numeric(10, 2),
	"implementation" text,
	"is_applied" boolean DEFAULT false NOT NULL,
	"applied_date" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_optimization_suggestions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feature" text NOT NULL,
	"metric" text NOT NULL,
	"value" numeric(10, 4),
	"unit" text,
	"date" timestamp NOT NULL,
	"context" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_performance_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feature" text NOT NULL,
	"model" text NOT NULL,
	"tokens_used" integer NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"cost" numeric(10, 6),
	"response_time" integer,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage_tracking" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "automated_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"trigger" text NOT NULL,
	"trigger_config" jsonb,
	"action" text NOT NULL,
	"action_config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_executed" timestamp,
	"next_execution" timestamp,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automated_tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"type" text DEFAULT 'meeting' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"location" text,
	"attendees" jsonb,
	"recurrence" jsonb,
	"reminders" jsonb,
	"tags" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "task_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"status" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"result" jsonb,
	"error" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_executions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "time_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_name" text NOT NULL,
	"category" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"description" text,
	"tags" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "time_tracking" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"steps" jsonb NOT NULL,
	"triggers" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_task_id_automated_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."automated_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "ai-cost-analysis-policy" ON "ai_cost_analysis" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "ai_cost_analysis"."user_id") WITH CHECK ((select auth.uid()) = "ai_cost_analysis"."user_id");--> statement-breakpoint
CREATE POLICY "ai-optimization-suggestions-policy" ON "ai_optimization_suggestions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "ai_optimization_suggestions"."user_id") WITH CHECK ((select auth.uid()) = "ai_optimization_suggestions"."user_id");--> statement-breakpoint
CREATE POLICY "ai-performance-metrics-policy" ON "ai_performance_metrics" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "ai_performance_metrics"."user_id") WITH CHECK ((select auth.uid()) = "ai_performance_metrics"."user_id");--> statement-breakpoint
CREATE POLICY "ai-usage-tracking-policy" ON "ai_usage_tracking" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "ai_usage_tracking"."user_id") WITH CHECK ((select auth.uid()) = "ai_usage_tracking"."user_id");--> statement-breakpoint
CREATE POLICY "automated-tasks-policy" ON "automated_tasks" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "automated_tasks"."user_id") WITH CHECK ((select auth.uid()) = "automated_tasks"."user_id");--> statement-breakpoint
CREATE POLICY "calendar-events-policy" ON "calendar_events" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "calendar_events"."user_id") WITH CHECK ((select auth.uid()) = "calendar_events"."user_id");--> statement-breakpoint
CREATE POLICY "task-executions-policy" ON "task_executions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = (SELECT user_id FROM automated_tasks WHERE id = "task_executions"."task_id")) WITH CHECK ((select auth.uid()) = (SELECT user_id FROM automated_tasks WHERE id = "task_executions"."task_id"));--> statement-breakpoint
CREATE POLICY "time-tracking-policy" ON "time_tracking" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "time_tracking"."user_id") WITH CHECK ((select auth.uid()) = "time_tracking"."user_id");--> statement-breakpoint
CREATE POLICY "workflows-policy" ON "workflows" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "workflows"."user_id") WITH CHECK ((select auth.uid()) = "workflows"."user_id");