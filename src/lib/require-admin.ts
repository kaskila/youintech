import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@/generated/prisma/enums";

type RequireAdminResult =
  | { ok: true; user: { id: string; role: Role; isActive: boolean } }
  | { ok: false; error: string };

// Every mutating Server Action calls this first, after Zod parsing. The
// session cookie is cached for up to 60s (see auth.ts), so a role/isActive
// change can lag behind it — this re-reads both straight from the database
// instead of trusting the session's claims. Session existence itself can
// still come from the cookie; only role/isActive must be fresh.
export async function requireAdmin(): Promise<RequireAdminResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isActive: true },
  });

  if (!user || !user.isActive || user.role !== Role.ADMIN) {
    return { ok: false, error: "You do not have permission to do that." };
  }

  return { ok: true, user };
}
