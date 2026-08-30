import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { formatDateTime } from "@/lib/format-date";

// One card, two variants — the bulk of the markup (image, title, date,
// venue, summary, sector badge) is identical for upcoming and past events;
// only the footer CTA differs (CLAUDE.md task: "Register" for upcoming vs.
// attendee count + a link to the detail page for past). The image/title are
// Links to the detail page in both variants — an <a> (Register) can't nest
// inside a Next.js Link's own <a>, so the card is not one big link the way
// ProgrammeCard is; see the footer below.
export function EventCard({
  slug,
  title,
  summary,
  coverImage,
  coverAlt,
  startsAt,
  venue,
  isOnline,
  sectorName,
  imageSizes,
  variant,
  registrationUrl,
  attendeeCount,
}: {
  slug: string;
  title: string;
  summary: string;
  coverImage?: string | null;
  coverAlt?: string | null;
  startsAt: Date;
  venue: string | null;
  isOnline: boolean;
  sectorName?: string | null;
  imageSizes?: string;
  variant: "upcoming" | "past";
  registrationUrl?: string | null;
  attendeeCount?: number | null;
}) {
  const whereLabel = isOnline ? "Online" : (venue ?? "Venue to be announced");

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-(--shadow-card)">
      <Link href={`/events/${slug}`} className="relative block aspect-video w-full shrink-0 bg-brand-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={coverAlt ?? ""}
            fill
            sizes={imageSizes ?? "100vw"}
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <CalendarDays aria-hidden="true" className="h-10 w-10 text-brand-700" />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {sectorName ? (
          <span className="inline-flex w-fit items-center rounded-pill border border-border-strong bg-surface px-3 py-1 text-xs font-medium text-ink-700">
            {sectorName}
          </span>
        ) : null}

        <Link href={`/events/${slug}`} className="font-display font-semibold text-brand-900 hover:underline">
          {title}
        </Link>

        <p className="text-sm text-ink-700">{formatDateTime(startsAt)}</p>

        <p className="flex items-center gap-1.5 text-sm text-ink-600">
          <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700" />
          {whereLabel}
        </p>

        <p className="text-sm text-ink-600">{summary}</p>

        {variant === "past" && attendeeCount != null ? (
          <p className="text-sm font-medium text-brand-800">{attendeeCount} attended</p>
        ) : null}

        <div className="mt-auto pt-1">
          {variant === "upcoming" ? (
            registrationUrl ? (
              <a
                href={registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-pill bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white"
              >
                Register
              </a>
            ) : null
          ) : (
            <Link href={`/events/${slug}`} className="text-sm font-medium text-brand-700 underline">
              View recap →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
