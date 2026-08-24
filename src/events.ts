import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";
import { getAuthState } from "~/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventType =
  | "service"
  | "wedding"
  | "funeral"
  | "vbs"
  | "retreat"
  | "potluck"
  | "outreach"
  | "other";

export type EventStatus =
  | "draft"
  | "planned"
  | "active"
  | "completed"
  | "cancelled";

export interface Event {
  id: string;
  church_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  event_type: EventType;
  start_date: string;
  end_date: string | null;
  location: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  service: "Service",
  wedding: "Wedding",
  funeral: "Funeral",
  vbs: "VBS",
  retreat: "Retreat",
  potluck: "Potluck",
  outreach: "Outreach",
  other: "Other",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  planned: "Planned",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  planned: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-teal-100 text-teal-700",
  cancelled: "bg-red-100 text-red-700",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  service: "bg-indigo-100 text-indigo-700",
  wedding: "bg-pink-100 text-pink-700",
  funeral: "bg-slate-100 text-slate-700",
  vbs: "bg-amber-100 text-amber-700",
  retreat: "bg-emerald-100 text-emerald-700",
  potluck: "bg-orange-100 text-orange-700",
  outreach: "bg-cyan-100 text-cyan-700",
  other: "bg-gray-100 text-gray-700",
};

// ---------------------------------------------------------------------------
// getEvents — list events for the church with optional filters
// ---------------------------------------------------------------------------

export const getEvents = createServerFn({ method: "GET" })
  .validator((d: unknown) => {
    const data = d as {
      status?: string;
      event_type?: string;
      sort?: string;
    };
    return {
      status: data.status || undefined,
      event_type: data.event_type || undefined,
      sort: data.sort || "upcoming",
    };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const where: string[] = ["church_id = $1"];
    const params: unknown[] = [user.churchId];
    let idx = 2;

    if (data.status) {
      where.push(`status = $${idx++}`);
      params.push(data.status);
    }
    if (data.event_type) {
      where.push(`event_type = $${idx++}`);
      params.push(data.event_type);
    }

    let order = "ORDER BY start_date ASC";
    if (data.sort === "recent") order = "ORDER BY created_at DESC";
    if (data.sort === "oldest") order = "ORDER BY start_date DESC";

    const query = `SELECT * FROM events WHERE ${where.join(" AND ")} ${order}`;
    const rows = await sql.query(query, params);
    return rows as Event[];
  });

// ---------------------------------------------------------------------------
// getEvent — single event with church ownership check
// ---------------------------------------------------------------------------

export const getEvent = createServerFn({ method: "GET" })
  .validator((d: unknown) => {
    const data = d as { eventId: string };
    if (!data.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const rows = await sql.query(
      "SELECT * FROM events WHERE id = $1 AND church_id = $2",
      [data.eventId, user.churchId],
    );
    if (rows.length === 0) throw new Error("Event not found");
    return rows[0] as Event;
  });

// ---------------------------------------------------------------------------
// createEvent — insert event with church_id from session
// ---------------------------------------------------------------------------

export const createEvent = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as {
      title?: string;
      description?: string;
      event_type?: string;
      start_date?: string;
      end_date?: string;
      location?: string;
      status?: string;
    };
    const errors: Record<string, string> = {};

    if (!data.title?.trim()) errors.title = "Title is required.";
    if (!data.start_date) errors.start_date = "Start date is required.";
    if (!data.end_date) errors.end_date = "End date is required.";
    if (
      data.start_date &&
      data.end_date &&
      new Date(data.end_date) <= new Date(data.start_date)
    ) {
      errors.end_date = "End date must be after start date.";
    }
    if (
      data.event_type &&
      !Object.keys(EVENT_TYPE_LABELS).includes(data.event_type)
    ) {
      errors.event_type = "Invalid event type.";
    }
    if (data.status && !Object.keys(EVENT_STATUS_LABELS).includes(data.status)) {
      errors.status = "Invalid status.";
    }

    return {
      title: data.title?.trim() ?? "",
      description: data.description?.trim() ?? "",
      event_type: (data.event_type || "other") as EventType,
      start_date: data.start_date ?? "",
      end_date: data.end_date ?? "",
      location: data.location?.trim() ?? "",
      status: (data.status || "draft") as EventStatus,
      errors,
    };
  })
  .handler(async ({ data }) => {
    if (Object.keys(data.errors).length > 0) {
      return { success: false, errors: data.errors };
    }

    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const rows = await sql.query(
      `INSERT INTO events (church_id, created_by, title, description, event_type, start_date, end_date, location, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        user.churchId,
        user.id,
        data.title,
        data.description || null,
        data.event_type,
        data.start_date,
        data.end_date || null,
        data.location || null,
        data.status,
      ],
    );
    return { success: true, event: rows[0] as Event };
  });

// ---------------------------------------------------------------------------
// updateEvent — update only if event belongs to user's church
// ---------------------------------------------------------------------------

export const updateEvent = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as {
      eventId?: string;
      title?: string;
      description?: string;
      event_type?: string;
      start_date?: string;
      end_date?: string;
      location?: string;
      status?: string;
    };
    const errors: Record<string, string> = {};

    if (!data.eventId) errors.eventId = "Event ID is required.";
    if (!data.title?.trim()) errors.title = "Title is required.";
    if (!data.start_date) errors.start_date = "Start date is required.";
    if (!data.end_date) errors.end_date = "End date is required.";
    if (
      data.start_date &&
      data.end_date &&
      new Date(data.end_date) <= new Date(data.start_date)
    ) {
      errors.end_date = "End date must be after start date.";
    }
    if (
      data.event_type &&
      !Object.keys(EVENT_TYPE_LABELS).includes(data.event_type)
    ) {
      errors.event_type = "Invalid event type.";
    }
    if (data.status && !Object.keys(EVENT_STATUS_LABELS).includes(data.status)) {
      errors.status = "Invalid status.";
    }

    return {
      eventId: data.eventId ?? "",
      title: data.title?.trim() ?? "",
      description: data.description?.trim() ?? "",
      event_type: (data.event_type || "other") as EventType,
      start_date: data.start_date ?? "",
      end_date: data.end_date ?? "",
      location: data.location?.trim() ?? "",
      status: (data.status || "draft") as EventStatus,
      errors,
    };
  })
  .handler(async ({ data }) => {
    if (Object.keys(data.errors).length > 0) {
      return { success: false, errors: data.errors };
    }

    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    // Verify ownership
    const existing = await sql.query(
      "SELECT id FROM events WHERE id = $1 AND church_id = $2",
      [data.eventId, user.churchId],
    );
    if (existing.length === 0) throw new Error("Event not found");

    const rows = await sql.query(
      `UPDATE events
       SET title = $1, description = $2, event_type = $3,
           start_date = $4, end_date = $5, location = $6, status = $7,
           updated_at = now()
       WHERE id = $8 AND church_id = $9
       RETURNING *`,
      [
        data.title,
        data.description || null,
        data.event_type,
        data.start_date,
        data.end_date || null,
        data.location || null,
        data.status,
        data.eventId,
        user.churchId,
      ],
    );
    return { success: true, event: rows[0] as Event };
  });

// ---------------------------------------------------------------------------
// deleteEvent — delete only if event belongs to user's church
// ---------------------------------------------------------------------------

export const deleteEvent = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId?: string };
    if (!data.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const result = await sql.query(
      "DELETE FROM events WHERE id = $1 AND church_id = $2 RETURNING id",
      [data.eventId, user.churchId],
    );
    if (result.length === 0) throw new Error("Event not found");
    return { success: true };
  });
