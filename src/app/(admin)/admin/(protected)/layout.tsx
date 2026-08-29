import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { SignOutButton } from "./sign-out-button";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/admin/login");
  }

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
          {/* Inquiries hold personal data — EDITOR can't see them (same rule
              as Application, CLAUDE.md §5), so don't even link there. */}
          {user.role === Role.ADMIN ? (
            <Link href="/admin/inquiries">Inquiries</Link>
          ) : null}
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
