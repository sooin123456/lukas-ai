/**
 * Payment System Schema
 * 
 * This file defines the database schema for payment records and sets up
 * Supabase Row Level Security (RLS) policies to control data access.
 * The schema is designed to work with payment processors like Toss Payments
 * (as indicated by the imports in package.json).
 */
import { sql } from "drizzle-orm";
import {
  doublePrecision,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

import { makeIdentityColumn, timestamps } from "~/core/db/helpers.server";

/**
 * Subscription Plans Table
 * 
 * Stores available subscription plans for Lukas AI
 */
export const subscriptionPlans = pgTable(
  "subscription_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(), // 'basic' | 'pro'
    display_name: text("display_name").notNull(), // 'Basic' | 'Pro'
    price: doublePrecision("price").notNull(), // 0 for basic, 10 for pro
    billing_cycle: text("billing_cycle").notNull().default("monthly"), // 'monthly' | 'yearly'
    features: jsonb("features").notNull(), // JSON object with feature limits
    is_active: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
);

/**
 * User Subscriptions Table
 * 
 * Stores user subscription information
 */
export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }),
    plan_id: uuid("plan_id").references(() => subscriptionPlans.id),
    status: text("status").notNull().default("active"), // 'active' | 'cancelled' | 'expired'
    current_period_start: timestamp("current_period_start").notNull(),
    current_period_end: timestamp("current_period_end").notNull(),
    stripe_subscription_id: text("stripe_subscription_id"),
    stripe_customer_id: text("stripe_customer_id"),
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only view their own subscriptions
    pgPolicy("select-subscription-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    // RLS Policy: Users can only update their own subscriptions
    pgPolicy("update-subscription-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

/**
 * Usage Tracking Table
 * 
 * Tracks usage of features for billing and limits
 */
export const usageTracking = pgTable(
  "usage_tracking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(), // 'document_analysis' | 'meeting_summary'
    usage_count: doublePrecision("usage_count").notNull().default(0),
    period_start: timestamp("period_start").notNull(), // Start of billing period
    period_end: timestamp("period_end").notNull(), // End of billing period
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only view their own usage
    pgPolicy("select-usage-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
    // RLS Policy: Users can only update their own usage
    pgPolicy("update-usage-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
      withCheck: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);

/**
 * Payments Table
 * 
 * Stores payment transaction records with details from the payment processor.
 * Links to Supabase auth.users table via user_id foreign key.
 * 
 * Includes Row Level Security (RLS) policy to ensure users can only
 * view their own payment records.
 */
export const payments = pgTable(
  "payments",
  {
    // Auto-incrementing primary key for payment records
    ...makeIdentityColumn("payment_id"),
    // Payment processor's unique identifier for the transaction
    payment_key: text().notNull(),
    // Unique identifier for the order in your system
    order_id: text().notNull(),
    // Human-readable name for the order
    order_name: text().notNull(),
    // Total amount of the payment transaction
    total_amount: doublePrecision().notNull(),
    // Custom metadata about the payment (product details, etc.)
    metadata: jsonb().notNull(),
    // Complete raw response from the payment processor
    raw_data: jsonb().notNull(),
    // URL to the payment receipt provided by the processor
    receipt_url: text().notNull(),
    // Current status of the payment (e.g., "approved", "failed")
    status: text().notNull(),
    // Foreign key to the user who made the payment
    // Using CASCADE ensures payment records are deleted when user is deleted
    user_id: uuid().references(() => authUsers.id, {
      onDelete: "cascade",
    }),
    // When the payment was approved by the processor
    approved_at: timestamp().notNull(),
    // When the payment was initially requested
    requested_at: timestamp().notNull(),
    // Adds created_at and updated_at timestamp columns
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only view their own payment records
    pgPolicy("select-payment-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.user_id}`,
    }),
  ],
);
