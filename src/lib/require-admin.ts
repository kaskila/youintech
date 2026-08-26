import { Role } from "@/generated/prisma/enums";
import { requireStaff } from "@/lib/require-staff";

type RequireAdminResult =
  | { ok: true; user: { id: string; role: Role; isActive: boolean } }
  | { ok: false; error: string };

// Every mutating Server Action that's ADMIN-only calls this first, after Zod
// parsing. Builds on requireStaff (same session/isActive freshness rule —
// see that file) and adds the role check. Use requireStaff directly when
// the action is open to any active staff member, not just ADMIN.
export async function requireAdmin(): Promise<RequireAdminResult> {
  const staff = await requireStaff();
  if (!staff.ok) return staff;

  if (staff.user.role !== Role.ADMIN) {
    return { ok: false, error: "You do not have permission to do that." };
  }

  return staff;
}
