"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { inquiryFieldsSchema, CURRENT_PRIVACY_POLICY_VERSION } from "@/lib/validations/inquiry";
import type { ActionResult } from "@/lib/action-result";

// Public form — deliberately no requireAdmin() here. Anyone can submit an
// inquiry; there's nothing to authorize. See CLAUDE.md §2 "No member
// dashboard" — the public never signs in for this.
export async function submitInquiry(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = inquiryFieldsSchema.safeParse({
    category: formData.get("category"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    organisation: formData.get("organisation") ?? "",
    message: formData.get("message"),
    consent: formData.get("consent") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // b. naive rate limit — reject an identical email+message sent again
  // within 60s. Not a real rate limiter (no IP tracking, no backoff), just
  // enough to stop an accidental double-submit from creating two rows.
  const { category, name, email, phone, organisation, message } = parsed.data;
  const recentDuplicate = await db.inquiry.findFirst({
    where: {
      email,
      message,
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
    select: { id: true },
  });
  if (recentDuplicate) {
    return {
      ok: false,
      error: "Looks like you already sent this a moment ago — we've got it.",
    };
  }

  // c. mutate
  const now = new Date();
  const inquiry = await db.inquiry.create({
    data: {
      category,
      name,
      email,
      phone: phone || null,
      organisation: organisation || null,
      message,
      consentedAt: now,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
    },
  });

  // TODO: Resend notification to the team + confirmation to the submitter.
  // Deferred — no email sending in this slice. See CLAUDE.md §3 "Email".

  // d. audit log — actorId null: this is an anonymous public submission,
  // not a staff action.
  await db.auditLog.create({
    data: {
      action: "inquiry.created",
      entityType: "Inquiry",
      entityId: inquiry.id,
      actorId: null,
    },
  });

  // e. revalidate — the admin queue is the only thing that reads this data
  revalidatePath("/admin/inquiries");

  // f. typed result
  return { ok: true };
}
