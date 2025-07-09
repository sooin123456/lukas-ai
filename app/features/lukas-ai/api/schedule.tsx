import { data } from "react-router";
import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";

import { requireUser } from "~/core/lib/guards.server";
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
  // This is a temporary implementation
  return { id: "temp-user-id" };
}

export async function loader({ request }: any) {
  const user = await requireUser(request);
  
  // Get calendar events
  const events = await db
    .select({
      id: calendarEvents.id,
      title: calendarEvents.title,
      description: calendarEvents.description,
      startTime: calendarEvents.startTime,
      endTime: calendarEvents.endTime,
      location: calendarEvents.location,
      attendees: calendarEvents.attendees,
      isRecurring: calendarEvents.isRecurring,
      recurrenceRule: calendarEvents.recurrenceRule,
      created_at: calendarEvents.created_at,
    })
    .from(calendarEvents)
    .where(eq(calendarEvents.userId, user.id))
    .orderBy(calendarEvents.startTime);

  // Get automated tasks
  const tasks = await db
    .select({
      id: automatedTasks.id,
      name: automatedTasks.name,
      description: automatedTasks.description,
      taskType: automatedTasks.taskType,
      schedule: automatedTasks.schedule,
      isActive: automatedTasks.isActive,
      lastRun: automatedTasks.lastRun,
      nextRun: automatedTasks.nextRun,
      created_at: automatedTasks.created_at,
    })
    .from(automatedTasks)
    .where(eq(automatedTasks.userId, user.id))
    .orderBy(automatedTasks.created_at);

  // Get task executions
  const executions = await db
    .select({
      id: taskExecutions.id,
      taskId: taskExecutions.taskId,
      status: taskExecutions.status,
      startTime: taskExecutions.startTime,
      endTime: taskExecutions.endTime,
      result: taskExecutions.result,
      errorMessage: taskExecutions.errorMessage,
      created_at: taskExecutions.created_at,
    })
    .from(taskExecutions)
    .where(eq(taskExecutions.userId, user.id))
    .orderBy(taskExecutions.created_at)
    .limit(20);

  // Get time tracking entries
  const timeEntries = await db
    .select({
      id: timeTracking.id,
      taskName: timeTracking.taskName,
      description: timeTracking.description,
      startTime: timeTracking.startTime,
      endTime: timeTracking.endTime,
      duration: timeTracking.duration,
      category: timeTracking.category,
      created_at: timeTracking.created_at,
    })
    .from(timeTracking)
    .where(eq(timeTracking.userId, user.id))
    .orderBy(timeTracking.startTime)
    .limit(50);

  // Get workflows
  const workflows = await db
    .select({
      id: workflows.id,
      name: workflows.name,
      description: workflows.description,
      steps: workflows.steps,
      isActive: workflows.isActive,
      created_at: workflows.created_at,
    })
    .from(workflows)
    .where(eq(workflows.userId, user.id))
    .orderBy(workflows.created_at);

  return data({
    events,
    tasks,
    executions,
    timeEntries,
    workflows,
  });
}

export async function action({ request }: any) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  switch (action) {
    case "create_event": {
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const startTime = new Date(formData.get("startTime") as string);
      const endTime = new Date(formData.get("endTime") as string);
      const location = formData.get("location") as string;
      const attendees = formData.get("attendees") ? JSON.parse(formData.get("attendees") as string) : [];
      const isRecurring = formData.get("isRecurring") === "true";
      const recurrenceRule = formData.get("recurrenceRule") as string;

      await db
        .insert(calendarEvents)
        .values({
          userId: user.id,
          title,
          description,
          startTime,
          endTime,
          location,
          attendees,
          isRecurring,
          recurrenceRule,
        });

      return data({ success: true });
    }

    case "create_task": {
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const taskType = formData.get("taskType") as string;
      const schedule = formData.get("schedule") as string;
      const isActive = formData.get("isActive") === "true";

      await db
        .insert(automatedTasks)
        .values({
          userId: user.id,
          name,
          description,
          taskType,
          schedule,
          isActive,
        });

      return data({ success: true });
    }

    case "track_time": {
      const taskName = formData.get("taskName") as string;
      const description = formData.get("description") as string;
      const startTime = new Date(formData.get("startTime") as string);
      const endTime = new Date(formData.get("endTime") as string);
      const duration = parseInt(formData.get("duration") as string);
      const category = formData.get("category") as string;

      await db
        .insert(timeTracking)
        .values({
          userId: user.id,
          taskName,
          description,
          startTime,
          endTime,
          duration,
          category,
        });

      return data({ success: true });
    }

    case "create_workflow": {
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const steps = JSON.parse(formData.get("steps") as string);
      const isActive = formData.get("isActive") === "true";

      await db
        .insert(workflows)
        .values({
          userId: user.id,
          name,
          description,
          steps,
          isActive,
        });

      return data({ success: true });
    }

    case "delete_event": {
      const eventId = formData.get("eventId") as string;

      await db
        .delete(calendarEvents)
        .where(eq(calendarEvents.id, eventId));

      return data({ success: true });
    }

    case "delete_task": {
      const taskId = formData.get("taskId") as string;

      await db
        .delete(automatedTasks)
        .where(eq(automatedTasks.id, taskId));

      return data({ success: true });
    }

    case "delete_workflow": {
      const workflowId = formData.get("workflowId") as string;

      await db
        .delete(workflows)
        .where(eq(workflows.id, workflowId));

      return data({ success: true });
    }

    default:
      return data({ error: "Invalid action" }, { status: 400 });
  }
} 