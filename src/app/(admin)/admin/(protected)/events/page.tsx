import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { formatDateTime } from "@/lib/format-date";
import { EventArchiveButton } from "./event-archive-button";

const FILTERS = [
  { value: undefined, label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "draft", label: "Draft" },
] as const;

// Admin list shows EVERYTHING by default, past events included — see the
// Event model comment in schema.prisma. Past events are never hidden here
// either; "Past" is a filter an editor can reach for, not the default view,
// and it's about the same startsAt-vs-now comparison the public page uses,
// not a status flag.
export default async function EventsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const now = new Date();

  const where =
    filter === "upcoming"
      ? { startsAt: { gte: now } }
      : filter === "past"
        ? { startsAt: { lt: now } }
        : filter === "draft"
          ? { status: "DRAFT" as const }
          : undefined;

  const [events, user] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { startsAt: filter === "past" ? "desc" : "asc" },
    }),
    getSessionUser(),
  ]);

  const isAdmin = user?.role === Role.ADMIN;

  return (
    <div className="mx-auto max-w-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-display-sm">Events</h1>
        <Link
          href="/admin/events/new"
          className="rounded-card bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          New event
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {FILTERS.map(({ value, label }) => (
          <Link
            key={label}
            href={value ? `/admin/events?filter=${value}` : "/admin/events"}
            className={`rounded-pill border px-3 py-1 ${
              filter === value
                ? "border-brand-700 text-brand-700"
                : "border-border-strong text-ink-600"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <p className="rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
          {filter ? "No events match this filter." : "No events yet. Create one to get started."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => {
            const isPast = event.startsAt < now;
            return (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-(--shadow-card)"
              >
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-medium text-ink-800">
                    {event.title}
                    {isPast ? (
                      <span className="rounded-pill border border-border-strong px-2 py-0.5 text-xs font-medium text-ink-600">
                        Past
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-ink-500">
                    /{event.slug} · {event.status} · {formatDateTime(event.startsAt)} ·{" "}
                    {event.isOnline ? "Online" : (event.venue ?? "No venue set")}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="rounded-card border border-border-strong px-3 py-1 text-sm text-brand-700"
                  >
                    Edit
                  </Link>
                  {isAdmin && event.status !== "ARCHIVED" ? (
                    <EventArchiveButton id={event.id} title={event.title} />
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
