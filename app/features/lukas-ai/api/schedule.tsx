import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/core/db/drizzle-client.server";
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
  type: z.enum(["meeting", "task", "deadline", "reminder"]).default("meeting"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  recurrence: z.object({
    type: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
    interval: z.number().min(1).default(1),
    endDate: z.string().datetime().optional(),
  }).optional(),
  reminders: z.array(z.number()).optional(), // Minutes before event
  tags: z.array(z.string()).optional(),
});

// Automated task schema
const automatedTaskSchema = z.object({
  name: z.string().min(1, "작업명을 입력해주세요"),
  description: z.string().optional(),
  type: z.enum(["email", "report", "reminder", "data_processing"]),
  trigger: z.enum(["schedule", "event", "condition"]),
  triggerConfig: z.object({
    schedule: z.string().optional(), // Cron expression
    event: z.string().optional(), // Event type
    condition: z.string().optional(), // Condition expression
  }),
  action: z.string().min(1, "실행할 작업을 입력해주세요"),
  actionConfig: z.object({
    email: z.object({
      to: z.array(z.string()).optional(),
      subject: z.string().optional(),
      template: z.string().optional(),
    }).optional(),
    report: z.object({
      type: z.string().optional(),
      format: z.string().optional(),
      recipients: z.array(z.string()).optional(),
    }).optional(),
  }),
});

// Time tracking schema
const timeTrackingSchema = z.object({
  taskName: z.string().min(1, "작업명을 입력해주세요"),
  category: z.string().optional(),
  startTime: z.string().datetime("시작 시간을 입력해주세요"),
  endTime: z.string().datetime("종료 시간을 입력해주세요"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Workflow schema
const workflowSchema = z.object({
  name: z.string().min(1, "워크플로우명을 입력해주세요"),
  description: z.string().optional(),
  steps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    config: z.record(z.any()),
  })),
  triggers: z.array(z.object({
    type: z.string(),
    config: z.record(z.any()),
  })).optional(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const startDate = url.searchParams.get("start");
  const endDate = url.searchParams.get("end");
  
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
    .orderBy(desc(automatedTasks.createdAt));

  // Get recent task executions
  const executions = await db
    .select()
    .from(taskExecutions)
    .where(eq(taskExecutions.taskId, tasks[0]?.id || ""))
    .orderBy(desc(taskExecutions.startTime))
    .limit(10);

  // Get time tracking data
  const timeEntries = await db
    .select()
    .from(timeTracking)
    .where(eq(timeTracking.userId, user.id))
    .orderBy(desc(timeTracking.startTime))
    .limit(20);

  // Get workflows
  const workflows = await db
    .select()
    .from(workflows)
    .where(eq(workflows.userId, user.id))
    .orderBy(desc(workflows.createdAt));

  return json({
    events,
    tasks,
    executions,
    timeEntries,
    workflows,
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
        return json({ error: "알 수 없는 액션입니다" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: error.errors[0]?.message || "입력 데이터가 유효하지 않습니다" }, { status: 400 });
    }
    return json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export function useScheduleData() {
  return useLoaderData<typeof loader>();
} 