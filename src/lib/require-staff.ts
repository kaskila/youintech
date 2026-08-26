import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@/generated/prisma/enums";

type RequireStaffResult =
  | { ok: true; user: { id: string; role: Role; isActive: boolean } }
  | { ok: false; error: string };

// Same freshness rule as requireAdmin (see that file for why): re-reads
// isActive from the database rather than trusting the cached session. Any
// active staff member passes — EDITOR or ADMIN. Use requireAdmin instead
// when the action is ADMIN-only (requireAdmin builds on this).
export async function requireStaff(): Promise<RequireStaffResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return { ok: false, error: "You do not have permission to do that." };
  }

  return { ok: true, user };
}
