"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";
import { requireAdmin } from "@/lib/require-admin";
import { eventFieldsSchema, eventUpdateSchema, eventArchiveSchema } from "@/lib/validations/event";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/action-result";

function extractFields(formData: FormData) {
  return {
    slug: formData.get("slug"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    coverImage: formData.get("coverImage") ?? "",
    coverAlt: formData.get("coverAlt") ?? "",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") ?? "",
    venue: formData.get("venue") ?? "",
    isOnline: formData.get("isOnline") === "on",
    registrationUrl: formData.get("registrationUrl") ?? "",
    attendeeCount: formData.get("attendeeCount") ?? "",
    recapBody: formData.get("recapBody") ?? "",
    sectorId: formData.get("sectorId") ?? "",
    status: formData.get("status"),
  };
}

// attendeeCount/recapBody are post-event evidence — they make no sense
// before the event has actually happened. Zod can't express "only valid
// relative to another field's real-world meaning" as a single-field check,
// so this is checked here, same pattern as the coverImage/coverAlt pairing
// below. Checked against the *parsed* startsAt (i.e. against `now` at
// submit time), not left to the client to enforce.
function hasRecapData(data: { attendeeCount: number | null; recapBody: string }) {
  return data.attendeeCount !== null || data.recapBody !== "";
}

export async function createEvent(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = eventFieldsSchema.safeParse(extractFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // b. auth check — any active staff member may create/edit events; only
  // ADMIN may archive one (see archiveEvent below).
  const staff = await requireStaff();
  if (!staff.ok) return staff;

  // c. the upload widget (CloudinaryImageUpload) already refuses to upload
  // without alt text, but that's client-side UX — this is the actual
  // control (CLAUDE.md §7). Mirrors the same check in programmes/actions.ts.
  if (parsed.data.coverImage && !parsed.data.coverAlt) {
    return { ok: false, error: "Add alt text for the cover image." };
  }

  // d. see hasRecapData above — a new event's startsAt is essentially never
  // in the past, so this mostly guards a crafted request rather than a
  // real editor mistake, but it's the same control update relies on.
  if (hasRecapData(parsed.data) && parsed.data.startsAt.getTime() > Date.now()) {
    return {
      ok: false,
      error: "Attendee count and recap can only be added once the event has started.",
    };
  }

  // e. mutate
  const { coverImage, coverAlt, venue, registrationUrl, recapBody, sectorId, ...rest } =
    parsed.data;
  let created;
  try {
    created = await db.event.create({
      data: {
        ...rest,
        coverImage: coverImage || null,
        coverAlt: coverAlt || null,
        venue: venue || null,
        registrationUrl: registrationUrl || null,
        recapBody: recapBody || null,
        sectorId: sectorId || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That slug is already used by another event." };
    }
    throw error;
  }

  // f. audit log
  await db.auditLog.create({
    data: {
      action: "event.created",
      entityType: "Event",
      entityId: created.id,
      actorId: staff.user.id,
    },
  });

  // g. revalidate
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath(`/events/${created.slug}`);
  revalidatePath("/");

  // h. typed result
  return { ok: true };
}

export async function updateEvent(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = eventUpdateSchema.safeParse({
    id: formData.get("id"),
    ...extractFields(formData),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // b. auth check — see createEvent
  const staff = await requireStaff();
  if (!staff.ok) return staff;

  // c. see createEvent
  if (parsed.data.coverImage && !parsed.data.coverAlt) {
    return { ok: false, error: "Add alt text for the cover image." };
  }

  // d. see hasRecapData above — this is the real gate: an editor cannot
  // pre-fill attendee count or a recap for an event that hasn't happened
  // yet, no matter what the form let them type.
  if (hasRecapData(parsed.data) && parsed.data.startsAt.getTime() > Date.now()) {
    return {
      ok: false,
      error: "Attendee count and recap can only be added once the event has started.",
    };
  }

  // e. mutate
  const { id, coverImage, coverAlt, venue, registrationUrl, recapBody, sectorId, ...rest } =
    parsed.data;
  const before = await db.event.findUnique({ where: { id }, select: { slug: true } });
  let updated;
  try {
    updated = await db.event.update({
      where: { id },
      data: {
        ...rest,
        coverImage: coverImage || null,
        coverAlt: coverAlt || null,
        venue: venue || null,
        registrationUrl: registrationUrl || null,
        recapBody: recapBody || null,
        sectorId: sectorId || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That slug is already used by another event." };
    }
    throw error;
  }

  // f. audit log
  await db.auditLog.create({
    data: {
      action: "event.updated",
      entityType: "Event",
      entityId: updated.id,
      actorId: staff.user.id,
    },
  });

  // g. revalidate — admin list/detail, plus every public surface that reads
  // events: the list, this event's detail page (old slug too, if it
  // changed), and the home page.
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/events");
  revalidatePath(`/events/${updated.slug}`);
  if (before && before.slug !== updated.slug) {
    revalidatePath(`/events/${before.slug}`);
  }
  revalidatePath("/");

  // h. typed result
  return { ok: true };
}

export async function archiveEvent(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = eventArchiveSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { ok: false, error: "Invalid input." };
  }

  // b. auth check — ADMIN only. Archiving is a one-way door (soft delete —
  // see CLAUDE.md §5), unlike create/edit which any active staff can do.
  // NOTE: this is unrelated to the "past events never expire" rule — that
  // rule is about the automatic UPCOMING/PAST sort on the public page, not
  // about this manual, deliberate admin action.
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  // c. mutate — archive, never delete
  const { id } = parsed.data;
  let archived;
  try {
    archived = await db.event.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "Event not found." };
    }
    throw error;
  }

  // d. audit log
  await db.auditLog.create({
    data: {
      action: "event.archived",
      entityType: "Event",
      entityId: archived.id,
      actorId: admin.user.id,
    },
  });

  // e. revalidate
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath(`/events/${archived.slug}`);
  revalidatePath("/");

  // f. typed result
  return { ok: true };
}
