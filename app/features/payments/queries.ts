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
  subscriptionUsage,
} from "./schema";

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans() {
  return await db
    .select({
      id: subscriptionPlans.id,
      name: subscriptionPlans.name,
      description: subscriptionPlans.description,
      price: subscriptionPlans.price,
      billingCycle: subscriptionPlans.billingCycle,
      features: subscriptionPlans.features,
      limits: subscriptionPlans.limits,
      isActive: subscriptionPlans.isActive,
    })
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true))
    .orderBy(subscriptionPlans.price);
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string) {
  const subscription = await db
    .select({
      id: userSubscriptions.id,
      userId: userSubscriptions.userId,
      planId: userSubscriptions.planId,
      status: userSubscriptions.status,
      startDate: userSubscriptions.startDate,
      endDate: userSubscriptions.endDate,
      nextBillingDate: userSubscriptions.nextBillingDate,
      cancelAtPeriodEnd: userSubscriptions.cancelAtPeriodEnd,
      stripeSubscriptionId: userSubscriptions.stripeSubscriptionId,
      stripeCustomerId: userSubscriptions.stripeCustomerId,
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  return subscription[0] || null;
}

/**
 * Get user's subscription usage
 */
export async function getUserSubscriptionUsage(userId: string) {
  return await db
    .select({
      id: subscriptionUsage.id,
      userId: subscriptionUsage.userId,
      feature: subscriptionUsage.feature,
      usage: subscriptionUsage.usage,
      limit: subscriptionUsage.limit,
      period: subscriptionUsage.period,
      resetDate: subscriptionUsage.resetDate,
    })
    .from(subscriptionUsage)
    .where(eq(subscriptionUsage.userId, userId));
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
        planId,
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        stripeSubscriptionId,
        stripeCustomerId,
      })
      .where(eq(userSubscriptions.userId, userId))
      .returning();
  } else {
    // Create new subscription
    return await db
      .insert(userSubscriptions)
      .values({
        userId,
        planId,
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        stripeSubscriptionId,
        stripeCustomerId,
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
      cancelAtPeriodEnd: true,
    })
    .where(eq(userSubscriptions.userId, userId))
    .returning();
}

/**
 * Track subscription usage
 */
export async function trackSubscriptionUsage(
  userId: string,
  feature: string,
  usage: number,
  limit: number
) {
  const existingUsage = await db
    .select()
    .from(subscriptionUsage)
    .where(
      and(
        eq(subscriptionUsage.userId, userId),
        eq(subscriptionUsage.feature, feature)
      )
    )
    .limit(1);

  if (existingUsage.length > 0) {
    // Update existing usage
    return await db
      .update(subscriptionUsage)
      .set({
        usage: existingUsage[0].usage + usage,
        limit,
      })
      .where(eq(subscriptionUsage.id, existingUsage[0].id))
      .returning();
  } else {
    // Create new usage record
    return await db
      .insert(subscriptionUsage)
      .values({
        userId,
        feature,
        usage,
        limit,
        period: "monthly",
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .returning();
  }
}

/**
 * Check if user has exceeded usage limits
 */
export async function checkUsageLimits(userId: string, feature: string) {
  const usage = await db
    .select()
    .from(subscriptionUsage)
    .where(
      and(
        eq(subscriptionUsage.userId, userId),
        eq(subscriptionUsage.feature, feature)
      )
    )
    .limit(1);

  if (usage.length === 0) {
    return { exceeded: false, remaining: 0 };
  }

  const currentUsage = usage[0];
  const exceeded = currentUsage.usage >= currentUsage.limit;
  const remaining = Math.max(0, currentUsage.limit - currentUsage.usage);

  return { exceeded, remaining };
}

/**
 * Get subscription analytics
 */
export async function getSubscriptionAnalytics(userId: string) {
  const subscription = await getUserSubscription(userId);
  const usage = await getUserSubscriptionUsage(userId);

  const totalUsage = usage.reduce((sum, item) => sum + item.usage, 0);
  const totalLimit = usage.reduce((sum, item) => sum + item.limit, 0);
  const usagePercentage = totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;

  return {
    subscription,
    usage,
    totalUsage,
    totalLimit,
    usagePercentage,
  };
}
