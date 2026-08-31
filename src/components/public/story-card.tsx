import Image from "next/image";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { formatDate } from "@/lib/format-date";

// One shape, whole card is a single link — a story has no secondary CTA, so
// there's nothing to nest, unlike EventCard. Same construction as
// ProgrammeCard.
export function StoryCard({
  slug,
  title,
  excerpt,
  coverImage,
  coverAlt,
  sectorName,
  publishedAt,
  authorName,
  imageSizes,
}: {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  coverAlt?: string | null;
  sectorName?: string | null;
  publishedAt: Date;
  authorName?: string | null;
  imageSizes?: string;
}) {
  return (
    <Link
      href={`/stories/${slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-(--shadow-card) transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-(--shadow-lift)"
    >
      {/* Fixed 16:9 for every card; icon fallback fills the same box when a
          story has no cover image yet (admin-editable, defaults to null). */}
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
            <Newspaper aria-hidden="true" className="h-10 w-10 text-brand-700" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {sectorName ? (
          <span className="inline-flex w-fit items-center rounded-pill border border-border-strong bg-surface px-3 py-1 text-xs font-medium text-ink-700">
            {sectorName}
          </span>
        ) : null}

        <p className="font-display font-semibold text-brand-900 group-hover:underline">{title}</p>

        <p className="text-sm text-ink-600">{excerpt}</p>

        <p className="mt-auto pt-1 text-sm text-ink-500">
          {formatDate(publishedAt)}
          {authorName ? ` · ${authorName}` : ""}
        </p>
      </div>
    </Link>
  );
}
