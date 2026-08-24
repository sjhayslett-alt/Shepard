import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";
import { getAuthState } from "~/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Volunteer {
  id: string;
  church_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  availability: Record<string, unknown> | null;
  skills: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VolunteerRole {
  id: string;
  name: string;
  church_id: string | null;
  is_default: boolean;
}

export const DEFAULT_ROLE_LABELS: Record<string, string> = {
  greeter: "Greeter",
  parking: "Parking",
  childrens_ministry: "Children's Ministry",
  security: "Security",
  hospitality: "Hospitality",
  cleanup: "Cleanup",
  registration: "Registration",
  floater: "Floater",
};

export const DEFAULT_ROLE_DESCRIPTIONS: Record<string, string> = {
  greeter: "Welcome attendees, hand out bulletins, and help visitors feel at home.",
  parking: "Direct traffic, manage parking lot flow, and assist with shuttle service.",
  childrens_ministry: "Teach and supervise children during services and events.",
  security: "Monitor premises, ensure safety protocols, and handle emergencies.",
  hospitality: "Prepare and serve refreshments, set up fellowship areas.",
  cleanup: "Tidy up after events, take out trash, reset rooms for next use.",
  registration: "Check in attendees, manage sign-up sheets, and track headcounts.",
  floater: "Fill in wherever needed — a flexible helping hand across all areas.",
};

// ---------------------------------------------------------------------------
// getVolunteers — list volunteers for the church with optional skill filter
// ---------------------------------------------------------------------------

export const getVolunteers = createServerFn({ method: "GET" })
  .validator((d: unknown) => {
    const data = d as { skill?: string };
    return { skill: data.skill || undefined };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    let rows;
    if (data.skill) {
      rows = await sql.query(
        `SELECT * FROM volunteers
         WHERE church_id = $1 AND skills ? $2
         ORDER BY name ASC`,
        [user.churchId, data.skill],
      );
    } else {
      rows = await sql.query(
        `SELECT * FROM volunteers
         WHERE church_id = $1
         ORDER BY name ASC`,
        [user.churchId],
      );
    }
    return rows as Volunteer[];
  });

// ---------------------------------------------------------------------------
// getVolunteerRoles — get all roles (default + church-specific)
// ---------------------------------------------------------------------------

export const getVolunteerRoles = createServerFn({ method: "GET" })
  .handler(async () => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const rows = await sql.query(
      `SELECT * FROM volunteer_roles
       WHERE church_id = $1 OR is_default = true
       ORDER BY is_default DESC, name ASC`,
      [user.churchId],
    );
    return rows as VolunteerRole[];
  });

// ---------------------------------------------------------------------------
// createVolunteer
// ---------------------------------------------------------------------------

export const createVolunteer = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as {
      name?: string;
      email?: string;
      phone?: string;
      skills?: string[];
      availability?: string;
      notes?: string;
    };
    const errors: Record<string, string> = {};
    if (!data.name?.trim()) errors.name = "Name is required.";
    return {
      name: data.name?.trim() ?? "",
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      skills: data.skills || [],
      availability: data.availability?.trim() || null,
      notes: data.notes?.trim() || null,
      errors,
    };
  })
  .handler(async ({ data }) => {
    if (Object.keys(data.errors).length > 0) {
      return { success: false, errors: data.errors };
    }

    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const skillsJson = JSON.stringify(data.skills);
    const availabilityJson = data.availability
      ? JSON.stringify({ notes: data.availability })
      : null;

    const rows = await sql.query(
      `INSERT INTO volunteers (church_id, name, email, phone, skills, availability, notes)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
       RETURNING *`,
      [
        user.churchId,
        data.name,
        data.email,
        data.phone,
        skillsJson,
        availabilityJson,
        data.notes,
      ],
    );
    return { success: true, volunteer: rows[0] as Volunteer };
  });

// ---------------------------------------------------------------------------
// updateVolunteer
// ---------------------------------------------------------------------------

export const updateVolunteer = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as {
      volunteerId?: string;
      name?: string;
      email?: string;
      phone?: string;
      skills?: string[];
      availability?: string;
      notes?: string;
    };
    const errors: Record<string, string> = {};
    if (!data.volunteerId) errors.volunteerId = "Volunteer ID is required.";
    if (!data.name?.trim()) errors.name = "Name is required.";
    return {
      volunteerId: data.volunteerId ?? "",
      name: data.name?.trim() ?? "",
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      skills: data.skills || [],
      availability: data.availability?.trim() || null,
      notes: data.notes?.trim() || null,
      errors,
    };
  })
  .handler(async ({ data }) => {
    if (Object.keys(data.errors).length > 0) {
      return { success: false, errors: data.errors };
    }

    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const existing = await sql.query(
      "SELECT id FROM volunteers WHERE id = $1 AND church_id = $2",
      [data.volunteerId, user.churchId],
    );
    if (existing.length === 0) throw new Error("Volunteer not found");

    const skillsJson = JSON.stringify(data.skills);
    const availabilityJson = data.availability
      ? JSON.stringify({ notes: data.availability })
      : null;

    const rows = await sql.query(
      `UPDATE volunteers
       SET name = $1, email = $2, phone = $3, skills = $4::jsonb,
           availability = $5::jsonb, notes = $6, updated_at = now()
       WHERE id = $7 AND church_id = $8
       RETURNING *`,
      [
        data.name,
        data.email,
        data.phone,
        skillsJson,
        availabilityJson,
        data.notes,
        data.volunteerId,
        user.churchId,
      ],
    );
    return { success: true, volunteer: rows[0] as Volunteer };
  });

// ---------------------------------------------------------------------------
// deleteVolunteer
// ---------------------------------------------------------------------------

export const deleteVolunteer = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { volunteerId?: string };
    if (!data.volunteerId) throw new Error("Volunteer ID is required");
    return { volunteerId: data.volunteerId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const result = await sql.query(
      "DELETE FROM volunteers WHERE id = $1 AND church_id = $2 RETURNING id",
      [data.volunteerId, user.churchId],
    );
    if (result.length === 0) throw new Error("Volunteer not found");
    return { success: true };
  });
