"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { sectorUpdateSchema, sectorMoveSchema } from "@/lib/validations/sector";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/action-result";

export async function updateSector(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = sectorUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    tagline: formData.get("tagline") ?? "",
    description: formData.get("description") ?? "",
    icon: formData.get("icon") ?? "",
    displayOrder: formData.get("displayOrder"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // b. auth check — role/isActive from the database, not the session
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  // c. mutate
  const { id, tagline, description, icon, ...rest } = parsed.data;
  const before = await db.sector.findUnique({ where: { id }, select: { slug: true } });
  let updated;
  try {
    updated = await db.sector.update({
      where: { id },
      data: {
        ...rest,
        tagline: tagline || null,
        description: description || null,
        icon: icon || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That slug is already used by another sector." };
    }
    throw error;
  }

  // d. audit log
  await db.auditLog.create({
    data: {
      action: "sector.updated",
      entityType: "Sector",
      entityId: updated.id,
      actorId: admin.user.id,
    },
  });

  // e. revalidate — admin list/detail, plus every public surface that reads
  // sectors: the programmes list, this sector's detail page (old slug too,
  // if it changed), and the home page sector grid.
  revalidatePath("/admin/sectors");
  revalidatePath(`/admin/sectors/${id}`);
  revalidatePath("/programmes");
  revalidatePath(`/programmes/${updated.slug}`);
  if (before && before.slug !== updated.slug) {
    revalidatePath(`/programmes/${before.slug}`);
  }
  revalidatePath("/");

  // f. typed result
  return { ok: true };
}

export async function moveSector(formData: FormData): Promise<ActionResult> {
  // a. Zod parse
  const parsed = sectorMoveSchema.safeParse({
    id: formData.get("id"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid input." };
  }

  // b. auth check — role/isActive from the database, not the session
  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  // c. mutate — swap displayOrder with the adjacent sector
  const { id, direction } = parsed.data;
  const sectors = await db.sector.findMany({ orderBy: { displayOrder: "asc" } });
  const index = sectors.findIndex((sector) => sector.id === id);
  if (index === -1) {
    return { ok: false, error: "Sector not found." };
  }

  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= sectors.length) {
    return { ok: false, error: direction === "up" ? "Already first." : "Already last." };
  }

  const current = sectors[index];
  const neighbor = sectors[neighborIndex];

  await db.$transaction([
    db.sector.update({ where: { id: current.id }, data: { displayOrder: neighbor.displayOrder } }),
    db.sector.update({ where: { id: neighbor.id }, data: { displayOrder: current.displayOrder } }),
  ]);

  // d. audit log
  await db.auditLog.create({
    data: {
      action: "sector.reordered",
      entityType: "Sector",
      entityId: current.id,
      actorId: admin.user.id,
    },
  });

  // e. revalidate — reordering changes listing order on both public surfaces
  revalidatePath("/admin/sectors");
  revalidatePath("/programmes");
  revalidatePath("/");

  // f. typed result
  return { ok: true };
}
