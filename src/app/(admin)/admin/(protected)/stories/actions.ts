"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/require-staff";
import { requireAdmin } from "@/lib/require-admin";
import { storyFieldsSchema, storyUpdateSchema, storyArchiveSchema } from "@/lib/validations/story";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/action-result";

function extractFields(formData: FormData) {
  return {
    slug: formData.get("slug"),
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    coverImage: formData.get("coverImage") ?? "",
    coverAlt: formData.get("coverAlt") ?? "",
    sectorId: formData.get("sectorId") ?? "",
    status: formData.get("status"),
  };
}

// Every public + admin surface that reads a story, given its (possibly new)
// slug. Old slug is revalidated separately by updateStory when it changed.
function revalidateStory(slug: string) {
  revalidatePath("/admin/stories");
  revalidatePath("/stories");
  revalidatePath(`/stories/${slug}`);
  // Programme/sector pages don't list stories today, but the home page might
  // grow a "latest stories" strip in a later slice — cheap to keep fresh.
  revalidatePath("/");
}

export async function createStory(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = storyFieldsSchema.safeParse(extractFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // b. auth check — any active staff member may create/edit stories; only
  // ADMIN may archive one (see archiveStory below).
  const staff = await requireStaff();
  if (!staff.ok) return staff;

  // c. the upload widget already refuses to upload without alt text, but
  // that's client-side UX — this is the actual control (CLAUDE.md §7).
  // Mirrors programmes/actions.ts and events/actions.ts.
  if (parsed.data.coverImage && !parsed.data.coverAlt) {
    return { ok: false, error: "Add alt text for the cover image." };
  }

  const { coverImage, coverAlt, sectorId, ...rest } = parsed.data;

  // publishedAt is stamped the first time a story goes PUBLISHED and never
  // rewritten afterwards — see updateStory for the full rule. On create
  // there is no prior state, so it's simply "now" when publishing straight
  // away, otherwise null.
  const isPublishing = rest.status === "PUBLISHED";

  // d. mutate
  let created;
  try {
    created = await db.post.create({
      data: {
        ...rest,
        coverImage: coverImage || null,
        coverAlt: coverAlt || null,
        sectorId: sectorId || null,
        authorId: staff.user.id,
        publishedAt: isPublishing ? new Date() : null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That slug is already used by another story." };
    }
    throw error;
  }

  // e. audit log — publish and update are distinct actions (task §4).
  await db.auditLog.create({
    data: {
      action: isPublishing ? "post.publish" : "post.create",
      entityType: "Post",
      entityId: created.id,
      actorId: staff.user.id,
    },
  });

  // f. revalidate
  revalidateStory(created.slug);

  // g. typed result
  return { ok: true };
}

export async function updateStory(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = storyUpdateSchema.safeParse({
    id: formData.get("id"),
    ...extractFields(formData),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // b. auth check — see createStory
  const staff = await requireStaff();
  if (!staff.ok) return staff;

  // c. see createStory
  if (parsed.data.coverImage && !parsed.data.coverAlt) {
    return { ok: false, error: "Add alt text for the cover image." };
  }

  const { id, coverImage, coverAlt, sectorId, ...rest } = parsed.data;

  const before = await db.post.findUnique({
    where: { id },
    select: { slug: true, publishedAt: true },
  });
  if (!before) {
    return { ok: false, error: "Story not found." };
  }

  // publishedAt is set ONCE, on the first DRAFT→PUBLISHED transition, and
  // never touched again:
  //  - already has a value        → keep it, whatever the new status is.
  //  - null and now PUBLISHED     → stamp it now (the first publish).
  //  - null and still DRAFT       → stays null.
  // Unpublishing (PUBLISHED→DRAFT) deliberately does NOT clear it — a story
  // pulled back to draft and re-published later must keep its original
  // date, not jump to the top of /stories or rewrite its own history. This
  // reads like a missing branch to whoever edits it next. It isn't one.
  const isFirstPublish = before.publishedAt == null && rest.status === "PUBLISHED";
  const publishedAt = isFirstPublish ? new Date() : before.publishedAt;

  // d. mutate
  let updated;
  try {
    updated = await db.post.update({
      where: { id },
      data: {
        ...rest,
        coverImage: coverImage || null,
        coverAlt: coverAlt || null,
        sectorId: sectorId || null,
        publishedAt,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That slug is already used by another story." };
    }
    throw error;
  }

  // e. audit log — only the first publish is a "post.publish"; every other
  // save (including edits to an already-published story, and unpublishing)
  // is a "post.update". Task §4.
  await db.auditLog.create({
    data: {
      action: isFirstPublish ? "post.publish" : "post.update",
      entityType: "Post",
      entityId: updated.id,
      actorId: staff.user.id,
    },
  });

  // f. revalidate — admin detail plus the shared surfaces, and the old slug
  // too if it changed (existing links to the previous URL).
  revalidatePath(`/admin/stories/${id}`);
  revalidateStory(updated.slug);
  if (before.slug !== updated.slug) {
    revalidatePath(`/stories/${before.slug}`);
  }

  // g. typed result
  return { ok: true };
}

export async function archiveStory(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = storyArchiveSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { ok: false, error: "Invalid input." };
  }

  // b. auth check — ADMIN only. Archiving is a one-way door (soft delete —
  // CLAUDE.md §5), unlike create/edit which any active staff can do.
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  // c. mutate — archive, never delete. publishedAt is left untouched, same
  // rule as unpublishing (see updateStory).
  const { id } = parsed.data;
  let archived;
  try {
    archived = await db.post.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "Story not found." };
    }
    throw error;
  }

  // d. audit log
  await db.auditLog.create({
    data: {
      action: "post.archive",
      entityType: "Post",
      entityId: archived.id,
      actorId: admin.user.id,
    },
  });

  // e. revalidate
  revalidateStory(archived.slug);

  // f. typed result
  return { ok: true };
}
