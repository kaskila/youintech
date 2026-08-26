"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";
import { requireAdmin } from "@/lib/require-admin";
import {
  programmeFieldsSchema,
  programmeUpdateSchema,
  programmeArchiveSchema,
} from "@/lib/validations/programme";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/action-result";

function extractFields(formData: FormData) {
  return {
    slug: formData.get("slug"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description") ?? "",
    coverImage: formData.get("coverImage") ?? "",
    coverAlt: formData.get("coverAlt") ?? "",
    icon: formData.get("icon"),
    status: formData.get("status"),
    isFlagship: formData.get("isFlagship") === "on",
    applicationsOpen: formData.get("applicationsOpen") === "on",
    applicationUrl: formData.get("applicationUrl") ?? "",
    targetDate: formData.get("targetDate") ?? "",
    displayOrder: formData.get("displayOrder"),
    contentStatus: formData.get("contentStatus"),
  };
}

export async function createProgramme(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = programmeFieldsSchema.safeParse(extractFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // b. auth check — any active staff member may create/edit programmes;
  // only ADMIN may archive one (see archiveProgramme below).
  const staff = await requireStaff();
  if (!staff.ok) return staff;

  // c. a rule Zod can't express as a single-field check: don't advertise
  // applications as open with nowhere to send people.
  if (parsed.data.applicationsOpen && !parsed.data.applicationUrl) {
    return { ok: false, error: "Add an application link before turning applications on." };
  }

  // d. mutate
  const { description, coverImage, coverAlt, applicationUrl, ...rest } = parsed.data;
  let created;
  try {
    created = await db.programme.create({
      data: {
        ...rest,
        description: description || null,
        coverImage: coverImage || null,
        coverAlt: coverAlt || null,
        applicationUrl: applicationUrl || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That slug is already used by another programme." };
    }
    throw error;
  }

  // e. audit log
  await db.auditLog.create({
    data: {
      action: "programme.created",
      entityType: "Programme",
      entityId: created.id,
      actorId: staff.user.id,
    },
  });

  // f. revalidate
  revalidatePath("/admin/programmes");
  revalidatePath("/programmes");
  revalidatePath(`/programmes/${created.slug}`);
  revalidatePath("/");

  // g. typed result
  return { ok: true };
}

export async function updateProgramme(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = programmeUpdateSchema.safeParse({
    id: formData.get("id"),
    ...extractFields(formData),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // b. auth check — any active staff member may create/edit programmes;
  // only ADMIN may archive one (see archiveProgramme below).
  const staff = await requireStaff();
  if (!staff.ok) return staff;

  // c. see createProgramme
  if (parsed.data.applicationsOpen && !parsed.data.applicationUrl) {
    return { ok: false, error: "Add an application link before turning applications on." };
  }

  // d. mutate
  const { id, description, coverImage, coverAlt, applicationUrl, ...rest } = parsed.data;
  const before = await db.programme.findUnique({ where: { id }, select: { slug: true } });
  let updated;
  try {
    updated = await db.programme.update({
      where: { id },
      data: {
        ...rest,
        description: description || null,
        coverImage: coverImage || null,
        coverAlt: coverAlt || null,
        applicationUrl: applicationUrl || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That slug is already used by another programme." };
    }
    throw error;
  }

  // e. audit log
  await db.auditLog.create({
    data: {
      action: "programme.updated",
      entityType: "Programme",
      entityId: updated.id,
      actorId: staff.user.id,
    },
  });

  // f. revalidate — admin list/detail, plus every public surface that reads
  // programmes: the list, this programme's detail page (old slug too, if it
  // changed), and the home page (in case a future slice adds one there).
  revalidatePath("/admin/programmes");
  revalidatePath(`/admin/programmes/${id}`);
  revalidatePath("/programmes");
  revalidatePath(`/programmes/${updated.slug}`);
  if (before && before.slug !== updated.slug) {
    revalidatePath(`/programmes/${before.slug}`);
  }
  revalidatePath("/");

  // g. typed result
  return { ok: true };
}

export async function archiveProgramme(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = programmeArchiveSchema.safeParse({ id: formData.get("id") });
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
    archived = await db.programme.update({
      where: { id },
      data: { contentStatus: "ARCHIVED" },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "Programme not found." };
    }
    throw error;
  }

  // d. audit log
  await db.auditLog.create({
    data: {
      action: "programme.archived",
      entityType: "Programme",
      entityId: archived.id,
      actorId: admin.user.id,
    },
  });

  // e. revalidate
  revalidatePath("/admin/programmes");
  revalidatePath("/programmes");
  revalidatePath(`/programmes/${archived.slug}`);
  revalidatePath("/");

  // f. typed result
  return { ok: true };
}
