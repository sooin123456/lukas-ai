/**
 * Payment System Queries
 * 
 * This file contains database queries for the payment system,
 * including subscription management and usage tracking.
 */
import { eq, and, gte, lte, sql } from "drizzle-orm";

import db from "~/core/db/drizzle-client.server";
import {
  subscriptionPlans,
  userSubscriptions,
  usageTracking,
} from "./schema";

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans() {
  return await db
    .select({
      id: subscriptionPlans.id,
      name: subscriptionPlans.name,
      display_name: subscriptionPlans.display_name,
      price: subscriptionPlans.price,
      billing_cycle: subscriptionPlans.billing_cycle,
      features: subscriptionPlans.features,
      is_active: subscriptionPlans.is_active,
    })
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.is_active, true))
    .orderBy(subscriptionPlans.price);
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string) {
  const subscription = await db
    .select({
      id: userSubscriptions.id,
      user_id: userSubscriptions.user_id,
      plan_id: userSubscriptions.plan_id,
      status: userSubscriptions.status,
      current_period_start: userSubscriptions.current_period_start,
      current_period_end: userSubscriptions.current_period_end,
      stripe_subscription_id: userSubscriptions.stripe_subscription_id,
      stripe_customer_id: userSubscriptions.stripe_customer_id,
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.user_id, userId))
    .limit(1);

  return subscription[0] || null;
}

/**
 * Get user's subscription usage
 */
export async function getUserSubscriptionUsage(userId: string) {
  return await db
    .select({
      id: usageTracking.id,
      user_id: usageTracking.user_id,
      feature: usageTracking.feature,
      usage_count: usageTracking.usage_count,
      period_start: usageTracking.period_start,
      period_end: usageTracking.period_end,
    })
    .from(usageTracking)
    .where(eq(usageTracking.user_id, userId));
}

/**
 * Create or update user subscription
 */
export async function upsertUserSubscription(
  userId: string,
  planId: string,
  stripeSubscriptionId: string,
  stripeCustomerId: string
) {
  const existingSubscription = await getUserSubscription(userId);

  if (existingSubscription) {
    // Update existing subscription
    return await db
      .update(userSubscriptions)
      .set({
        plan_id: planId,
        status: "active",
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
      })
      .where(eq(userSubscriptions.user_id, userId))
      .returning();
  } else {
    // Create new subscription
    return await db
      .insert(userSubscriptions)
      .values({
        user_id: userId,
        plan_id: planId,
        status: "active",
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
      })
      .returning();
  }
}

/**
 * Cancel user subscription
 */
export async function cancelUserSubscription(userId: string) {
  return await db
    .update(userSubscriptions)
    .set({
      status: "cancelled",
    })
    .where(eq(userSubscriptions.user_id, userId))
    .returning();
}

/**
 * Track subscription usage
 */
export async function trackSubscriptionUsage(
  userId: string,
  feature: string,
  usage: number
) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const existingUsage = await db
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

  if (existingUsage.length > 0) {
    // Update existing usage
    return await db
      .update(usageTracking)
      .set({
        usage_count: existingUsage[0].usage_count + usage,
      })
      .where(eq(usageTracking.id, existingUsage[0].id))
      .returning();
  } else {
    // Create new usage record
    return await db
      .insert(usageTracking)
      .values({
        user_id: userId,
        feature,
        usage_count: usage,
        period_start: periodStart,
        period_end: periodEnd,
      })
      .returning();
  }
}

/**
 * Check if user has exceeded usage limits
 */
export async function checkUsageLimits(userId: string, feature: string) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const usage = await db
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

  if (usage.length === 0) {
    return { exceeded: false, remaining: 0 };
  }

  const currentUsage = usage[0];
  const limit = feature === 'document_analysis' ? 50 : 25; // Basic plan limits
  const exceeded = currentUsage.usage_count >= limit;
  const remaining = Math.max(0, limit - currentUsage.usage_count);

  return { exceeded, remaining };
}

/**
 * Get subscription analytics
 */
export async function getSubscriptionAnalytics(userId: string) {
  const subscription = await getUserSubscription(userId);
  const usage = await getUserSubscriptionUsage(userId);

  const totalUsage = usage.reduce((sum: number, item: any) => sum + item.usage_count, 0);
  const totalLimit = usage.length * 25; // Basic plan limit per feature
  const usagePercentage = totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;

  return {
    subscription,
    usage,
    totalUsage,
    totalLimit,
    usagePercentage,
  };
}
