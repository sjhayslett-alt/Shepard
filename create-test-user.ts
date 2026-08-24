import { sql } from "./src/db";
import crypto from "node:crypto";

const church = (await sql`SELECT id FROM churches LIMIT 1`)[0];
if (!church) {
  console.error("No church found — run db:seed first");
  process.exit(1);
}
console.log("Church:", church.id);

const HASH = "$2b$10$DG0GoA7SJPg4NTKPweq4qeHJzpFWuMar100jqQIg.xEegKyrbIQy6";

const existing = await sql.query("SELECT id FROM users WHERE email = $1", ["test@browser.test"]);
let userId: string;
if (existing.length > 0) {
  userId = existing[0].id;
  await sql.query("UPDATE users SET password_hash = $1 WHERE id = $2", [HASH, userId]);
  console.log("Updated user:", userId);
} else {
  const rows = await sql.query(
    "INSERT INTO users (church_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [church.id, "test@browser.test", HASH, "Browser Test", "admin"],
  );
  userId = rows[0].id;
  console.log("Created user:", userId);
}

const token = crypto.randomBytes(32).toString("hex");
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
await sql.query(
  "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
  [userId, token, expiresAt.toISOString()],
);
console.log("TOKEN:", token);
