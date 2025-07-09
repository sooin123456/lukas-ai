import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { eq, desc, and, gte, lte, sum, count, avg } from "drizzle-orm";
import { z } from "zod";

import db from "~/core/db/drizzle-client.server";
import { requireUser } from "~/core/lib/guards.server";
import { 
  calendarEvents, 
  automatedTasks, 
  taskExecutions, 
  timeTracking, 
  workflows 
} from "~/features/lukas-ai/schema";

// Calendar event schema
const calendarEventSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  description: z.string().optional(),
  startTime: z.string().datetime("시작 시간을 입력해주세요"),
  endTime: z.string().datetime("종료 시간을 입력해주세요"),
  type: z.enum(["meeting", "task", "reminder", "deadline"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  recurrence: z.record(z.any()).optional(),
  reminders: z.array(z.record(z.any())).optional(),
  tags: z.array(z.string()).optional(),
});

// Automated task schema
const automatedTaskSchema = z.object({
  name: z.string().min(1, "작업명을 입력해주세요"),
  description: z.string().optional(),
  type: z.enum(["email", "notification", "data_processing", "report_generation"]),
  trigger: z.enum(["schedule", "event", "condition"]),
  triggerConfig: z.record(z.any()).optional(),
  action: z.enum(["send_email", "create_notification", "update_data", "generate_report"]),
  actionConfig: z.record(z.any()).optional(),
});

