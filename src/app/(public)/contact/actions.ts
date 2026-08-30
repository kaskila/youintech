"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { inquiryFieldsSchema, CURRENT_PRIVACY_POLICY_VERSION } from "@/lib/validations/inquiry";
import { retentionDeadline } from "@/lib/retention";
import type { ActionResult } from "@/lib/action-result";

// Public form — deliberately no requireAdmin() here. Anyone can submit an
// inquiry; there's nothing to authorize. See CLAUDE.md §2 "No member
// dashboard" — the public never signs in for this.
export async function submitInquiry(formData: FormData): Promise<ActionResult> {
  // a. Zod parse — includes the under-18 guardian-consent cross-field
  // check (see validations/inquiry.ts superRefine). Not just a UI
  // courtesy: a raw POST with ageBracket "16-17" and no guardian fields
  // is rejected right here.
  const parsed = inquiryFieldsSchema.safeParse({
    category: formData.get("category"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    organisation: formData.get("organisation") ?? "",
    message: formData.get("message"),
    ageBracket: formData.get("ageBracket"),
    guardianName: formData.get("guardianName") ?? "",
    guardianEmail: formData.get("guardianEmail") ?? "",
    guardianConsent: formData.get("guardianConsent") === "on",
    consent: formData.get("consent") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // b. naive rate limit — reject an identical email+message sent again
  // within 60s. Not a real rate limiter (no IP tracking, no backoff), just
  // enough to stop an accidental double-submit from creating two rows.
  const {
    category,
    name,
    email,
    phone,
    organisation,
    message,
    ageBracket,
    guardianName,
    guardianEmail,
    guardianConsent,
  } = parsed.data;
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
      ageBracket,
      // Guardian fields only ever come from the form when ageBracket is
      // "16-17" (see contact-form.tsx) — for every other bracket these
      // arrive as empty strings and guardianConsent as false, which is
      // exactly what should land in the database for a non-minor.
      guardianName: guardianName || null,
      guardianEmail: guardianEmail || null,
      guardianConsent,
      consentedAt: now,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      // Retention decision, 2026-08 — see /privacy "How long we keep it"
      // and src/lib/retention.ts.
      retentionUntil: retentionDeadline(now),
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
