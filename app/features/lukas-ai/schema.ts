import { sql } from "drizzle-orm";
import { pgPolicy, pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";

/**
 * AI Assistant Conversations Table
 * 
 * Stores conversation history between users and AI assistant
 */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own conversations
    pgPolicy("conversations-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * AI Assistant Messages Table
 * 
 * Stores individual messages in conversations
 */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    metadata: jsonb("metadata"), // Store additional data like tokens used, model info
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access messages in their conversations
    pgPolicy("messages-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = (SELECT user_id FROM conversations WHERE id = ${table.conversationId})`,
      withCheck: sql`${authUid} = (SELECT user_id FROM conversations WHERE id = ${table.conversationId})`,
    }),
  ],
);

/**
 * AI Assistant Settings Table
 * 
 * Stores user preferences for AI assistant
 */
export const assistantSettings = pgTable(
  "assistant_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique(),
    model: text("model").default("gpt-4").notNull(), // AI model preference
    language: text("language").default("ko").notNull(), // Preferred language
    context: text("context").default("general"), // Assistant personality/context
    maxTokens: text("max_tokens").default("1000"), // Max response length
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own settings
    pgPolicy("assistant-settings-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
); 