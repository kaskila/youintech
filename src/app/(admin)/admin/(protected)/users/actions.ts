"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { generateTemporaryPassword, setUserPassword } from "@/lib/password";
import {
  userCreateSchema,
  userIdSchema,
  userRoleChangeSchema,
} from "@/lib/validations/user";
import { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/action-result";

// createUser and resetUserPassword hand back a one-time generated password.
// It is returned to the calling component exactly once, shown behind a
// copy button with a "won't be shown again" warning, and never logged,
// emailed, or persisted in plain text (CLAUDE.md — this is the app's most
// sensitive surface).
export type GeneratedPasswordResult =
  | { ok: true; email: string; password: string }
  | { ok: false; error: string };

// Every action here re-checks requireAdmin() itself — a hidden nav link is
// not a control (CLAUDE.md §7). requireAdmin re-reads role/isActive from the
// DB, so a just-deactivated or just-demoted admin loses access within the
// cookie-cache window, not after it.

export async function createUser(formData: FormData): Promise<GeneratedPasswordResult> {
  const parsed = userCreateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const { name, email, role } = parsed.data;
  const password = generateTemporaryPassword();

  let created;
  try {
    created = await db.user.create({
      data: {
        id: randomUUID(),
        name,
        email,
        role,
        // Consistent with prisma/seed.ts: staff accounts are created
        // verified. requireEmailVerification is not enabled (lib/auth.ts).
        emailVerified: true,
        isActive: true,
        mustChangePassword: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "An account with that email already exists." };
    }
    throw error;
  }

  // Credential row written through Better Auth's own hasher — see
  // lib/password.ts for why this doesn't go through auth.api.
  await setUserPassword(created.id, password);

  await db.auditLog.create({
    data: {
      action: "user.create",
      entityType: "User",
      entityId: created.id,
      actorId: admin.user.id,
      metadata: { role, email },
    },
  });

  revalidatePath("/admin/users");

  return { ok: true, email: created.email, password };
}

export async function deactivateUser(formData: FormData): Promise<ActionResult> {
  const parsed = userIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const { id } = parsed.data;

  // Server-side self-protection — not just a disabled button. An admin who
  // could lock themselves out would need someone else (or SQL) to recover.
  if (id === admin.user.id) {
    return { ok: false, error: "You cannot deactivate your own account." };
  }

  let target;
  try {
    target = await db.user.update({
      where: { id },
      data: { isActive: false },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "User not found." };
    }
    throw error;
  }

  // Existing sessions must stop working immediately. requireStaff/requireAdmin
  // already reject an inactive user on the next mutation, and the (protected)
  // layout re-reads isActive per request — but deleting the session rows
  // closes the cookie-cache gap for read-only pages too, and is the belt to
  // that suspenders.
  await db.session.deleteMany({ where: { userId: id } });

  await db.auditLog.create({
    data: {
      action: "user.deactivate",
      entityType: "User",
      entityId: target.id,
      actorId: admin.user.id,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function reactivateUser(formData: FormData): Promise<ActionResult> {
  const parsed = userIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const { id } = parsed.data;

  let target;
  try {
    target = await db.user.update({
      where: { id },
      data: { isActive: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "User not found." };
    }
    throw error;
  }

  await db.auditLog.create({
    data: {
      action: "user.reactivate",
      entityType: "User",
      entityId: target.id,
      actorId: admin.user.id,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function changeUserRole(formData: FormData): Promise<ActionResult> {
  const parsed = userRoleChangeSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const { id, role } = parsed.data;

  // Same server-side self-protection as deactivateUser: an admin cannot
  // demote themselves to EDITOR (which would strip their own access).
  if (id === admin.user.id) {
    return { ok: false, error: "You cannot change your own role." };
  }

  const before = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (!before) return { ok: false, error: "User not found." };

  if (before.role === role) {
    return { ok: true };
  }

  const target = await db.user.update({ where: { id }, data: { role } });

  await db.auditLog.create({
    data: {
      action: "user.role_change",
      entityType: "User",
      entityId: target.id,
      actorId: admin.user.id,
      metadata: { from: before.role, to: role },
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resetUserPassword(
  formData: FormData
): Promise<GeneratedPasswordResult> {
  const parsed = userIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const admin = await requireAdmin();
  if (!admin.ok) return admin;

  const { id } = parsed.data;

  const target = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  });
  if (!target) return { ok: false, error: "User not found." };

  const password = generateTemporaryPassword();
  await setUserPassword(target.id, password);
  await db.user.update({ where: { id: target.id }, data: { mustChangePassword: true } });

  // Force the temporary password to actually be used: drop any live sessions
  // so the next request signs in fresh and hits the forced-change flow.
  await db.session.deleteMany({ where: { userId: target.id } });

  await db.auditLog.create({
    data: {
      action: "user.password_reset",
      entityType: "User",
      entityId: target.id,
      actorId: admin.user.id,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true, email: target.email, password };
}
