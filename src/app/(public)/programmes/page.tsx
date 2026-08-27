import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProgrammeCard } from "@/components/public/programme-card";

// Programme edits are rare and the admin action revalidates this path on
// publish (see (admin)/admin/(protected)/programmes/actions.ts) — this is
// just a safety net between edits. See CLAUDE.md §4.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Programmes",
  description:
    "Flagship, cross-sector initiatives YouthInTech is building — announced, in motion, or on the way.",
};

export default async function ProgrammesPage() {
  const programmes = await db.programme.findMany({
    where: { contentStatus: "PUBLISHED" },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-page px-4 py-12 sm:py-16">
      <p className="text-eyebrow uppercase text-accent-600">Programmes</p>
      <h1 className="mt-2 text-display-md">Flagship programmes</h1>
      <p className="mt-4 max-w-content text-lead text-ink-600">
        Cross-sector initiatives YouthInTech is building — for Frontliners
        across every sector, not just one.
      </p>

      {programmes.length === 0 ? (
        <p className="mt-10 rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
          No programmes have been announced yet. Check back soon.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programmes.map((programme) => (
            <ProgrammeCard
              key={programme.id}
              slug={programme.slug}
              title={programme.title}
              summary={programme.summary}
              icon={programme.icon}
              status={programme.status}
              coverImage={programme.coverImage}
              coverAlt={programme.coverAlt}
              imageSizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>
      )}
    </div>
  );
}
