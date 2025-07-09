import { json } from "@react-router/node";
import { type LoaderFunctionArgs, type ActionFunctionArgs } from "@react-router/node";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import db from "~/core/db/drizzle-client.server";
import {
  aiUsageTracking,
  aiPerformanceMetrics,
  aiCostAnalysis,
  aiOptimizationSuggestions,
} from "../schema";

// Temporary requireUser function until we fix the import
async function requireUser(request: Request) {
  // This is a simplified version - you'll need to implement proper auth
  return { id: "temp-user-id" };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Get usage statistics for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const usageStats = await db
    .select({
      feature: aiUsageTracking.feature,
      totalTokens: sql<number>`SUM(${aiUsageTracking.tokensUsed})`,
      totalCost: sql<number>`SUM(${aiUsageTracking.cost})`,
      avgResponseTime: sql<number>`AVG(${aiUsageTracking.responseTime})`,
      successRate: sql<number>`(COUNT(CASE WHEN ${aiUsageTracking.success} THEN 1 END) * 100.0 / COUNT(*))`,
    })
    .from(aiUsageTracking)
    .where(
      and(
        eq(aiUsageTracking.userId, user.id),
        gte(aiUsageTracking.created_at, thirtyDaysAgo)
      )
    )
    .groupBy(aiUsageTracking.feature);

  // Get recent usage (last 10 entries)
  const recentUsage = await db
    .select({
      id: aiUsageTracking.id,
      feature: aiUsageTracking.feature,
      model: aiUsageTracking.model,
      tokensUsed: aiUsageTracking.tokensUsed,
      cost: aiUsageTracking.cost,
      responseTime: aiUsageTracking.responseTime,
      success: aiUsageTracking.success,
      created_at: aiUsageTracking.created_at,
    })
    .from(aiUsageTracking)
    .where(eq(aiUsageTracking.userId, user.id))
    .orderBy(sql`${aiUsageTracking.created_at} DESC`)
    .limit(10);

  // Get performance metrics
  const performanceMetrics = await db
    .select({
      id: aiPerformanceMetrics.id,
      feature: aiPerformanceMetrics.feature,
      metric: aiPerformanceMetrics.metric,
      value: aiPerformanceMetrics.value,
      unit: aiPerformanceMetrics.unit,
      date: aiPerformanceMetrics.date,
    })
    .from(aiPerformanceMetrics)
    .where(eq(aiPerformanceMetrics.userId, user.id))
    .orderBy(sql`${aiPerformanceMetrics.date} DESC`)
    .limit(20);

  // Get cost analysis
  const costAnalysis = await db
    .select({
      id: aiCostAnalysis.id,
      period: aiCostAnalysis.period,
      startDate: aiCostAnalysis.startDate,
      endDate: aiCostAnalysis.endDate,
      totalCost: aiCostAnalysis.totalCost,
      featureCosts: aiCostAnalysis.featureCosts,
      tokenUsage: aiCostAnalysis.tokenUsage,
    })
    .from(aiCostAnalysis)
    .where(eq(aiCostAnalysis.userId, user.id))
    .orderBy(sql`${aiCostAnalysis.startDate} DESC`)
    .limit(10);

  // Get optimization suggestions
  const optimizationSuggestions = await db
    .select({
      id: aiOptimizationSuggestions.id,
      category: aiOptimizationSuggestions.category,
      title: aiOptimizationSuggestions.title,
      description: aiOptimizationSuggestions.description,
      impact: aiOptimizationSuggestions.impact,
      estimatedSavings: aiOptimizationSuggestions.estimatedSavings,
      implementation: aiOptimizationSuggestions.implementation,
      isApplied: aiOptimizationSuggestions.isApplied,
    })
    .from(aiOptimizationSuggestions)
    .where(eq(aiOptimizationSuggestions.userId, user.id))
    .orderBy(sql`${aiOptimizationSuggestions.created_at} DESC`)
    .limit(10);

  return json({
    usageStats,
    recentUsage,
    performanceMetrics,
    costAnalysis,
    optimizationSuggestions,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  switch (action) {
    case "track_usage": {
      const feature = formData.get("feature") as string;
      const model = formData.get("model") as string;
      const tokensUsed = parseInt(formData.get("tokensUsed") as string);
      const inputTokens = parseInt(formData.get("inputTokens") as string);
      const outputTokens = parseInt(formData.get("outputTokens") as string);
      const cost = parseFloat(formData.get("cost") as string) || 0;
      const responseTime = parseInt(formData.get("responseTime") as string) || 0;
      const success = formData.get("success") === "true";
      const errorMessage = formData.get("errorMessage") as string;
      const metadata = formData.get("metadata") ? JSON.parse(formData.get("metadata") as string) : null;

      await db
        .insert(aiUsageTracking)
        .values({
          userId: user.id,
          feature,
          model,
          tokensUsed,
          inputTokens,
          outputTokens,
          cost: cost.toString(),
          responseTime,
          success,
          errorMessage,
          metadata,
        });

      return json({ success: true });
    }

    case "track_performance": {
      const feature = formData.get("feature") as string;
      const metric = formData.get("metric") as string;
      const value = parseFloat(formData.get("value") as string);
      const unit = formData.get("unit") as string;
      const date = new Date(formData.get("date") as string);
      const context = formData.get("context") ? JSON.parse(formData.get("context") as string) : null;

      await db
        .insert(aiPerformanceMetrics)
        .values({
          userId: user.id,
          feature,
          metric,
          value: value.toString(),
          unit,
          date,
          context,
        });

      return json({ success: true });
    }

    case "track_cost": {
      const period = formData.get("period") as string;
      const startDate = new Date(formData.get("startDate") as string);
      const endDate = new Date(formData.get("endDate") as string);
      const totalCost = parseFloat(formData.get("totalCost") as string);
      const featureCosts = formData.get("featureCosts") ? JSON.parse(formData.get("featureCosts") as string) : null;
      const tokenUsage = formData.get("tokenUsage") ? JSON.parse(formData.get("tokenUsage") as string) : null;
      const predictions = formData.get("predictions") ? JSON.parse(formData.get("predictions") as string) : null;

      await db
        .insert(aiCostAnalysis)
        .values({
          userId: user.id,
          period,
          startDate,
          endDate,
          totalCost: totalCost.toString(),
          featureCosts,
          tokenUsage,
          predictions,
        });

      return json({ success: true });
    }

    case "add_optimization": {
      const category = formData.get("category") as string;
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const impact = formData.get("impact") as string;
      const estimatedSavings = parseFloat(formData.get("estimatedSavings") as string) || 0;
      const implementation = formData.get("implementation") as string;

      await db
        .insert(aiOptimizationSuggestions)
        .values({
          userId: user.id,
          category,
          title,
          description,
          impact,
          estimatedSavings: estimatedSavings.toString(),
          implementation,
          isApplied: false,
        });

      return json({ success: true });
    }

    case "apply_optimization": {
      const suggestionId = formData.get("suggestionId") as string;

      await db
        .update(aiOptimizationSuggestions)
        .set({
          isApplied: true,
          appliedDate: new Date(),
        })
        .where(eq(aiOptimizationSuggestions.id, suggestionId));

      return json({ success: true });
    }

    default:
      return json({ error: "Invalid action" }, { status: 400 });
  }
} 