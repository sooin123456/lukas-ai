import { data } from "react-router";
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

export async function loader({ request }: any) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const type = url.searchParams.get("type");
  
  // Build where conditions for events
  const eventConditions: any[] = [eq(calendarEvents.userId, user.id)];
  if (startDate && endDate) {
    eventConditions.push(
      and(
        gte(calendarEvents.startTime, new Date(startDate)),
        lte(calendarEvents.endTime, new Date(endDate))
      )
    );
  }
  if (type) {
    eventConditions.push(eq(calendarEvents.type, type));
  }

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
      created_at: calendarEvents.created_at,
    })
    .from(calendarEvents)
    .where(and(...eventConditions))
    .orderBy(calendarEvents.startTime);

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
    .orderBy(automatedTasks.created_at);

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
      created_at: taskExecutions.created_at,
    })
    .from(taskExecutions)
    .where(eq(taskExecutions.taskId, automatedTasks.id))
    .orderBy(taskExecutions.startTime)
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
      created_at: timeTracking.created_at,
    })
    .from(timeTracking)
    .where(eq(timeTracking.userId, user.id))
    .orderBy(timeTracking.startTime)
    .limit(50);

  // Get workflows
  const workflowsList = await db
    .select({
      id: workflows.id,
      name: workflows.name,
      description: workflows.description,
      steps: workflows.steps,
      triggers: workflows.triggers,
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
    workflows: workflowsList,
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
      const type = formData.get("type") as string;
      const priority = formData.get("priority") as string;
      const location = formData.get("location") as string;
      const attendees = formData.get("attendees") ? JSON.parse(formData.get("attendees") as string) : null;
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
          location,
          attendees,
          recurrence,
          reminders,
          tags,
        });

      return data({ success: true });
    }

    case "update_event": {
      const eventId = formData.get("eventId") as string;
      const updateData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        startTime: formData.get("startTime") ? new Date(formData.get("startTime") as string) : undefined,
        endTime: formData.get("endTime") ? new Date(formData.get("endTime") as string) : undefined,
        type: formData.get("type") as string,
        priority: formData.get("priority") as string,
        status: formData.get("status") as string,
        location: formData.get("location") as string,
        attendees: formData.get("attendees") ? JSON.parse(formData.get("attendees") as string) : undefined,
        recurrence: formData.get("recurrence") ? JSON.parse(formData.get("recurrence") as string) : undefined,
        reminders: formData.get("reminders") ? JSON.parse(formData.get("reminders") as string) : undefined,
        tags: formData.get("tags") ? JSON.parse(formData.get("tags") as string) : undefined,
      };

      await db
        .update(calendarEvents)
        .set(updateData)
        .where(eq(calendarEvents.id, eventId));

      return data({ success: true });
    }

    case "delete_event": {
      const eventId = formData.get("eventId") as string;

      await db
        .delete(calendarEvents)
        .where(eq(calendarEvents.id, eventId));

      return data({ success: true });
    }

    case "track_time": {
      const taskName = formData.get("taskName") as string;
      const category = formData.get("category") as string;
      const startTime = new Date(formData.get("startTime") as string);
      const endTime = formData.get("endTime") ? new Date(formData.get("endTime") as string) : undefined;
      const duration = parseInt(formData.get("duration") as string) || 0;
      const description = formData.get("description") as string;
      const tags = formData.get("tags") ? JSON.parse(formData.get("tags") as string) : null;

      await db
        .insert(timeTracking)
        .values({
          userId: user.id,
          taskName,
          category,
          startTime,
          endTime,
          duration,
          description,
          tags,
        });

      return data({ success: true });
    }

    case "create_workflow": {
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const steps = formData.get("steps") ? JSON.parse(formData.get("steps") as string) : null;
      const triggers = formData.get("triggers") ? JSON.parse(formData.get("triggers") as string) : null;

      await db
        .insert(workflows)
        .values({
          userId: user.id,
          name,
          description,
          steps,
          triggers,
        });

      return data({ success: true });
    }

    default:
      return data({ error: "Invalid action" }, { status: 400 });
  }
} 