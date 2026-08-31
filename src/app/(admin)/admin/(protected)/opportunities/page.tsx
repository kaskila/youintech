import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { formatDateTime } from "@/lib/format-date";
import { OpportunityArchiveButton } from "./opportunity-archive-button";

// Admin list shows EVERYTHING, expired included — see CLAUDE.md §5. Only
// the PUBLIC query filters by deadline; hiding rows here would make it
// impossible to tell whether a listing is gone because it expired or
// because it was never published.
export default async function OpportunitiesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;
  const showExpiredOnly = expired === "only";
  const now = new Date();

  const [opportunities, user] = await Promise.all([
    db.opportunity.findMany({
      where: showExpiredOnly ? { deadline: { lt: now } } : undefined,
      orderBy: { deadline: "asc" },
    }),
    getSessionUser(),
  ]);

  const isAdmin = user?.role === Role.ADMIN;

  return (
    <div className="mx-auto max-w-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-display-sm">Opportunities</h1>
        <Link
          href="/admin/opportunities/new"
          className="rounded-card bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          New opportunity
        </Link>
      </div>

      <div className="mb-4 flex gap-2 text-sm">
        <Link
          href="/admin/opportunities"
          className={`rounded-pill border px-3 py-1 ${
            showExpiredOnly ? "border-border-strong text-ink-600" : "border-brand-700 text-brand-700"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/opportunities?expired=only"
          className={`rounded-pill border px-3 py-1 ${
            showExpiredOnly ? "border-brand-700 text-brand-700" : "border-border-strong text-ink-600"
          }`}
        >
          Expired only
        </Link>
      </div>

      {opportunities.length === 0 ? (
        <p className="rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
          {showExpiredOnly ? "No expired opportunities." : "No opportunities yet. Create one to get started."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {opportunities.map((opportunity) => {
            const isExpired = opportunity.deadline < now;
            return (
              <li
                key={opportunity.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-(--shadow-card)"
              >
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-medium text-ink-800">
                    {opportunity.title}
                    {isExpired ? (
                      <span className="rounded-pill border border-danger px-2 py-0.5 text-xs font-medium text-danger">
                        Expired
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-ink-500">
                    /{opportunity.slug} · {opportunity.type} · {opportunity.contentStatus} · deadline{" "}
                    {formatDateTime(opportunity.deadline)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/opportunities/${opportunity.id}`}
                    className="rounded-card border border-border-strong px-3 py-1 text-sm text-brand-700"
                  >
                    Edit
                  </Link>
                  {isAdmin && opportunity.contentStatus !== "ARCHIVED" ? (
                    <OpportunityArchiveButton id={opportunity.id} title={opportunity.title} />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
