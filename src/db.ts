import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Server-only SQL helper connected to the Neon serverless Postgres database.
 *
 * `sql` is a tagged-template function backed by @neondatabase/serverless:
 *   const rows = await sql`SELECT id, name FROM churches WHERE id = ${churchId}`;
 *
 * It also exposes a `.query()` method for parameterized queries:
 *   const rows = await sql.query("SELECT id FROM users WHERE email = $1", [email]);
 *
 * The connection is resolved lazily — the error only surfaces if a query runs
 * without DATABASE_URL set. Use only inside createServerFn() or API routes.
 *
 * Falls back to reading .env if the DATABASE_URL env var is set to an invalid
 * placeholder (e.g. "npx neonctl@latest init").
 */

let _client: NeonQueryFunction<false, false> | null = null;

function tryReadEnvFile(): string | null {
  try {
    const envPath = join(process.cwd(), ".env");
    const contents = readFileSync(envPath, "utf-8");
    for (const line of contents.split("\n")) {
      const match = line.match(/^DATABASE_URL=(.+)$/);
      if (match) return match[1].trim();
    }
  } catch { /* .env may not exist */ }
  return null;
}

function isValidPgUrl(url: string): boolean {
  return /^postgres(ql)?:\/\/.+/.test(url);
}

function getClient(): NeonQueryFunction<false, false> {
  if (_client) return _client;
  let url = process.env.DATABASE_URL;

  // If the env var is set but not a valid PG URL, try reading .env
  if (url && !isValidPgUrl(url)) {
    const envFileUrl = tryReadEnvFile();
    if (envFileUrl && isValidPgUrl(envFileUrl)) {
      url = envFileUrl;
    }
  }

  if (!url || !isValidPgUrl(url)) {
    throw new Error(
      "DATABASE_URL is not set or invalid — connect a database before running queries.",
    );
  }
  _client = neon(url);
  return _client;
}

// Create a proxy so `sql`\`...\` and `sql.query(...)` both work transparently.
export const sql = new Proxy(
  // The target function handles tagged-template calls: sql\`SELECT ...\`
  ((strings: TemplateStringsArray, ...params: unknown[]) =>
    getClient()(strings, ...params)) as unknown as NeonQueryFunction<false, false> & {
    query: NeonQueryFunction<false, false>["query"];
  },
  {
    get(target, prop, receiver) {
      // For .query, .unsafe, or any other property access, delegate to the real client.
      const client = getClient();
      const val = Reflect.get(client, prop, client);
      if (typeof val === "function") {
        return val.bind(client);
      }
      return val;
    },
    apply(_target, _thisArg, args) {
      const client = getClient();
      return (client as unknown as Function).apply(client, args);
    },
  },
);
