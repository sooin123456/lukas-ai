import { json } from "react-router";
import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import db from "~/core/db/drizzle-client.server";
import {
  calendarEvents,
  automatedTasks,
  taskExecutions,
  timeTracking,
  workflows,
} from "../schema";

// Temporary requireUser function until we fix the import
async function requireUser(request: Request) {
  // This is a simplified version - you'll need to implement proper auth
  return { id: "temp-user-id" };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Get calendar events
  const events = await db
    .select({
      id: calendarEvents.id,
      title: calendarEvents.title,
      description: calendarEvents.description,
      startTime: calendarEvents.startTime,
      endTime: calendarEvents.endTime,
      type: calendarEvents.type,
      priority: calendarEvents.priority,
      status: calendarEvents.status,
      location: calendarEvents.location,
      attendees: calendarEvents.attendees,
      recurrence: calendarEvents.recurrence,
      reminders: calendarEvents.reminders,
      tags: calendarEvents.tags,
    })
    .from(calendarEvents)
    .where(eq(calendarEvents.userId, user.id))
    .orderBy(sql`${calendarEvents.startTime} ASC`);

  // Get automated tasks
  const tasks = await db
    .select({
      id: automatedTasks.id,
      name: automatedTasks.name,
      description: automatedTasks.description,
      type: automatedTasks.type,
      trigger: automatedTasks.trigger,
      triggerConfig: automatedTasks.triggerConfig,
      action: automatedTasks.action,
      actionConfig: automatedTasks.actionConfig,
      isActive: automatedTasks.isActive,
      lastExecuted: automatedTasks.lastExecuted,
      nextExecution: automatedTasks.nextExecution,
      executionCount: automatedTasks.executionCount,
      successCount: automatedTasks.successCount,
      failureCount: automatedTasks.failureCount,
      created_at: automatedTasks.created_at,
    })
    .from(automatedTasks)
    .where(eq(automatedTasks.userId, user.id))
    .orderBy(sql`${automatedTasks.created_at} DESC`);

  // Get task executions
  const executions = await db
    .select({
      id: taskExecutions.id,
      taskId: taskExecutions.taskId,
      status: taskExecutions.status,
      startTime: taskExecutions.startTime,
      endTime: taskExecutions.endTime,
      duration: taskExecutions.duration,
      result: taskExecutions.result,
      error: taskExecutions.error,
    })
    .from(taskExecutions)
    .where(eq(taskExecutions.taskId, automatedTasks.id))
    .orderBy(sql`${taskExecutions.startTime} DESC`)
    .limit(20);

  // Get time tracking entries
  const timeEntries = await db
    .select({
      id: timeTracking.id,
      taskName: timeTracking.taskName,
      category: timeTracking.category,
      startTime: timeTracking.startTime,
      endTime: timeTracking.endTime,
      duration: timeTracking.duration,
      description: timeTracking.description,
      tags: timeTracking.tags,
    })
    .from(timeTracking)
    .where(eq(timeTracking.userId, user.id))
    .orderBy(sql`${timeTracking.startTime} DESC`)
    .limit(50);

  // Get workflows
  const userWorkflows = await db
    .select({
      id: workflows.id,
      name: workflows.name,
      description: workflows.description,
      steps: workflows.steps,
      triggers: workflows.triggers,
      isActive: workflows.isActive,
      executionCount: workflows.executionCount,
    })
    .from(workflows)
    .where(eq(workflows.userId, user.id))
    .orderBy(sql`${workflows.created_at} DESC`);

  return json({
    events,
    tasks,
    executions,
    timeEntries,
    workflows: userWorkflows,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  switch (action) {
    case "create_event": {
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const startTime = new Date(formData.get("startTime") as string);
      const endTime = new Date(formData.get("endTime") as string);
      const type = formData.get("type") as string;
      const priority = formData.get("priority") as string;
      const status = formData.get("status") as string;
      const location = formData.get("location") as string;
      const attendees = formData.get("attendees") ? JSON.parse(formData.get("attendees") as string) : [];
      const recurrence = formData.get("recurrence") ? JSON.parse(formData.get("recurrence") as string) : null;
      const reminders = formData.get("reminders") ? JSON.parse(formData.get("reminders") as string) : null;
      const tags = formData.get("tags") ? JSON.parse(formData.get("tags") as string) : null;

      await db
        .insert(calendarEvents)
        .values({
          userId: user.id,
          title,
          description,
          startTime,
          endTime,
          type,
          priority,
          status,
          location,
          attendees,
          recurrence,
          reminders,
          tags,
        });

      return json({ success: true });
    }

    case "create_task": {
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const type = formData.get("type") as string;
      const trigger = formData.get("trigger") as string;
      const triggerConfig = formData.get("triggerConfig") ? JSON.parse(formData.get("triggerConfig") as string) : null;
      const action = formData.get("action") as string;
      const actionConfig = formData.get("actionConfig") ? JSON.parse(formData.get("actionConfig") as string) : null;
      const isActive = formData.get("isActive") === "true";

      await db
        .insert(automatedTasks)
        .values({
          userId: user.id,
          name,
          description,
          type,
          trigger,
          triggerConfig,
          action,
          actionConfig,
          isActive,
          lastExecuted: null,
          nextExecution: new Date(), // Calculate based on trigger
          executionCount: 0,
          successCount: 0,
          failureCount: 0,
        });

      return json({ success: true });
    }

    case "start_time_tracking": {
      const taskName = formData.get("taskName") as string;
      const category = formData.get("category") as string;
      const description = formData.get("description") as string;
      const tags = formData.get("tags") ? JSON.parse(formData.get("tags") as string) : [];

      await db
        .insert(timeTracking)
        .values({
          userId: user.id,
          taskName,
          category,
          startTime: new Date(),
          endTime: null,
          duration: 0,
          description,
          tags,
        });

      return json({ success: true });
    }

    case "stop_time_tracking": {
      const trackingId = formData.get("trackingId") as string;
      const endTime = new Date();

      await db
        .update(timeTracking)
        .set({
          endTime,
          duration: sql`EXTRACT(EPOCH FROM (${endTime} - start_time))`,
        })
        .where(eq(timeTracking.id, trackingId));

      return json({ success: true });
    }

    case "create_workflow": {
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const steps = JSON.parse(formData.get("steps") as string);
      const triggers = formData.get("triggers") ? JSON.parse(formData.get("triggers") as string) : null;

      await db
        .insert(workflows)
        .values({
          userId: user.id,
          name,
          description,
          steps,
          triggers,
          isActive: true,
          executionCount: 0,
        });

      return json({ success: true });
    }

    case "delete_event": {
      const eventId = formData.get("eventId") as string;

      await db
        .delete(calendarEvents)
        .where(eq(calendarEvents.id, eventId));

      return json({ success: true });
    }

    case "delete_task": {
      const taskId = formData.get("taskId") as string;

      await db
        .delete(automatedTasks)
        .where(eq(automatedTasks.id, taskId));

      return json({ success: true });
    }

    case "delete_workflow": {
      const workflowId = formData.get("workflowId") as string;

      await db
        .delete(workflows)
        .where(eq(workflows.id, workflowId));

      return json({ success: true });
    }

    default:
      return json({ error: "Invalid action" }, { status: 400 });
  }
} 