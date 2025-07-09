import { sql } from "drizzle-orm";
import { pgPolicy, pgTable, text, timestamp, uuid, jsonb, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { timestamps } from "~/core/db/helpers.server";

/**
 * AI Usage Tracking Table
 * 
 * Stores detailed AI usage data for analytics
 */
export const aiUsageTracking = pgTable(
  "ai_usage_tracking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    feature: text("feature").notNull(), // 'chat', 'document_qa', 'meeting_summary', 'workflow'
    model: text("model").notNull(), // 'gpt-4', 'gpt-3.5-turbo', 'claude-3', etc.
    tokensUsed: integer("tokens_used").notNull(), // Input + output tokens
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    cost: decimal("cost", { precision: 10, scale: 6 }), // Cost in USD
    responseTime: integer("response_time"), // Response time in milliseconds
    success: boolean("success").notNull().default(true),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata"), // Additional usage data
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own usage data
    pgPolicy("ai-usage-tracking-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * AI Performance Metrics Table
 * 
 * Stores performance metrics for AI features
 */
export const aiPerformanceMetrics = pgTable(
  "ai_performance_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    feature: text("feature").notNull(),
    metric: text("metric").notNull(), // 'accuracy', 'response_time', 'user_satisfaction'
    value: decimal("value", { precision: 10, scale: 4 }),
    unit: text("unit"), // 'percentage', 'milliseconds', 'score'
    date: timestamp("date").notNull(),
    context: jsonb("context"), // Additional context for the metric
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own performance metrics
    pgPolicy("ai-performance-metrics-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * AI Cost Analysis Table
 * 
 * Stores cost analysis and predictions
 */
export const aiCostAnalysis = pgTable(
  "ai_cost_analysis",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    period: text("period").notNull(), // 'daily', 'weekly', 'monthly'
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
    featureCosts: jsonb("feature_costs"), // Cost breakdown by feature
    tokenUsage: jsonb("token_usage"), // Token usage breakdown
    predictions: jsonb("predictions"), // Cost predictions for future periods
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own cost analysis
    pgPolicy("ai-cost-analysis-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * AI Optimization Suggestions Table
 * 
 * Stores AI usage optimization suggestions
 */
export const aiOptimizationSuggestions = pgTable(
  "ai_optimization_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    category: text("category").notNull(), // 'cost', 'performance', 'usage'
    title: text("title").notNull(),
    description: text("description").notNull(),
    impact: text("impact").notNull(), // 'high', 'medium', 'low'
    estimatedSavings: decimal("estimated_savings", { precision: 10, scale: 2 }),
    implementation: text("implementation"), // Implementation steps
    isApplied: boolean("is_applied").notNull().default(false),
    appliedDate: timestamp("applied_date"),
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own optimization suggestions
    pgPolicy("ai-optimization-suggestions-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * Company Documents Table
 * 
 * Stores uploaded company documents for AI analysis and Q&A
 */
export const companyDocuments = pgTable(
  "company_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(), // Document uploader
    title: text("title").notNull(),
    description: text("description"),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size"), // File size in bytes
    fileType: text("file_type").notNull(), // pdf, docx, txt, etc.
    fileUrl: text("file_url"), // File storage URL
    content: text("content"), // Extracted text content
    status: text("status").notNull().default("processing"), // 'processing' | 'completed' | 'failed'
    metadata: jsonb("metadata"), // Document metadata like pages, sections
    isPrivate: boolean("is_private").notNull().default(true), // Private document flag
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own documents
    pgPolicy("company-documents-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * Document Chunks Table
 * 
 * Stores document chunks for AI processing and retrieval
 */
export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id").references(() => companyDocuments.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(), // Order of chunk in document
    content: text("content").notNull(), // Text content of chunk
    embedding: jsonb("embedding"), // Vector embedding for similarity search
    metadata: jsonb("metadata"), // Chunk metadata like page, section
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access chunks from their documents
    pgPolicy("document-chunks-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = (SELECT user_id FROM company_documents WHERE id = ${table.documentId})`,
      withCheck: sql`${authUid} = (SELECT user_id FROM company_documents WHERE id = ${table.documentId})`,
    }),
  ],
);

/**
 * Document Q&A Table
 * 
 * Stores Q&A interactions with documents
 */
export const documentQA = pgTable(
  "document_qa",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    documentId: uuid("document_id").references(() => companyDocuments.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    sourceChunks: jsonb("source_chunks"), // Array of chunk IDs used for answer
    confidence: integer("confidence"), // AI confidence score (0-100)
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own Q&A
    pgPolicy("document-qa-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * Knowledge Base Table
 * 
 * Stores knowledge base entries for quick access
 */
export const knowledgeBase = pgTable(
  "knowledge_base",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: text("category"), // FAQ, Policy, Procedure, etc.
    tags: jsonb("tags"), // Array of tags for categorization
    sourceDocuments: jsonb("source_documents"), // Array of document IDs
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own knowledge base
    pgPolicy("knowledge-base-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * Calendar Events Table
 * 
 * Stores calendar events, meetings, and scheduled tasks
 */
export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    type: text("type").notNull().default("meeting"), // 'meeting' | 'task' | 'deadline' | 'reminder'
    priority: text("priority").notNull().default("medium"), // 'low' | 'medium' | 'high' | 'urgent'
    status: text("status").notNull().default("scheduled"), // 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
    location: text("location"), // Meeting location or task location
    attendees: jsonb("attendees"), // Array of attendee info
    recurrence: jsonb("recurrence"), // Recurrence pattern (daily, weekly, monthly)
    reminders: jsonb("reminders"), // Array of reminder times
    tags: jsonb("tags"), // Array of tags for categorization
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own events
    pgPolicy("calendar-events-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * Automated Tasks Table
 * 
 * Stores automated task configurations and execution history
 */
export const automatedTasks = pgTable(
  "automated_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type").notNull(), // 'email' | 'report' | 'reminder' | 'data_processing'
    trigger: text("trigger").notNull(), // 'schedule' | 'event' | 'condition'
    triggerConfig: jsonb("trigger_config"), // Trigger configuration
    action: text("action").notNull(), // Action to perform
    actionConfig: jsonb("action_config"), // Action configuration
    isActive: boolean("is_active").notNull().default(true),
    lastExecuted: timestamp("last_executed"),
    nextExecution: timestamp("next_execution"),
    executionCount: integer("execution_count").notNull().default(0),
    successCount: integer("success_count").notNull().default(0),
    failureCount: integer("failure_count").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own automated tasks
    pgPolicy("automated-tasks-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * Task Executions Table
 * 
 * Stores execution history of automated tasks
 */
export const taskExecutions = pgTable(
  "task_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").references(() => automatedTasks.id, { onDelete: "cascade" }),
    status: text("status").notNull(), // 'success' | 'failed' | 'running'
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    duration: integer("duration"), // Execution duration in seconds
    result: jsonb("result"), // Execution result data
    error: text("error"), // Error message if failed
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access executions from their tasks
    pgPolicy("task-executions-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = (SELECT user_id FROM automated_tasks WHERE id = ${table.taskId})`,
      withCheck: sql`${authUid} = (SELECT user_id FROM automated_tasks WHERE id = ${table.taskId})`,
    }),
  ],
);

/**
 * Time Tracking Table
 * 
 * Stores time tracking data for productivity analysis
 */
export const timeTracking = pgTable(
  "time_tracking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    taskName: text("task_name").notNull(),
    category: text("category"), // Work category
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    duration: integer("duration"), // Duration in minutes
    description: text("description"),
    tags: jsonb("tags"), // Array of tags
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own time tracking
    pgPolicy("time-tracking-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * Workflows Table
 * 
 * Stores workflow definitions for process automation
 */
export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    steps: jsonb("steps").notNull(), // Array of workflow steps
    triggers: jsonb("triggers"), // Array of workflow triggers
    isActive: boolean("is_active").notNull().default(true),
    executionCount: integer("execution_count").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own workflows
    pgPolicy("workflows-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * Meeting Sessions Table
 * 
 * Stores meeting session information including participants, status, and settings
 */
export const meetingSessions = pgTable(
  "meeting_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(), // Meeting organizer
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("scheduled"), // 'scheduled' | 'active' | 'ended'
    startTime: timestamp("start_time"),
    endTime: timestamp("end_time"),
    participants: jsonb("participants"), // Array of participant info
    settings: jsonb("settings"), // Meeting settings like recording, transcription
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access their own meetings
    pgPolicy("meeting-sessions-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.userId}`,
      withCheck: sql`${authUid} = ${table.userId}`,
    }),
  ],
);

/**
 * Meeting Transcripts Table
 * 
 * Stores real-time meeting transcripts with speaker identification
 */
export const meetingTranscripts = pgTable(
  "meeting_transcripts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    meetingId: uuid("meeting_id").references(() => meetingSessions.id, { onDelete: "cascade" }),
    speakerId: text("speaker_id"), // Identified speaker
    speakerName: text("speaker_name"), // Speaker's name
    content: text("content").notNull(), // Transcribed text
    timestamp: timestamp("timestamp").notNull(), // When this was said
    confidence: integer("confidence"), // Speech recognition confidence (0-100)
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access transcripts from their meetings
    pgPolicy("meeting-transcripts-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = (SELECT user_id FROM meeting_sessions WHERE id = ${table.meetingId})`,
      withCheck: sql`${authUid} = (SELECT user_id FROM meeting_sessions WHERE id = ${table.meetingId})`,
    }),
  ],
);

/**
 * Meeting Summaries Table
 * 
 * Stores AI-generated meeting summaries and action items
 */
export const meetingSummaries = pgTable(
  "meeting_summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    meetingId: uuid("meeting_id").references(() => meetingSessions.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(), // AI-generated meeting summary
    actionItems: jsonb("action_items"), // Array of action items with assignees
    keyPoints: jsonb("key_points"), // Array of key discussion points
    decisions: jsonb("decisions"), // Array of decisions made
    nextSteps: text("next_steps"), // Next steps and follow-ups
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can only access summaries from their meetings
    pgPolicy("meeting-summaries-policy", {
      for: "all",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = (SELECT user_id FROM meeting_sessions WHERE id = ${table.meetingId})`,
      withCheck: sql`${authUid} = (SELECT user_id FROM meeting_sessions WHERE id = ${table.meetingId})`,
    }),
  ],
);

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