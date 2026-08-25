/**
 * Seed script: populates the database with default volunteer roles,
 * a demo church, and a demo admin user.
 * Run via `bun run db:seed` (after `bun run db:migrate`).
 *
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING for idempotency.
 */

import { sql } from "../db";

const DEFAULT_ROLES = [
  "greeter",
  "parking",
  "childrens_ministry",
  "security",
  "hospitality",
  "cleanup",
  "registration",
  "floater",
] as const;

async function seed() {
  console.log("Seeding database...");

  // ── Default volunteer roles (no church_id, is_default = true) ──
  console.log("  Inserting default volunteer roles...");
  for (const roleName of DEFAULT_ROLES) {
    await sql`
      INSERT INTO volunteer_roles (name, is_default)
      VALUES (${roleName}, true)
      ON CONFLICT (name, church_id) DO NOTHING
    `;
  }
  console.log(`  ✓ ${DEFAULT_ROLES.length} default roles`);

  // ── Demo church ──
  console.log("  Inserting demo church...");
  const [church] = await sql`
    INSERT INTO churches (name, slug, address, phone, website, member_count, plan_tier)
    VALUES (
      'Grace Fellowship Church',
      'grace-fellowship',
      '123 Main Street, Springfield, IL 62701',
      '(555) 123-4567',
      'https://gracefellowship.example.com',
      250,
      'growing'
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = now()
    RETURNING id, name, slug
  `;
  console.log(`  ✓ Demo church: ${church.name} (${church.slug})`);

  // ── Demo admin user (password: "password123") ──
  console.log("  Inserting demo admin user...");
  const [user] = await sql`
    INSERT INTO users (church_id, email, password_hash, name, role)
    VALUES (
      ${church.id},
      'admin@gracefellowship.example.com',
      '$2b$10$Acjub5bNDVtXlmWzIjy5jepaM1QbSYS1VP9lWCUPv2Ho5IhpghN8K',
      'Pastor John Smith',
      'admin'
    )
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      updated_at = now()
    RETURNING id, email, name, role
  `;
  console.log(`  ✓ Demo user: ${user.name} (${user.email}, role: ${user.role})`);

  // ── Demo rooms ──
  console.log("  Inserting demo rooms...");
  const rooms = [
    { name: "Main Sanctuary", capacity: 300, description: "Primary worship space with stage and AV system" },
    { name: "Fellowship Hall", capacity: 150, description: "Multipurpose room with kitchen access" },
    { name: "Classroom A", capacity: 30, description: "Adult Sunday school classroom" },
    { name: "Classroom B", capacity: 25, description: "Children's ministry classroom" },
    { name: "Nursery", capacity: 15, description: "Infant and toddler care room" },
    { name: "Youth Room", capacity: 40, description: "Teen ministry space with lounge area" },
    { name: "Conference Room", capacity: 12, description: "Small meeting room with AV equipment" },
  ];
  for (const room of rooms) {
    await sql`
      INSERT INTO rooms (church_id, name, capacity, description)
      VALUES (${church.id}, ${room.name}, ${room.capacity}, ${room.description})
    `;
  }
  console.log(`  ✓ ${rooms.length} demo rooms`);

  // ── Demo resources ──
  console.log("  Inserting demo resources...");
  const resources = [
    { name: "Portable Projector", type: "av", quantity: 2, notes: "1080p, includes HDMI cable" },
    { name: "Folding Tables", type: "furniture", quantity: 20, notes: "6ft rectangular" },
    { name: "Folding Chairs", type: "furniture", quantity: 100, notes: "Stackable grey chairs" },
    { name: "Coffee Urn", type: "kitchen", quantity: 3, notes: "40-cup capacity" },
    { name: "Wireless Microphone Set", type: "av", quantity: 4, notes: "Handheld + lapel combo" },
    { name: "Portable PA System", type: "equipment", quantity: 1, notes: "For outdoor events" },
  ];
  for (const resource of resources) {
    await sql`
      INSERT INTO resources (church_id, name, type, quantity, notes)
      VALUES (${church.id}, ${resource.name}, ${resource.type}, ${resource.quantity}, ${resource.notes})
    `;
  }
  console.log(`  ✓ ${resources.length} demo resources`);

  // ── Demo volunteers ──
  console.log("  Inserting demo volunteers...");
  const volunteers = [
    { name: "Sarah Williams", email: "sarah@example.com", phone: "(555) 111-2222", skills: JSON.stringify(["greeter", "hospitality"]), availability: JSON.stringify({ weekdays: ["Sunday"], times: ["morning"] }) },
    { name: "Mike Johnson", email: "mike@example.com", phone: "(555) 222-3333", skills: JSON.stringify(["parking", "security"]), availability: JSON.stringify({ weekdays: ["Sunday", "Wednesday"], times: ["morning", "evening"] }) },
    { name: "Emily Davis", email: "emily@example.com", phone: "(555) 333-4444", skills: JSON.stringify(["childrens_ministry", "registration"]), availability: JSON.stringify({ weekdays: ["Sunday"], times: ["morning"] }) },
    { name: "Robert Brown", email: "robert@example.com", phone: "(555) 444-5555", skills: JSON.stringify(["cleanup", "floater"]), availability: JSON.stringify({ weekdays: ["Sunday", "Saturday"], times: ["morning", "afternoon"] }) },
    { name: "Lisa Martinez", email: "lisa@example.com", phone: "(555) 555-6666", skills: JSON.stringify(["hospitality", "greeter"]), availability: JSON.stringify({ weekdays: ["Sunday"], times: ["morning", "evening"] }) },
  ];
  for (const vol of volunteers) {
    await sql`
      INSERT INTO volunteers (church_id, name, email, phone, skills, availability)
      VALUES (${church.id}, ${vol.name}, ${vol.email}, ${vol.phone}, ${vol.skills}::jsonb, ${vol.availability}::jsonb)
    `;
  }
  console.log(`  ✓ ${volunteers.length} demo volunteers`);

  // ── Demo church-specific roles (custom) ──
  console.log("  Inserting custom church role...");
  await sql`
    INSERT INTO volunteer_roles (name, church_id, is_default)
    VALUES ('worship_team', ${church.id}, false)
    ON CONFLICT (name, church_id) DO NOTHING
  `;
  console.log("  ✓ Custom role: worship_team");

  console.log("\nSeed complete — demo data ready.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
