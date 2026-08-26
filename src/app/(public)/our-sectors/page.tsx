import type { Metadata } from "next";
import { db } from "@/lib/db";
import { SectorCard } from "@/components/public/sector-card";

// Sector edits are rare and the admin action revalidates this path on
// publish (see (admin)/admin/(protected)/sectors/actions.ts) — this is just
// a safety net between edits. See CLAUDE.md §4.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Our Sectors",
  description:
    "The eight sectors YouthInTech builds skills in — from agriculture to ICT and computer science.",
};

export default async function OurSectorsPage() {
  const sectors = await db.sector.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-page px-4 py-12 sm:py-16">
      <p className="text-eyebrow uppercase text-accent-600">Sectors</p>
      <h1 className="mt-2 text-display-md">Where Frontliners build skills</h1>
      <p className="mt-4 max-w-content text-lead text-ink-600">
        Eight sectors, one mission: real, practical technology skills for
        young Zambians.
      </p>

      {sectors.length === 0 ? (
        <p className="mt-10 rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
          Sector details are being updated. Check back soon.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sectors.map((sector) => (
            <SectorCard
              key={sector.id}
              slug={sector.slug}
              name={sector.name}
              tagline={sector.tagline}
              icon={sector.icon}
            />
          ))}
        </div>
      )}
    </div>
  );
}
