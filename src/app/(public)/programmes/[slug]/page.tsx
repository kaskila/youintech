import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { SectorIcon } from "@/components/public/sector-icon";

// See (public)/programmes/page.tsx — same rationale for the revalidate window.
export const revalidate = 3600;

// Deduped per-request: generateMetadata and the page component both need
// the same row, and Prisma (unlike fetch()) has no built-in request cache.
const getSector = cache((slug: string) =>
  db.sector.findUnique({ where: { slug } })
);

export async function generateStaticParams() {
  const sectors = await db.sector.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return sectors.map((sector) => ({ slug: sector.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = await getSector(slug);

  if (!sector || !sector.isActive) {
    notFound();
  }

  const description =
    sector.tagline ??
    sector.description?.slice(0, 160) ??
    "A YouthInTech focus area — practical technology skills for young Zambians.";

  return {
    title: sector.name,
    description,
    openGraph: {
      title: sector.name,
      description,
      siteName: "YouthInTech",
      locale: "en_ZM",
      type: "website",
    },
  };
}

export default async function SectorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = await getSector(slug);

  if (!sector || !sector.isActive) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:py-16">
      <Link href="/programmes" className="text-sm">
        ← All programmes
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <SectorIcon name={sector.icon} className="h-10 w-10 text-brand-700" />
        <h1 className="text-display-md">{sector.name}</h1>
      </div>

      {sector.tagline ? (
        <p className="mt-4 text-lead text-ink-600">{sector.tagline}</p>
      ) : null}

      {sector.description ? (
        <p className="mt-6 whitespace-pre-line text-ink-700">{sector.description}</p>
      ) : (
        <p className="mt-6 text-ink-600">
          Full details for this programme are coming soon.
        </p>
      )}
    </div>
  );
}
