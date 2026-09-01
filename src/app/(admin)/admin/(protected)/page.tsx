import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Role, ContentStatus, InquiryStatus } from "@/generated/prisma/enums";
import { formatDate, formatRelative, formatAge } from "@/lib/format-date";

// The dashboard is a queue of things needing attention, not a scoreboard.
// "8 sectors" tells nobody what to do; "this draft has sat for 3 weeks" does.

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// AuditLog.entityType → the admin route that edits that entity, when there is
// one. User management is a single table page, not per-id.
function auditHref(entityType: string, entityId: string | null): string | null {
  if (!entityId && entityType !== "User") return null;
  switch (entityType) {
    case "Post":
      return `/admin/stories/${entityId}`;
    case "Programme":
      return `/admin/programmes/${entityId}`;
    case "Opportunity":
      return `/admin/opportunities/${entityId}`;
    case "Event":
      return `/admin/events/${entityId}`;
    case "Sector":
      return `/admin/sectors/${entityId}`;
    case "Inquiry":
      return `/admin/inquiries/${entityId}`;
    case "User":
      return "/admin/users";
    default:
      return null;
  }
}

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-card border border-border bg-surface p-5 shadow-card ${className}`}
    >
      <h2 className="text-eyebrow mb-3 uppercase text-ink-500">{title}</h2>
      {children}
    </section>
  );
}

function GoodNews({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-600">{children}</p>;
}

function TypeBadge({ label }: { label: string }) {
  return (
    <span className="shrink-0 rounded-pill border border-border-strong px-2 py-0.5 text-xs font-medium uppercase text-ink-600">
      {label}
    </span>
  );
}

// One tappable row: title links to the edit screen, meta sits underneath.
function AttentionRow({
  href,
  title,
  meta,
  badge,
}: {
  href: string;
  title: string;
  meta: string;
  badge?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-11 flex-col gap-0.5 rounded-md px-2 py-2 -mx-2 hover:bg-surface-subtle"
      >
        <span className="flex items-center gap-2">
          {badge ? <TypeBadge label={badge} /> : null}
          <span className="font-medium text-ink-800">{title}</span>
        </span>
        <span className="text-sm text-ink-500">{meta}</span>
      </Link>
    </li>
  );
}

export default async function AdminDashboardPage() {
  const sessionUser = await getSessionUser();
  const isAdmin = sessionUser?.role === Role.ADMIN;
  const now = new Date();
  const soon = new Date(now.getTime() + SEVEN_DAYS_MS);

  const draftSelect = { id: true, title: true, createdAt: true } as const;

  const [
    draftPosts,
    draftProgrammes,
    draftOpportunities,
    draftEvents,
    closingOpportunities,
    unrecappedEvents,
    myEdits,
    newInquiryCount,
    recentAudit,
  ] = await Promise.all([
    db.post.findMany({ where: { status: ContentStatus.DRAFT }, select: draftSelect }),
    db.programme.findMany({
      where: { contentStatus: ContentStatus.DRAFT },
      select: draftSelect,
    }),
    db.opportunity.findMany({
      where: { contentStatus: ContentStatus.DRAFT },
      select: draftSelect,
    }),
    db.event.findMany({ where: { status: ContentStatus.DRAFT }, select: draftSelect }),
    db.opportunity.findMany({
      where: {
        contentStatus: ContentStatus.PUBLISHED,
        deadline: { gte: now, lte: soon },
      },
      orderBy: { deadline: "asc" },
      select: { id: true, title: true, deadline: true },
    }),
    db.event.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        startsAt: { lt: now },
        OR: [{ recapBody: null }, { recapBody: "" }, { attendeeCount: null }],
      },
      orderBy: { startsAt: "desc" },
      select: { id: true, title: true, startsAt: true, recapBody: true, attendeeCount: true },
    }),
    sessionUser
      ? db.auditLog.findMany({
          where: { actorId: sessionUser.id },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    // Inquiries carry personal data an EDITOR must not see (CLAUDE.md §5) —
    // the query itself is gated, not just the render.
    isAdmin
      ? db.inquiry.count({ where: { status: InquiryStatus.NEW } })
      : Promise.resolve(0),
    isAdmin
      ? db.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { actor: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const drafts = [
    ...draftPosts.map((d) => ({ ...d, kind: "Story", href: `/admin/stories/${d.id}` })),
    ...draftProgrammes.map((d) => ({
      ...d,
      kind: "Programme",
      href: `/admin/programmes/${d.id}`,
    })),
    ...draftOpportunities.map((d) => ({
      ...d,
      kind: "Opportunity",
      href: `/admin/opportunities/${d.id}`,
    })),
    ...draftEvents.map((d) => ({ ...d, kind: "Event", href: `/admin/events/${d.id}` })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return (
    <div className="mx-auto max-w-page">
      <h1 className="text-display-sm mb-6">Dashboard</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Drafts waiting">
          {drafts.length === 0 ? (
            <GoodNews>No drafts waiting — everything is published or archived.</GoodNews>
          ) : (
            <ul className="flex flex-col gap-1">
              {drafts.map((d) => (
                <AttentionRow
                  key={d.href}
                  href={d.href}
                  badge={d.kind}
                  title={d.title}
                  meta={`Draft for ${formatAge(d.createdAt, now)}`}
                />
              ))}
            </ul>
          )}
        </Section>

        <Section title="Closing this week">
          {closingOpportunities.length === 0 ? (
            <GoodNews>Nothing closing this week.</GoodNews>
          ) : (
            <ul className="flex flex-col gap-1">
              {closingOpportunities.map((o) => (
                <AttentionRow
                  key={o.id}
                  href={`/admin/opportunities/${o.id}`}
                  title={o.title}
                  meta={`Auto-expires ${formatRelative(o.deadline, now)} · ${formatDate(o.deadline)}`}
                />
              ))}
            </ul>
          )}
        </Section>

        <Section title="Past events without a write-up">
          {unrecappedEvents.length === 0 ? (
            <GoodNews>Every past event has a write-up.</GoodNews>
          ) : (
            <ul className="flex flex-col gap-1">
              {unrecappedEvents.map((e) => {
                const missing =
                  !e.recapBody && e.attendeeCount === null
                    ? "no recap or attendee count"
                    : !e.recapBody
                      ? "no recap"
                      : "no attendee count";
                return (
                  <AttentionRow
                    key={e.id}
                    href={`/admin/events/${e.id}`}
                    title={e.title}
                    meta={`Ran ${formatRelative(e.startsAt, now)} · ${missing}`}
                  />
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Your recent edits">
          {myEdits.length === 0 ? (
            <GoodNews>Nothing logged yet — your changes will show up here.</GoodNews>
          ) : (
            <ul className="flex flex-col gap-1">
              {myEdits.map((entry) => {
                const href = auditHref(entry.entityType, entry.entityId);
                const label = (
                  <>
                    <span className="font-medium text-ink-800">{entry.action}</span>
                    <span className="text-sm text-ink-500">
                      {entry.entityType} · {formatRelative(entry.createdAt, now)}
                    </span>
                  </>
                );
                return (
                  <li key={entry.id}>
                    {href ? (
                      <Link
                        href={href}
                        className="flex min-h-11 flex-col gap-0.5 rounded-md px-2 py-2 -mx-2 hover:bg-surface-subtle"
                      >
                        {label}
                      </Link>
                    ) : (
                      <span className="flex min-h-11 flex-col justify-center gap-0.5 px-2 py-2">
                        {label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {isAdmin ? (
          <Section title="New inquiries">
            {newInquiryCount === 0 ? (
              <GoodNews>No new inquiries.</GoodNews>
            ) : (
              <Link
                href="/admin/inquiries?status=NEW"
                className="flex min-h-11 items-baseline gap-2 rounded-md px-2 py-2 -mx-2 hover:bg-surface-subtle"
              >
                <span className="text-display-md text-brand-900">{newInquiryCount}</span>
                <span className="text-lead text-ink-600">
                  waiting for a first response →
                </span>
              </Link>
            )}
          </Section>
        ) : null}

        {isAdmin ? (
          <Section title="Recent activity (all staff)" className="lg:col-span-2">
            {recentAudit.length === 0 ? (
              <GoodNews>No activity logged yet.</GoodNews>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {recentAudit.map((entry) => {
                  const href = auditHref(entry.entityType, entry.entityId);
                  const row = (
                    <span className="flex min-h-11 flex-wrap items-center gap-x-2 gap-y-0.5 py-2">
                      <span className="font-medium text-ink-800">
                        {entry.actor?.name ?? "System"}
                      </span>
                      <span className="text-ink-600">{entry.action}</span>
                      <span className="text-sm text-ink-500">
                        {entry.entityType} · {formatRelative(entry.createdAt, now)}
                      </span>
                    </span>
                  );
                  return (
                    <li key={entry.id}>
                      {href ? (
                        <Link href={href} className="block hover:bg-surface-subtle">
                          {row}
                        </Link>
                      ) : (
                        row
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        ) : null}
      </div>
    </div>
  );
}
