"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";
import { requireAdmin } from "@/lib/require-admin";
import {
  opportunityCreateSchema,
  opportunityUpdateSchema,
  opportunityArchiveSchema,
} from "@/lib/validations/opportunity";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/action-result";

function extractFields(formData: FormData) {
  return {
    slug: formData.get("slug"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description") ?? "",
    organisation: formData.get("organisation"),
    type: formData.get("type"),
    location: formData.get("location") ?? "",
    isRemote: formData.get("isRemote") === "on",
    deadline: formData.get("deadline"),
    applyUrl: formData.get("applyUrl"),
    eligibility: formData.get("eligibility") ?? "",
    sectorId: formData.get("sectorId") ?? "",
    coverImage: formData.get("coverImage") ?? "",
    coverAlt: formData.get("coverAlt") ?? "",
    contentStatus: formData.get("contentStatus"),
  };
}

export async function createOpportunity(formData: FormData): Promise<ActionResult> {
  // a. Zod parse — the create-only schema rejects a past deadline (see
  // validations/opportunity.ts); update does not, so a listing can still be
  // edited after its deadline passes.
  const parsed = opportunityCreateSchema.safeParse(extractFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // b. auth check — any active staff member may create/edit opportunities;
  // only ADMIN may archive one (see archiveOpportunity below).
  const staff = await requireStaff();
  if (!staff.ok) return staff;

  // c. the upload widget (CloudinaryImageUpload) already refuses to upload
  // without alt text, but that's client-side UX — this is the actual
  // control (CLAUDE.md §7). Mirrors the same check in programmes/actions.ts.
  if (parsed.data.coverImage && !parsed.data.coverAlt) {
    return { ok: false, error: "Add alt text for the cover image." };
  }

  // d. mutate
  const { description, location, eligibility, sectorId, coverImage, coverAlt, ...rest } =
    parsed.data;
  let created;
  try {
    created = await db.opportunity.create({
      data: {
        ...rest,
        description: description || null,
        location: location || null,
        eligibility: eligibility || null,
        sectorId: sectorId || null,
        coverImage: coverImage || null,
        coverAlt: coverAlt || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That slug is already used by another opportunity." };
    }
    throw error;
  }

  // e. audit log
  await db.auditLog.create({
    data: {
      action: "opportunity.created",
      entityType: "Opportunity",
      entityId: created.id,
      actorId: staff.user.id,
    },
  });

  // f. revalidate — admin list, plus the public opportunities page. No
  // public [slug] detail page exists for this model (see CLAUDE.md §5) —
  // cards link straight out to applyUrl.
  revalidatePath("/admin/opportunities");
  revalidatePath("/opportunities");

  // g. typed result
  return { ok: true };
}

export async function updateOpportunity(formData: FormData): Promise<ActionResult> {
  // a. Zod parse — base schema, not the create-only future-deadline rule.
  const parsed = opportunityUpdateSchema.safeParse({
    id: formData.get("id"),
    ...extractFields(formData),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // b. auth check — see createOpportunity
  const staff = await requireStaff();
  if (!staff.ok) return staff;

  // c. see createOpportunity
  if (parsed.data.coverImage && !parsed.data.coverAlt) {
    return { ok: false, error: "Add alt text for the cover image." };
  }

  // d. mutate
  const { id, description, location, eligibility, sectorId, coverImage, coverAlt, ...rest } =
    parsed.data;
  let updated;
  try {
    updated = await db.opportunity.update({
      where: { id },
      data: {
        ...rest,
        description: description || null,
        location: location || null,
        eligibility: eligibility || null,
        sectorId: sectorId || null,
        coverImage: coverImage || null,
        coverAlt: coverAlt || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That slug is already used by another opportunity." };
    }
    throw error;
  }

  // e. audit log
  await db.auditLog.create({
    data: {
      action: "opportunity.updated",
      entityType: "Opportunity",
      entityId: updated.id,
      actorId: staff.user.id,
    },
  });

  // f. revalidate
  revalidatePath("/admin/opportunities");
  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePath("/opportunities");

  // g. typed result
  return { ok: true };
}

export async function archiveOpportunity(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = opportunityArchiveSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { ok: false, error: "Invalid input." };
  }

  // b. auth check — ADMIN only. Archiving is a one-way door (soft delete —
  // see CLAUDE.md §5), unlike create/edit which any active staff can do.
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  // c. mutate — archive, never delete
  const { id } = parsed.data;
  let archived;
  try {
    archived = await db.opportunity.update({
      where: { id },
      data: { contentStatus: "ARCHIVED" },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "Opportunity not found." };
    }
    throw error;
  }

  // d. audit log
  await db.auditLog.create({
    data: {
      action: "opportunity.archived",
      entityType: "Opportunity",
      entityId: archived.id,
      actorId: admin.user.id,
    },
  });

  // e. revalidate
  revalidatePath("/admin/opportunities");
  revalidatePath("/opportunities");

  // f. typed result
  return { ok: true };
}
