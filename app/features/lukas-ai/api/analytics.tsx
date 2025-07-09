import { data } from "react-router";
import { z } from "zod";
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
  // This is a temporary implementation
  return { id: "temp-user-id" };
}

export async function loader({ request }: any) {
  const user = await requireUser(request);
  
  // Get usage statistics for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get usage statistics grouped by feature
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

  return data({
    usageStats,
    recentUsage,
    performanceMetrics,
    costAnalysis,
    optimizationSuggestions,
  });
}

export async function action({ request }: any) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const action = formData.get("action");

  switch (action) {
    case "trackUsage": {
      const { feature, model, tokensUsed, cost, responseTime, success } = 
        Object.fromEntries(formData);

      await db
        .insert(aiUsageTracking)
        .values({
          userId: user.id,
          feature: feature as string,
          model: model as string,
          tokensUsed: parseInt(tokensUsed as string),
          inputTokens: parseInt(tokensUsed as string) / 2, // Temporary calculation
          outputTokens: parseInt(tokensUsed as string) / 2, // Temporary calculation
          cost: cost as string,
          responseTime: parseInt(responseTime as string),
          success: success === "true",
        });

      return data({ success: true });
    }

    case "trackPerformance": {
      const { feature, metric, value, unit } = Object.fromEntries(formData);

      await db
        .insert(aiPerformanceMetrics)
        .values({
          userId: user.id,
          feature: feature as string,
          metric: metric as string,
          value: value as string,
          unit: unit as string,
          date: new Date(),
        });

      return data({ success: true });
    }

    case "trackCost": {
      const { period, startDate, endDate, totalCost, featureCosts, tokenUsage } = 
        Object.fromEntries(formData);

      await db
        .insert(aiCostAnalysis)
        .values({
          userId: user.id,
          period: period as string,
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
          totalCost: totalCost as string,
          featureCosts: featureCosts as string,
          tokenUsage: tokenUsage as string,
        });

      return data({ success: true });
    }

    case "addOptimization": {
      const { category, title, description, impact, estimatedSavings, implementation } = 
        Object.fromEntries(formData);

      await db
        .insert(aiOptimizationSuggestions)
        .values({
          userId: user.id,
          category: category as string,
          title: title as string,
          description: description as string,
          impact: impact as string,
          estimatedSavings: estimatedSavings as string,
          implementation: implementation as string,
          isApplied: false,
        });

      return data({ success: true });
    }

    case "applyOptimization": {
      const suggestionId = formData.get("suggestionId") as string;

      await db
        .update(aiOptimizationSuggestions)
        .set({
          isApplied: true,
          appliedDate: new Date(),
        })
        .where(eq(aiOptimizationSuggestions.id, suggestionId));

      return data({ success: true });
    }

    default:
      return data({ error: "Invalid action" }, { status: 400 });
  }
} 