import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { DynamicIcon } from "@/components/public/dynamic-icon";
import { ProgrammeStatusBadge } from "@/components/public/programme-status-badge";
import { formatDate } from "@/lib/format-date";

// See (public)/programmes/page.tsx — same rationale for the revalidate window.
export const revalidate = 3600;

// Deduped per-request: generateMetadata and the page component both need
// the same row, and Prisma (unlike fetch()) has no built-in request cache.
const getProgramme = cache((slug: string) =>
  db.programme.findUnique({ where: { slug } })
);

export async function generateStaticParams() {
  const programmes = await db.programme.findMany({
    where: { contentStatus: "PUBLISHED" },
    select: { slug: true },
  });
  return programmes.map((programme) => ({ slug: programme.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const programme = await getProgramme(slug);

  if (!programme || programme.contentStatus !== "PUBLISHED") {
    notFound();
  }

  return {
    title: programme.title,
    description: programme.summary,
    openGraph: {
      title: programme.title,
      description: programme.summary,
      siteName: "YouthInTech",
      locale: "en_ZM",
      type: "website",
    },
  };
}

export default async function ProgrammeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const programme = await getProgramme(slug);

  if (!programme || programme.contentStatus !== "PUBLISHED") {
    notFound();
  }

  const canApply = programme.applicationsOpen && programme.applicationUrl;

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:py-16">
      <Link href="/programmes" className="text-sm">
        ← All programmes
      </Link>

      {/* Not every programme has a photo yet (coverImage is admin-editable,
          defaults to null) — fall back to no banner rather than a broken
          or placeholder image. */}
      {programme.coverImage ? (
        <div className="relative mt-4 h-56 w-full overflow-hidden rounded-card sm:h-72">
          <Image
            src={programme.coverImage}
            alt={programme.coverAlt ?? ""}
            fill
            priority
            sizes="(min-width: 768px) 704px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-3">
        <DynamicIcon name={programme.icon} className="h-10 w-10 text-brand-700" />
        <h1 className="text-display-md">{programme.title}</h1>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ProgrammeStatusBadge status={programme.status} />
        {programme.targetDate ? (
          <span className="text-sm text-ink-600">{formatDate(programme.targetDate)}</span>
        ) : null}
      </div>

      <p className="mt-4 text-lead text-ink-600">{programme.summary}</p>

      {programme.description ? (
        <p className="mt-6 whitespace-pre-line text-ink-700">{programme.description}</p>
      ) : (
        <p className="mt-6 text-ink-600">Full details for this programme are coming soon.</p>
      )}

      {canApply ? (
        <a
          href={programme.applicationUrl ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-pill bg-brand-600 px-5 py-3 font-medium text-white"
        >
          Apply
        </a>
      ) : null}
    </div>
  );
}
