import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { SignOutButton } from "./sign-out-button";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/admin/login");
  }

  // Fresh read of role / isActive / mustChangePassword, NOT the session
  // cookie. The cookie is cache-backed for up to 60s (auth.ts), so a
  // just-deactivated or just-demoted user would otherwise keep rendering
  // admin pages for up to a minute — Server Actions already re-read from the
  // DB (require-staff.ts), and this brings read-only pages in line.
  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, email: true, role: true, isActive: true, mustChangePassword: true },
  });

  if (!user || !user.isActive) {
    redirect("/admin/login");
  }

  // Forced password change. This layout does NOT wrap /admin/change-password
  // (that route is a sibling of this route group, not a child), so this
  // redirect can never point at the page it targets — no loop. See
  // change-password/page.tsx for the full reasoning.
  if (user.mustChangePassword) {
    redirect("/admin/change-password");
  }

  const isAdmin = user.role === Role.ADMIN;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="on-brand flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="font-semibold">
            Dashboard
          </Link>
          <Link href="/admin/sectors">Sectors</Link>
          <Link href="/admin/programmes">Programmes</Link>
          <Link href="/admin/opportunities">Opportunities</Link>
          <Link href="/admin/events">Events</Link>
          <Link href="/admin/stories">Stories</Link>
          {/* Inquiries hold personal data — EDITOR can't see them (same rule
              as Application, CLAUDE.md §5), so don't even link there. */}
          {isAdmin ? <Link href="/admin/inquiries">Inquiries</Link> : null}
          {/* User management is ADMIN-only — the route and every action
              enforce it too (CLAUDE.md §7); this just hides the link. */}
          {isAdmin ? <Link href="/admin/users">Users</Link> : null}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {user.name} <span className="opacity-75">· {user.role}</span>
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
