import Image from "next/image";
import Link from "next/link";
import { DynamicIcon } from "./dynamic-icon";
import { ProgrammeStatusBadge } from "./programme-status-badge";
import type { ProgrammeStatus } from "@/generated/prisma/enums";

// One shape, used everywhere this renders — no "featured" variant. A grid
// of identically-proportioned cards reads as a set; a lead card spanning
// two columns reads as three different layouts stitched together.
export function ProgrammeCard({
  slug,
  title,
  summary,
  icon,
  status,
  coverImage,
  coverAlt,
  imageSizes,
}: {
  slug: string;
  title: string;
  summary: string;
  icon: string;
  status: ProgrammeStatus;
  coverImage?: string | null;
  coverAlt?: string | null;
  // How wide the image actually renders in the caller's grid — get it
  // wrong and next/image fetches a larger source than gets shown.
  imageSizes?: string;
}) {
  return (
    <Link
      href={`/programmes/${slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-(--shadow-card) transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-(--shadow-lift)"
    >
      {/* Fixed 16:9 for every card — source photos come in whatever aspect
          ratio they were shot at; forcing the box (not just object-cover on
          an already-16:9 image) is what keeps the grid looking deliberate
          instead of accidental. Not every programme has coverImage set yet
          (admin-editable, defaults to null), so the icon fallback fills the
          same box rather than shrinking the card. */}
      <div className="relative aspect-video w-full shrink-0 bg-brand-100">
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
            <DynamicIcon name={icon} className="h-10 w-10 text-brand-700" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display font-semibold text-brand-900 group-hover:underline">{title}</p>
          <ProgrammeStatusBadge status={status} />
        </div>
        <p className="text-sm text-ink-600">{summary}</p>
        <span className="mt-auto pt-1 text-sm font-medium text-brand-700">Learn more →</span>
      </div>
    </Link>
  );
}
