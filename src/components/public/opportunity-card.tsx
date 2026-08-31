import Image from "next/image";
import { AlarmClock, MapPin } from "lucide-react";
import { OpportunityTypeBadge, TYPE_META } from "./opportunity-type-badge";
import { formatDate } from "@/lib/format-date";
import type { OpportunityType } from "@/generated/prisma/enums";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
// Flagged, not just colour-coded — see CLAUDE.md and the task this was
// built for. The "Closing soon" pill below carries an icon and text, not a
// colour swap alone, so it doesn't rely on colour perception to register.
const CLOSING_SOON_DAYS = 7;

export function OpportunityCard({
  title,
  organisation,
  type,
  location,
  isRemote,
  deadline,
  coverImage,
  coverAlt,
  applyUrl,
  now,
}: {
  title: string;
  organisation: string;
  type: OpportunityType;
  location: string | null;
  isRemote: boolean;
  deadline: Date;
  coverImage?: string | null;
  coverAlt?: string | null;
  applyUrl: string;
  // Passed down rather than read via Date.now() in render — a component
  // calling an impure "current time" function during render is exactly
  // the kind of thing the React Compiler's purity rule (CLAUDE.md §3,
  // reactCompiler: true) exists to catch. The caller already computes
  // "now" once, to build the deadline >= now query filter — this reuses
  // that same value instead of a second, potentially-inconsistent read.
  now: Date;
}) {
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / MS_PER_DAY);
  const isClosingSoon = daysRemaining <= CLOSING_SOON_DAYS;
  const FallbackIcon = TYPE_META[type].icon;
  const whereLabel = isRemote ? "Remote" : (location ?? "Location to be announced");

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-(--shadow-card)">
      {/* Same fixed-16:9-with-icon-fallback shape as ProgrammeCard — not
          every opportunity has a cover image (coverImage is optional). */}
      <div className="relative aspect-video w-full shrink-0 bg-brand-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={coverAlt ?? ""}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <FallbackIcon aria-hidden="true" className="h-10 w-10 text-brand-700" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <OpportunityTypeBadge type={type} />
          {isClosingSoon ? (
            <span className="inline-flex items-center gap-1 rounded-pill border border-accent-700 bg-accent-100 px-3 py-1 text-xs font-medium text-accent-700">
              <AlarmClock aria-hidden="true" className="h-3.5 w-3.5" />
              Closing soon
            </span>
          ) : null}
        </div>

        <p className="font-display font-semibold text-brand-900">{title}</p>
        <p className="text-sm text-ink-600">{organisation}</p>

        <p className="flex items-center gap-1.5 text-sm text-ink-600">
          <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-700" />
          {whereLabel}
        </p>

        <p className="text-sm text-ink-700">
          Deadline: {formatDate(deadline)}{" "}
          <span className="text-ink-500">
            ({daysRemaining <= 0 ? "today" : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`})
          </span>
        </p>

        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-block rounded-card bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white"
        >
          View opportunity
        </a>
      </div>
    </div>
  );
}
