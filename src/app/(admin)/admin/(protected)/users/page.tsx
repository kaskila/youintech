import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { formatDateTime } from "@/lib/format-date";
import { UsersTable, type UserRow } from "./users-table";

// ADMIN only. The nav link is hidden for EDITOR, but that's cosmetic — this
// is the real gate on the page, and every action re-checks requireAdmin
// server-side (CLAUDE.md §7). Fresh DB read of the role rather than the
// cached session cookie, since this is the most sensitive surface in the app.
export default async function UsersAdminPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/admin/login");

  const me = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true },
  });
  if (!me || me.role !== Role.ADMIN) {
    redirect("/admin");
  }

  const users = await db.user.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      // "last sign-in" ≈ the most recent session's createdAt. Better Auth
      // doesn't keep a dedicated lastLoginAt; a session row is created on
      // each sign-in. Deactivating a user deletes their sessions, so this
      // reads "never" for a deactivated account — acceptable, the
      // Deactivated badge already carries that signal.
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const rows: UserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastSignIn: user.sessions[0] ? formatDateTime(user.sessions[0].createdAt) : null,
  }));

  return (
    <div className="mx-auto max-w-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-display-sm">Users</h1>
        <Link
          href="/admin/users/new"
          className="rounded-card bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          New user
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
          No users yet.
        </p>
      ) : (
        <UsersTable users={rows} currentUserId={me.id} />
      )}
    </div>
  );
}
