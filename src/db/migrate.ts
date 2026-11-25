/**
 * Migration script: creates all Shepherd Events tables if they don't exist.
 * Run via `bun run db:migrate`.
 *
 * Uses CREATE TABLE IF NOT EXISTS so it's safe to run repeatedly (idempotent).
 * All primary keys are UUIDs generated via gen_random_uuid().
 * Foreign keys use ON DELETE CASCADE where appropriate.
 */

import { sql } from "../db";

async function migrate() {
  console.log("Running migrations...");

  // 1. churches
  await sql`
    CREATE TABLE IF NOT EXISTS churches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      address TEXT,
      phone TEXT,
      website TEXT,
      member_count INTEGER DEFAULT 0,
      plan_tier TEXT NOT NULL DEFAULT 'free'
        CHECK (plan_tier IN ('free', 'growing', 'established', 'thriving')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("  ✓ churches");

  // 2. users
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer'
        CHECK (role IN ('admin', 'editor', 'viewer')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("  ✓ users");

  // 3. events
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      event_type TEXT NOT NULL DEFAULT 'other'
        CHECK (event_type IN (
          'service', 'wedding', 'funeral', 'vbs', 'retreat',
          'potluck', 'outreach', 'other'
        )),
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'planned', 'active', 'completed', 'cancelled')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("  ✓ events");

  // 4. volunteers
  await sql`
    CREATE TABLE IF NOT EXISTS volunteers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      availability JSONB,
      skills JSONB,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("  ✓ volunteers");

  // 5. volunteer_roles
  await sql`
    CREATE TABLE IF NOT EXISTS volunteer_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
      is_default BOOLEAN NOT NULL DEFAULT false,
      UNIQUE (name, church_id)
    )
  `;
  console.log("  ✓ volunteer_roles");

  // 6. event_volunteers
  await sql`
    CREATE TABLE IF NOT EXISTS event_volunteers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
      role_id UUID NOT NULL REFERENCES volunteer_roles(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested', 'confirmed', 'declined')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (event_id, volunteer_id, role_id)
    )
  `;
  console.log("  ✓ event_volunteers");

  // 7. rooms
  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      capacity INTEGER,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("  ✓ rooms");

  // 8. resources
  await sql`
    CREATE TABLE IF NOT EXISTS resources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'other'
        CHECK (type IN ('equipment', 'furniture', 'av', 'kitchen', 'other')),
      quantity INTEGER DEFAULT 1,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("  ✓ resources");

  // 9. event_rooms
  await sql`
    CREATE TABLE IF NOT EXISTS event_rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (event_id, room_id)
    )
  `;
  console.log("  ✓ event_rooms");

  // 10. event_resources
  await sql`
    CREATE TABLE IF NOT EXISTS event_resources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (event_id, resource_id)
    )
  `;
  console.log("  ✓ event_resources");

  // 11. sessions
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("  ✓ sessions");

  // 12. event_ai_plans — persisted AI tool output per event
  await sql`
    CREATE TABLE IF NOT EXISTS event_ai_plans (
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (event_id, kind)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS event_ai_plans_church_idx
      ON event_ai_plans (church_id)
  `;
  console.log("  ✓ event_ai_plans");

  console.log("\nMigration complete — all 12 tables ready.");
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
