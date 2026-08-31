"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";
import { isCurrentPassword, setUserPassword } from "@/lib/password";
import { changePasswordSchema } from "@/lib/validations/user";
import type { ActionResult } from "@/lib/action-result";

// The user changing their OWN password. Open to any active staff member
// (EDITOR or ADMIN) — role is irrelevant here.
//
// This action re-checks the session itself (requireStaff). The (protected)
// layout's redirect and proxy.ts are both convenience, not the boundary
// (CLAUDE.md §7) — this runs even if someone POSTs straight past them.
//
// It is NOT gated on mustChangePassword: it's reachable both from the forced
// flow (mustChangePassword = true) and as a voluntary password change, and
// it's what clears the flag. See src/app/(admin)/admin/change-password/page.tsx
// for why this route sits outside the (protected) group (redirect-loop
// avoidance, same class as the admin/login layout problem in CLAUDE.md §4).
export async function changeOwnPassword(formData: FormData): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const staff = await requireStaff();
  if (!staff.ok) return staff;

  const { newPassword } = parsed.data;

  // Must differ from the current password. Needs the stored hash, so it
  // can't live in the Zod schema.
  if (await isCurrentPassword(staff.user.id, newPassword)) {
    return { ok: false, error: "Your new password must be different from your current one." };
  }

  await setUserPassword(staff.user.id, newPassword);
  await db.user.update({
    where: { id: staff.user.id },
    data: { mustChangePassword: false },
  });

  await db.auditLog.create({
    data: {
      action: "user.password_change",
      entityType: "User",
      entityId: staff.user.id,
      // The actor here is the user themselves, not an admin.
      actorId: staff.user.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/change-password");
  return { ok: true };
}
