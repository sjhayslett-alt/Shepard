import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";
import { getAuthState } from "~/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Kinds of AI output that are persisted per event. One row per
 * (event_id, kind) in `event_ai_plans`.
 */
export type PlanKind =
  | "timeline"
  | "checklist"
  | "budget"
  | "volunteers"
  | "shopping_list"
  | "risk"
  | "setup"
  | "content"
  | "promotion"
  | "follow_up";

export type PlanMap = Record<string, any>;

// ---------------------------------------------------------------------------
// loadEventPlans — all saved plans for one event (church scoped)
// ---------------------------------------------------------------------------

export const loadEventPlans = createServerFn({ method: "GET" })
  .validator((d: unknown) => {
    const data = d as { eventId?: string };
    if (!data?.eventId) throw new Error("Event ID is required");
    return { eventId: data.eventId };
  })
  .handler(async ({ data }): Promise<PlanMap> => {
    const { user } = await getAuthState();
    if (!user) return {};

    const rows = await sql.query(
      "SELECT kind, payload FROM event_ai_plans WHERE event_id = $1 AND church_id = $2",
      [data.eventId, user.churchId],
    );

    const out: PlanMap = {};
    for (const row of rows as Array<{ kind: string; payload: unknown }>) {
      out[row.kind] = row.payload;
    }
    return out;
  });

// ---------------------------------------------------------------------------
// saveEventPlan — upsert one plan for one event (church scoped)
// ---------------------------------------------------------------------------

export const saveEventPlan = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { eventId?: string; kind?: string; payload?: unknown };
    if (!data?.eventId) throw new Error("Event ID is required");
    if (!data?.kind) throw new Error("Plan kind is required");
    return {
      eventId: data.eventId,
      kind: data.kind,
      payload: data.payload ?? {},
    };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    // The SELECT guards church ownership; ON CONFLICT keeps one row per
    // (event_id, kind) and refuses to write across churches.
    const rows = await sql.query(
      `INSERT INTO event_ai_plans (event_id, church_id, kind, payload, updated_at)
       SELECT e.id, e.church_id, $3, $4::jsonb, now()
         FROM events e
        WHERE e.id = $1 AND e.church_id = $2
       ON CONFLICT (event_id, kind) DO UPDATE
         SET payload = EXCLUDED.payload,
             updated_at = now()
       WHERE event_ai_plans.church_id = EXCLUDED.church_id
       RETURNING kind, updated_at`,
      [data.eventId, user.churchId, data.kind, JSON.stringify(data.payload)],
    );

    if (rows.length === 0) throw new Error("Event not found");
    return { success: true };
  });
