import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { ProgrammeStatusBadge } from "@/components/public/programme-status-badge";
import { ProgrammeArchiveButton } from "./programme-archive-button";

export default async function ProgrammesAdminPage() {
  const [programmes, user] = await Promise.all([
    db.programme.findMany({ orderBy: { displayOrder: "asc" } }),
    getSessionUser(),
  ]);

  const isAdmin = user?.role === Role.ADMIN;

  return (
    <div className="mx-auto max-w-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-display-sm">Programmes</h1>
        <Link
          href="/admin/programmes/new"
          className="rounded-pill bg-brand-900 px-4 py-2 text-sm font-medium text-white"
        >
          New programme
        </Link>
      </div>

      {programmes.length === 0 ? (
        <p className="rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
          No programmes yet. Create one to get started.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {programmes.map((programme) => (
            <li
              key={programme.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-(--shadow-card)"
            >
              <div>
                <p className="font-medium text-ink-800">
                  {programme.displayOrder}. {programme.title}
                </p>
                <p className="text-sm text-ink-500">
                  /{programme.slug} · {programme.contentStatus}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <ProgrammeStatusBadge status={programme.status} />
                <Link
                  href={`/admin/programmes/${programme.id}`}
                  className="rounded-pill border border-border-strong px-3 py-1 text-sm text-brand-700"
                >
                  Edit
                </Link>
                {isAdmin && programme.contentStatus !== "ARCHIVED" ? (
                  <ProgrammeArchiveButton id={programme.id} title={programme.title} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
