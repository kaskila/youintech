import type { Metadata } from "next";
import { db } from "@/lib/db";
import { EventCard } from "@/components/public/event-card";

// SHORT ISR, not the 3600s used on programmes/opportunities-detail-style
// pages, and not fully dynamic either. This page's two sections are a pure
// time comparison (startsAt >= now vs < now) against otherwise-static
// content — a long revalidate window would leave a just-finished event
// sitting under "Upcoming" (or a just-started one under "Past") for up to
// that whole window, which is exactly the failure mode this slice's task
// called out. Going fully dynamic (like /opportunities, which reads
// searchParams anyway) would fix that completely, but events don't churn
// anywhere near as often as opportunity deadlines do — a bounded few
// minutes of staleness on which SECTION an event appears in is a cosmetic
// gap, not a credibility one (past events are never hidden — see the Event
// model comment in schema.prisma), so a short window is the better
// trade-off than paying a full per-request DB read on every visit.
export const revalidate = 120;

export const metadata: Metadata = {
  title: "Events",
  description:
    "YouthInTech events — upcoming workshops, meetups, and conferences, plus a growing record of everything we've already run.",
};

export default async function EventsPage() {
  const now = new Date();

  const [upcoming, past] = await Promise.all([
    db.event.findMany({
      where: { status: "PUBLISHED", startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include: { sector: { select: { name: true } } },
    }),
    // THE guarantee this slice depends on: no deadline-style filter here.
    // Every published event that has already started stays listed forever
    // — see the Event model comment in schema.prisma. Opposite of
    // Opportunity's auto-expiry on purpose.
    db.event.findMany({
      where: { status: "PUBLISHED", startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
      include: { sector: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-page px-4 py-12 sm:py-16">
      <p className="text-eyebrow uppercase text-accent-600">Events</p>
      <h1 className="mt-2 text-display-md">Events</h1>
      <p className="mt-4 max-w-content text-lead text-ink-600">
        Workshops, meetups, and conferences we run or co-host — and a growing record of
        everything we already have.
      </p>

      <section className="mt-10">
        <h2 className="text-display-sm">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="mt-4 rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
            Nothing scheduled right now — check back soon, or see what we&apos;ve already run
            below.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                variant="upcoming"
                slug={event.slug}
                title={event.title}
                summary={event.summary}
                coverImage={event.coverImage}
                coverAlt={event.coverAlt}
                startsAt={event.startsAt}
                venue={event.venue}
                isOnline={event.isOnline}
                sectorName={event.sector?.name}
                registrationUrl={event.registrationUrl}
                imageSizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-display-sm">Past</h2>
        {past.length === 0 ? (
          <p className="mt-4 rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
            We haven&apos;t run an event yet — check back after the first one.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard
                key={event.id}
                variant="past"
                slug={event.slug}
                title={event.title}
                summary={event.summary}
                coverImage={event.coverImage}
                coverAlt={event.coverAlt}
                startsAt={event.startsAt}
                venue={event.venue}
                isOnline={event.isOnline}
                sectorName={event.sector?.name}
                attendeeCount={event.attendeeCount}
                imageSizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
