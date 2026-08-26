"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { inquiryStatusSchema } from "@/lib/validations/inquiry";
import type { ActionResult } from "@/lib/action-result";

export async function updateInquiryStatus(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = inquiryStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // b. auth check — role/isActive from the database, not the session
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  // c. mutate
  const { id, status } = parsed.data;
  const updated = await db.inquiry.update({ where: { id }, data: { status } });

  // d. audit log
  await db.auditLog.create({
    data: {
      action: "inquiry.status_changed",
      entityType: "Inquiry",
      entityId: updated.id,
      actorId: admin.user.id,
      metadata: { status },
    },
  });

  // e. revalidate
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);

  // f. typed result
  return { ok: true };
}
