import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { eq, desc, and, gte, lte, sum, count, avg } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/core/db/drizzle-client.server";
import { requireUser } from "~/core/lib/guards.server";
import { 
  aiUsageTracking, 
  aiPerformanceMetrics, 
  aiCostAnalysis, 
  aiOptimizationSuggestions 
} from "~/features/lukas-ai/schema";

// Usage tracking schema
const usageTrackingSchema = z.object({
  feature: z.enum(["chat", "document_qa", "meeting_summary", "workflow"]),
  model: z.string().min(1, "모델명을 입력해주세요"),
  tokensUsed: z.number().min(1, "토큰 사용량을 입력해주세요"),
  inputTokens: z.number().min(0, "입력 토큰 수를 입력해주세요"),
  outputTokens: z.number().min(0, "출력 토큰 수를 입력해주세요"),
  cost: z.number().optional(),
  responseTime: z.number().optional(),
  success: z.boolean().default(true),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Performance metric schema
const performanceMetricSchema = z.object({
  feature: z.string().min(1, "기능명을 입력해주세요"),
  metric: z.enum(["accuracy", "response_time", "user_satisfaction"]),
  value: z.number().min(0, "값을 입력해주세요"),
  unit: z.string().optional(),
  date: z.string().datetime("날짜를 입력해주세요"),
  context: z.record(z.any()).optional(),
});

// Cost analysis schema
const costAnalysisSchema = z.object({
  period: z.enum(["daily", "weekly", "monthly"]),
  startDate: z.string().datetime("시작 날짜를 입력해주세요"),
  endDate: z.string().datetime("종료 날짜를 입력해주세요"),
  totalCost: z.number().min(0, "총 비용을 입력해주세요"),
  featureCosts: z.record(z.number()).optional(),
  tokenUsage: z.record(z.number()).optional(),
  predictions: z.record(z.any()).optional(),
});

// Optimization suggestion schema
const optimizationSuggestionSchema = z.object({
  category: z.enum(["cost", "performance", "usage"]),
  title: z.string().min(1, "제목을 입력해주세요"),
  description: z.string().min(1, "설명을 입력해주세요"),
  impact: z.enum(["high", "medium", "low"]),
  estimatedSavings: z.number().optional(),
  implementation: z.string().optional(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "month";
  const feature = url.searchParams.get("feature");
  
  // Calculate date range
  const now = new Date();
  const startDate = new Date();
  switch (period) {
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(now.getMonth() - 3);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  // Get usage statistics
  let usageQuery = db
    .select({
      feature: aiUsageTracking.feature,
      totalTokens: sum(aiUsageTracking.tokensUsed),
      totalCost: sum(aiUsageTracking.cost),
      totalRequests: count(aiUsageTracking.id),
      avgResponseTime: avg(aiUsageTracking.responseTime),
    })
    .from(aiUsageTracking)
    .where(
      and(
        eq(aiUsageTracking.userId, user.id),
        gte(aiUsageTracking.createdAt, startDate)
      )
    )
    .groupBy(aiUsageTracking.feature);

  if (feature) {
    usageQuery = usageQuery.where(eq(aiUsageTracking.feature, feature));
  }

  const usageStats = await usageQuery;

  // Get performance metrics
  const performanceMetrics = await db
    .select()
    .from(aiPerformanceMetrics)
    .where(
      and(
        eq(aiPerformanceMetrics.userId, user.id),
        gte(aiPerformanceMetrics.date, startDate)
      )
    )
    .orderBy(desc(aiPerformanceMetrics.date));

  // Get cost analysis
  const costAnalysis = await db
    .select()
    .from(aiCostAnalysis)
    .where(
      and(
        eq(aiCostAnalysis.userId, user.id),
        gte(aiCostAnalysis.startDate, startDate)
      )
    )
    .orderBy(desc(aiCostAnalysis.startDate));

  // Get optimization suggestions
  const optimizationSuggestions = await db
    .select()
    .from(aiOptimizationSuggestions)
    .where(eq(aiOptimizationSuggestions.userId, user.id))
    .orderBy(desc(aiOptimizationSuggestions.createdAt));

  // Get recent usage data for charts
  const recentUsage = await db
    .select()
    .from(aiUsageTracking)
    .where(
      and(
        eq(aiUsageTracking.userId, user.id),
        gte(aiUsageTracking.createdAt, startDate)
      )
    )
    .orderBy(desc(aiUsageTracking.createdAt))
    .limit(50);

  // Calculate summary statistics
  const totalCost = usageStats.reduce((sum, stat) => sum + (Number(stat.totalCost) || 0), 0);
  const totalTokens = usageStats.reduce((sum, stat) => sum + (Number(stat.totalTokens) || 0), 0);
  const totalRequests = usageStats.reduce((sum, stat) => sum + (Number(stat.totalRequests) || 0), 0);

  return json({
    usageStats,
    performanceMetrics,
    costAnalysis,
    optimizationSuggestions,
    recentUsage,
    summary: {
      totalCost,
      totalTokens,
      totalRequests,
      period,
      startDate,
      endDate: now,
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "track-usage": {
        const data = usageTrackingSchema.parse({
          feature: formData.get("feature"),
          model: formData.get("model"),
          tokensUsed: formData.get("tokensUsed") ? Number(formData.get("tokensUsed")) : 0,
          inputTokens: formData.get("inputTokens") ? Number(formData.get("inputTokens")) : 0,
          outputTokens: formData.get("outputTokens") ? Number(formData.get("outputTokens")) : 0,
          cost: formData.get("cost") ? Number(formData.get("cost")) : undefined,
          responseTime: formData.get("responseTime") ? Number(formData.get("responseTime")) : undefined,
          success: formData.get("success") === "true",
          errorMessage: formData.get("errorMessage"),
          metadata: formData.get("metadata") ? JSON.parse(formData.get("metadata") as string) : undefined,
        });

        const [usage] = await db
          .insert(aiUsageTracking)
          .values({
            userId: user.id,
            ...data,
          })
          .returning();

        return json({ success: true, usage });
      }

      case "add-performance-metric": {
        const data = performanceMetricSchema.parse({
          feature: formData.get("feature"),
          metric: formData.get("metric"),
          value: formData.get("value") ? Number(formData.get("value")) : 0,
          unit: formData.get("unit"),
          date: formData.get("date"),
          context: formData.get("context") ? JSON.parse(formData.get("context") as string) : undefined,
        });

        const [metric] = await db
          .insert(aiPerformanceMetrics)
          .values({
            userId: user.id,
            ...data,
          })
          .returning();

        return json({ success: true, metric });
      }

      case "add-cost-analysis": {
        const data = costAnalysisSchema.parse({
          period: formData.get("period"),
          startDate: formData.get("startDate"),
          endDate: formData.get("endDate"),
          totalCost: formData.get("totalCost") ? Number(formData.get("totalCost")) : 0,
          featureCosts: formData.get("featureCosts") ? JSON.parse(formData.get("featureCosts") as string) : undefined,
          tokenUsage: formData.get("tokenUsage") ? JSON.parse(formData.get("tokenUsage") as string) : undefined,
          predictions: formData.get("predictions") ? JSON.parse(formData.get("predictions") as string) : undefined,
        });

        const [analysis] = await db
          .insert(aiCostAnalysis)
          .values({
            userId: user.id,
            ...data,
          })
          .returning();

        return json({ success: true, analysis });
      }

      case "add-optimization-suggestion": {
        const data = optimizationSuggestionSchema.parse({
          category: formData.get("category"),
          title: formData.get("title"),
          description: formData.get("description"),
          impact: formData.get("impact"),
          estimatedSavings: formData.get("estimatedSavings") ? Number(formData.get("estimatedSavings")) : undefined,
          implementation: formData.get("implementation"),
        });

        const [suggestion] = await db
          .insert(aiOptimizationSuggestions)
          .values({
            userId: user.id,
            ...data,
          })
          .returning();

        return json({ success: true, suggestion });
      }

      case "apply-optimization": {
        const suggestionId = formData.get("suggestionId") as string;
        
        const [suggestion] = await db
          .update(aiOptimizationSuggestions)
          .set({ 
            isApplied: true,
            appliedDate: new Date(),
          })
          .where(eq(aiOptimizationSuggestions.id, suggestionId))
          .returning();

        return json({ success: true, suggestion });
      }

      case "delete-suggestion": {
        const suggestionId = formData.get("suggestionId") as string;
        
        await db
          .delete(aiOptimizationSuggestions)
          .where(eq(aiOptimizationSuggestions.id, suggestionId));

        return json({ success: true });
      }

      default:
        return json({ error: "알 수 없는 액션입니다" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: error.errors[0]?.message || "입력 데이터가 유효하지 않습니다" }, { status: 400 });
    }
    return json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export function useAnalyticsData() {
  return useLoaderData<typeof loader>();
} 