// Time tracking schema
const timeTrackingSchema = z.object({
  taskName: z.string().min(1, "작업명을 입력해주세요"),
  category: z.string().optional(),
  startTime: z.string().datetime("시작 시간을 입력해주세요"),
  endTime: z.string().datetime("종료 시간을 입력해주세요").optional(),
  duration: z.number().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Workflow schema
const workflowSchema = z.object({
  name: z.string().min(1, "워크플로우명을 입력해주세요"),
  description: z.string().optional(),
  steps: z.array(z.record(z.any())).optional(),
  triggers: z.array(z.record(z.any())).optional(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  
  // Get calendar events
  let eventsQuery = db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.userId, user.id))
    .orderBy(desc(calendarEvents.startTime));

  if (startDate && endDate) {
    eventsQuery = eventsQuery.where(
      and(
        gte(calendarEvents.startTime, new Date(startDate)),
        lte(calendarEvents.endTime, new Date(endDate))
      )
    );
  }

  const events = await eventsQuery;

  // Get automated tasks
  const tasks = await db
    .select()
    .from(automatedTasks)
    .where(eq(automatedTasks.userId, user.id))
    .orderBy(desc(automatedTasks.created_at));

  // Get task executions
  const executions = await db
    .select()
    .from(taskExecutions)
    .where(eq(taskExecutions.userId, user.id))
    .orderBy(desc(taskExecutions.executedAt))
    .limit(20);

  // Get time tracking entries
  const timeEntries = await db
    .select()
    .from(timeTracking)
    .where(eq(timeTracking.userId, user.id))
    .orderBy(desc(timeTracking.startTime))
    .limit(20);

  // Get workflows
  const workflowsData = await db
    .select()
    .from(workflows)
    .where(eq(workflows.userId, user.id))
    .orderBy(desc(workflows.created_at));

  return json({
    events,
    tasks,
    executions,
    timeEntries,
    workflows: workflowsData,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "create-event": {
        const data = calendarEventSchema.parse({
          title: formData.get("title"),
          description: formData.get("description"),
          startTime: formData.get("startTime"),
          endTime: formData.get("endTime"),
          type: formData.get("type"),
          priority: formData.get("priority"),
          location: formData.get("location"),
          attendees: formData.get("attendees") ? JSON.parse(formData.get("attendees") as string) : undefined,
          recurrence: formData.get("recurrence") ? JSON.parse(formData.get("recurrence") as string) : undefined,
          reminders: formData.get("reminders") ? JSON.parse(formData.get("reminders") as string) : undefined,
          tags: formData.get("tags") ? JSON.parse(formData.get("tags") as string) : undefined,
        });

        const [event] = await db
          .insert(calendarEvents)
          .values({
            userId: user.id,
            ...data,
          })
          .returning();

        return json({ success: true, event });
      }

      case "update-event": {
        const eventId = formData.get("eventId") as string;
        const data = calendarEventSchema.partial().parse({
          title: formData.get("title"),
          description: formData.get("description"),
          startTime: formData.get("startTime"),
          endTime: formData.get("endTime"),
          type: formData.get("type"),
          priority: formData.get("priority"),
          location: formData.get("location"),
          attendees: formData.get("attendees") ? JSON.parse(formData.get("attendees") as string) : undefined,
          recurrence: formData.get("recurrence") ? JSON.parse(formData.get("recurrence") as string) : undefined,
          reminders: formData.get("reminders") ? JSON.parse(formData.get("reminders") as string) : undefined,
          tags: formData.get("tags") ? JSON.parse(formData.get("tags") as string) : undefined,
        });

        const [event] = await db
          .update(calendarEvents)
          .set(data)
          .where(eq(calendarEvents.id, eventId))
          .returning();

        return json({ success: true, event });
      }

      case "delete-event": {
        const eventId = formData.get("eventId") as string;
        
        await db
          .delete(calendarEvents)
          .where(eq(calendarEvents.id, eventId));

        return json({ success: true });
      }

      case "create-automated-task": {
        const data = automatedTaskSchema.parse({
          name: formData.get("name"),
          description: formData.get("description"),
          type: formData.get("type"),
          trigger: formData.get("trigger"),
          triggerConfig: formData.get("triggerConfig") ? JSON.parse(formData.get("triggerConfig") as string) : {},
          action: formData.get("action"),
          actionConfig: formData.get("actionConfig") ? JSON.parse(formData.get("actionConfig") as string) : {},
        });

        const [task] = await db
          .insert(automatedTasks)
          .values({
            userId: user.id,
            ...data,
          })
          .returning();

        return json({ success: true, task });
      }

      case "toggle-task": {
        const taskId = formData.get("taskId") as string;
        const isActive = formData.get("isActive") === "true";
        
        const [task] = await db
          .update(automatedTasks)
          .set({ isActive })
          .where(eq(automatedTasks.id, taskId))
          .returning();

        return json({ success: true, task });
      }

      case "delete-task": {
        const taskId = formData.get("taskId") as string;
        
        await db
          .delete(automatedTasks)
          .where(eq(automatedTasks.id, taskId));

        return json({ success: true });
      }

      case "start-time-tracking": {
        const data = timeTrackingSchema.partial().parse({
          taskName: formData.get("taskName"),
          category: formData.get("category"),
          startTime: formData.get("startTime"),
          description: formData.get("description"),
          tags: formData.get("tags") ? JSON.parse(formData.get("tags") as string) : undefined,
        });

        const [entry] = await db
          .insert(timeTracking)
          .values({
            userId: user.id,
            startTime: new Date(),
            ...data,
          })
          .returning();

        return json({ success: true, entry });
      }

      case "stop-time-tracking": {
        const entryId = formData.get("entryId") as string;
        const endTime = new Date();
        
        const [entry] = await db
          .update(timeTracking)
          .set({ 
            endTime,
            duration: Math.floor((endTime.getTime() - new Date().getTime()) / 60000), // Minutes
          })
          .where(eq(timeTracking.id, entryId))
          .returning();

        return json({ success: true, entry });
      }

      case "create-workflow": {
        const data = workflowSchema.parse({
          name: formData.get("name"),
          description: formData.get("description"),
          steps: formData.get("steps") ? JSON.parse(formData.get("steps") as string) : [],
          triggers: formData.get("triggers") ? JSON.parse(formData.get("triggers") as string) : [],
        });

        const [workflow] = await db
          .insert(workflows)
          .values({
            userId: user.id,
            ...data,
          })
          .returning();

        return json({ success: true, workflow });
      }

      case "delete-workflow": {
        const workflowId = formData.get("workflowId") as string;
        
        await db
          .delete(workflows)
          .where(eq(workflows.id, workflowId));

        return json({ success: true });
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Schedule action error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

export function useScheduleData() {
  return useLoaderData<typeof loader>();
} 