/**
 * Payment System Queries
 * 
 * This file contains database queries for the payment system,
 * including subscription management and usage tracking.
 */
import { eq, and, gte, lte } from "drizzle-orm";

import db from "~/core/db/drizzle-client.server";
import { payments, subscriptionPlans, userSubscriptions, usageTracking } from "./schema";

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans() {
  return await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.is_active, true));
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string) {
  return await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.user_id, userId))
    .limit(1);
}

/**
 * Get user's current usage for a specific feature
 */
export async function getUserUsage(userId: string, feature: string, periodStart: Date, periodEnd: Date) {
  return await db
    .select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.user_id, userId),
        eq(usageTracking.feature, feature),
        gte(usageTracking.period_start, periodStart),
        lte(usageTracking.period_end, periodEnd)
      )
    )
    .limit(1);
}

/**
 * Update user's usage for a specific feature
 */
export async function updateUserUsage(userId: string, feature: string, usageCount: number, periodStart: Date, periodEnd: Date) {
  const existingUsage = await getUserUsage(userId, feature, periodStart, periodEnd);
  
  if (existingUsage.length > 0) {
    // Update existing usage record
    return await db
      .update(usageTracking)
      .set({ usage_count: usageCount })
      .where(eq(usageTracking.id, existingUsage[0].id));
  } else {
    // Create new usage record
    return await db
      .insert(usageTracking)
      .values({
        user_id: userId,
        feature,
        usage_count: usageCount,
        period_start: periodStart,
        period_end: periodEnd,
      });
  }
}

/**
 * Check if user has exceeded their plan limits
 */
export async function checkUserLimits(userId: string, feature: string) {
  const userSub = await getUserSubscription(userId);
  if (userSub.length === 0) {
    // No subscription, use basic plan limits
    return { hasLimit: true, limit: feature === 'document_analysis' ? 50 : 25 };
  }

  const plan = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, userSub[0].plan_id || ""))
    .limit(1);

  if (plan.length === 0) {
    return { hasLimit: true, limit: feature === 'document_analysis' ? 50 : 25 };
  }

  const planFeatures = plan[0].features as any;
  const limit = planFeatures[feature]?.limit;

  if (limit === null || limit === undefined) {
    // Unlimited
    return { hasLimit: false, limit: null };
  }

  // Get current usage
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const usage = await getUserUsage(userId, feature, periodStart, periodEnd);
  const currentUsage = usage.length > 0 ? usage[0].usage_count : 0;

  return {
    hasLimit: true,
    limit,
    currentUsage,
    remaining: limit - currentUsage,
  };
}

/**
 * Get payment records for a user
 */
export async function getUserPayments(userId: string) {
  return await db
    .select()
    .from(payments)
    .where(eq(payments.user_id, userId))
    .orderBy(payments.created_at);
}
