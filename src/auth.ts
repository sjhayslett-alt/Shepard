import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  churchId: string;
  churchName: string;
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `;
  return token;
}

async function getSessionByToken(
  token: string,
): Promise<SessionUser | null> {
  const rows = await sql`
    SELECT s.token, s.expires_at,
           u.id, u.email, u.name, u.role, u.church_id,
           c.name AS church_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    JOIN churches c ON c.id = u.church_id
    WHERE s.token = ${token}
      AND s.expires_at > now()
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    churchId: r.church_id,
    churchName: r.church_name,
  };
}

async function deleteSessionByToken(token: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    out[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return out;
}

// ---------------------------------------------------------------------------
// getAuthState — callable from both SSR (beforeLoad) and client
// ---------------------------------------------------------------------------

export const getAuthState = createServerFn({ method: "GET" }).handler(
  async () => {
    let token: string | undefined;

    // 1) Try to get cookie from the H3 event (SSR context)
    try {
      const { getEvent } = await import("@tanstack/react-start/server");
      const event = getEvent();
      const cookieHeader =
        (event as any)?.node?.req?.headers?.cookie ??
        (event as any)?.request?.headers?.get?.("cookie");
      if (cookieHeader) {
        token = parseCookies(cookieHeader)["shepherd_session"];
      }
    } catch {
      // Not in SSR context — fall through
    }

    // 2) Try to get cookie from the incoming Request (HTTP-called server function)
    if (!token) {
      try {
        // TanStack Start provides the request via AsyncLocalStorage
        const { getRequest } = await import(
          "@tanstack/react-start/server"
        ).catch(() => ({}));
        if (getRequest) {
          const req = getRequest();
          const cookieHeader = (req as Request)?.headers?.get?.("cookie");
          if (cookieHeader) {
            token = parseCookies(cookieHeader)["shepherd_session"];
          }
        }
      } catch {
        // Not available
      }
    }

    if (!token) return { user: null };

    const user = await getSessionByToken(token);
    return { user };
  },
);

// ---------------------------------------------------------------------------
// signupFn
// ---------------------------------------------------------------------------

export const signupFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as {
      churchName?: string;
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    };
    const errors: Record<string, string> = {};

    if (!data.churchName?.trim()) errors.churchName = "Church name is required.";
    if (!data.name?.trim()) errors.name = "Your name is required.";
    if (!data.email?.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (!data.password) {
      errors.password = "Password is required.";
    } else if (data.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    return {
      churchName: data.churchName?.trim() ?? "",
      name: data.name?.trim() ?? "",
      email: data.email?.trim() ?? "",
      password: data.password ?? "",
      errors,
    };
  })
  .handler(async ({ data }) => {
    if (Object.keys(data.errors).length > 0) {
      return { success: false, errors: data.errors };
    }

    // Check existing email
    const existing = await sql`SELECT id FROM users WHERE email = ${data.email}`;
    if (existing.length > 0) {
      return {
        success: false,
        errors: { email: "An account with this email already exists." },
      };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const baseSlug = data.churchName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const slug = `${baseSlug}-${crypto.randomBytes(4).toString("hex")}`;

    const [church] = await sql`
      INSERT INTO churches (name, slug, plan_tier)
      VALUES (${data.churchName}, ${slug}, 'free')
      RETURNING id, name
    `;

    const [user] = await sql`
      INSERT INTO users (church_id, email, password_hash, name, role)
      VALUES (${church.id}, ${data.email}, ${passwordHash}, ${data.name}, 'admin')
      RETURNING id, email, name, role, church_id
    `;

    const token = await createSession(user.id);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        churchId: user.church_id,
        churchName: church.name,
      } satisfies SessionUser,
    };
  });

// ---------------------------------------------------------------------------
// loginFn
// ---------------------------------------------------------------------------

export const loginFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { email?: string; password?: string };
    const errors: Record<string, string> = {};
    if (!data.email?.trim()) errors.email = "Email is required.";
    if (!data.password) errors.password = "Password is required.";
    return {
      email: data.email?.trim() ?? "",
      password: data.password ?? "",
      errors,
    };
  })
  .handler(async ({ data }) => {
    if (Object.keys(data.errors).length > 0) {
      return { success: false, errors: data.errors };
    }

    const rows = await sql`
      SELECT u.id, u.email, u.name, u.role, u.password_hash, u.church_id,
             c.name AS church_name
      FROM users u
      JOIN churches c ON c.id = u.church_id
      WHERE u.email = ${data.email}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return { success: false, errors: { form: "Invalid email or password." } };
    }

    const user = rows[0];
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      return { success: false, errors: { form: "Invalid email or password." } };
    }

    const token = await createSession(user.id);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        churchId: user.church_id,
        churchName: user.church_name,
      } satisfies SessionUser,
    };
  });

// ---------------------------------------------------------------------------
// logoutFn
// ---------------------------------------------------------------------------

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { getEvent } = await import("@tanstack/react-start/server");
    const event = getEvent();
    const cookieHeader =
      (event as any)?.node?.req?.headers?.cookie ??
      (event as any)?.request?.headers?.get?.("cookie");
    if (cookieHeader) {
      const token = parseCookies(cookieHeader)["shepherd_session"];
      if (token) await deleteSessionByToken(token);
    }
  } catch {
    // best effort
  }
  return { success: true };
});

// ---------------------------------------------------------------------------
// Client-side cookie helpers
// ---------------------------------------------------------------------------

export function setSessionCookie(token: string): void {
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `shepherd_session=${token}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}

export function clearSessionCookie(): void {
  document.cookie =
    "shepherd_session=; Max-Age=0; Path=/; SameSite=Lax; Secure";
}
