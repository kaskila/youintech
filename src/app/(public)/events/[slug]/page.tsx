import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format-date";

// Same short window and reasoning as (public)/events/page.tsx — the
// upcoming-vs-past determination on this page (which drives whether the
// Register CTA or the recap section renders) is the same startsAt-vs-now
// comparison, so it gets the same staleness bound.
export const revalidate = 120;

// Deduped per-request: generateMetadata and the page component both need
// the same row, and Prisma (unlike fetch()) has no built-in request cache.
const getEvent = cache((slug: string) =>
  db.event.findUnique({
    where: { slug },
    include: { sector: { select: { name: true } } },
  })
);

export async function generateStaticParams() {
  const events = await db.event.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event || event.status !== "PUBLISHED") {
    notFound();
  }

  return {
    title: event.title,
    description: event.summary,
    openGraph: {
      title: event.title,
      description: event.summary,
      siteName: "YouthInTech",
      locale: "en_ZM",
      type: "website",
      ...(event.coverImage ? { images: [{ url: event.coverImage }] } : {}),
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event || event.status !== "PUBLISHED") {
    notFound();
  }

  const isPast = event.startsAt < new Date();
  const whereLabel = event.isOnline ? "Online" : (event.venue ?? "Venue to be announced");
  const canRegister = !isPast && event.registrationUrl;
  const hasRecap = isPast && (event.recapBody || event.attendeeCount != null);

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:py-16">
      <Link href="/events" className="text-sm">
        ← All events
      </Link>

      {/* Not every event has a photo yet (coverImage is admin-editable,
          defaults to null) — fall back to no banner rather than a broken
          or placeholder image. */}
      {event.coverImage ? (
        <div className="relative mt-4 h-56 w-full overflow-hidden rounded-card sm:h-72">
          <Image
            src={event.coverImage}
            alt={event.coverAlt ?? ""}
            fill
            priority
            sizes="(min-width: 768px) 704px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isPast ? (
          <span className="rounded-pill border border-border-strong bg-surface-subtle px-3 py-1 text-xs font-medium text-ink-600">
            Past event
          </span>
        ) : null}
        {event.sector ? (
          <span className="rounded-pill border border-border-strong bg-surface px-3 py-1 text-xs font-medium text-ink-700">
            {event.sector.name}
          </span>
        ) : null}
      </div>

      <h1 className="mt-3 text-display-md">{event.title}</h1>

      <div className="mt-4 flex flex-col gap-1.5 text-ink-700">
        <p className="flex items-center gap-1.5">
          <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700" />
          {formatDateTime(event.startsAt)}
          {event.endsAt ? <> – {formatDateTime(event.endsAt)}</> : null}
        </p>
        <p className="flex items-center gap-1.5">
          <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700" />
          {whereLabel}
        </p>
      </div>

      <p className="mt-4 text-lead text-ink-600">{event.summary}</p>

      <p className="mt-6 whitespace-pre-line text-ink-700">{event.description}</p>

      {canRegister ? (
        <a
          href={event.registrationUrl ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-pill bg-brand-600 px-5 py-3 font-medium text-white"
        >
          Register
        </a>
      ) : null}

      {/* Post-event evidence — the main content for a past event, not a
          footnote. This is what turns a listing into proof (CLAUDE.md §1) —
          see the Event model comment in schema.prisma. */}
      {hasRecap ? (
        <section className="mt-10 rounded-card border border-brand-200 bg-surface-subtle p-6">
          <h2 className="text-display-sm">How it went</h2>
          {event.attendeeCount != null ? (
            <p className="mt-3 flex items-center gap-2 text-lead font-semibold text-brand-800">
              <Users aria-hidden="true" className="h-5 w-5 shrink-0" />
              {event.attendeeCount} attended
            </p>
          ) : null}
          {event.recapBody ? (
            <p className="mt-4 whitespace-pre-line text-ink-700">{event.recapBody}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
