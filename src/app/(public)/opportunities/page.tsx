import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { OpportunityCard } from "@/components/public/opportunity-card";
import { OpportunityType } from "@/generated/prisma/enums";

// DYNAMIC, not ISR — and not entirely by choice: this page reads
// `searchParams` (the type filter, §3 below), which Next.js treats as a
// per-request input and opts the route out of static/ISR caching no
// matter what `revalidate` is set to (confirmed against the build output —
// `next build` lists this route as `ƒ` with no Revalidate/Expire column,
// unlike the ISR pages elsewhere in (public)/). Given that's the outcome
// either way, it's also the right one for this model specifically: every
// request re-evaluates `deadline >= now()` fresh against the database, so
// an expired listing disappears with zero cache lag — stronger than the
// "same day" bar this was approved on (CLAUDE.md §5), not just barely
// clearing it. The table is small and the query is covered by
// `@@index([contentStatus, deadline])`, so the cost of skipping ISR here
// is negligible next to that guarantee.
const TYPE_OPTIONS = Object.values(OpportunityType);

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Scholarships, fellowships, internships, jobs, grants, and more — open opportunities for young Zambians, posted as they come in.",
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeType = TYPE_OPTIONS.find((value) => value === type);
  const now = new Date();

  const opportunities = await db.opportunity.findMany({
    where: {
      contentStatus: "PUBLISHED",
      // THE auto-expiry rule — see prisma/schema.prisma Opportunity model.
      // An opportunity is never hidden by a status an editor has to
      // remember to flip; it drops off the moment this comparison fails.
      deadline: { gte: now },
      ...(activeType ? { type: activeType } : {}),
    },
    orderBy: { deadline: "asc" },
  });

  return (
    <div className="mx-auto max-w-page px-4 py-12 sm:py-16">
      <p className="text-eyebrow uppercase text-accent-600">Opportunities</p>
      <h1 className="mt-2 text-display-md">Open right now</h1>
      <p className="mt-4 max-w-content text-lead text-ink-600">
        Scholarships, fellowships, internships, jobs, grants, training, and competitions —
        posted as they come in. Listings come down automatically once their deadline passes.
      </p>

      {/* Filter by type via the URL, not client state — a plain link per
          type, no JS required to use it. */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/opportunities"
          className={`rounded-pill border px-3 py-1.5 text-sm font-medium ${
            !activeType ? "border-brand-700 bg-brand-50 text-brand-800" : "border-border-strong text-ink-600"
          }`}
        >
          All
        </Link>
        {TYPE_OPTIONS.map((value) => (
          <Link
            key={value}
            href={`/opportunities?type=${value}`}
            className={`rounded-pill border px-3 py-1.5 text-sm font-medium ${
              activeType === value
                ? "border-brand-700 bg-brand-50 text-brand-800"
                : "border-border-strong text-ink-600"
            }`}
          >
            {value.charAt(0) + value.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {opportunities.length === 0 ? (
        <div className="mt-10 rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
          <p>
            {activeType
              ? "No open opportunities of this type right now — check back soon, or see everything currently open."
              : "No open opportunities right now."}
          </p>
          <p className="mt-2">
            New opportunities are posted regularly as they come in — this list being empty
            means everything here has either closed or not been posted yet, not that we&apos;ve
            stopped looking.{" "}
            <Link href="/contact" className="font-medium underline">
              Know of one we should list? Get in touch.
            </Link>
          </p>
          {activeType ? (
            <Link href="/opportunities" className="mt-3 inline-block font-medium text-brand-700 underline">
              See all open opportunities
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              title={opportunity.title}
              organisation={opportunity.organisation}
              type={opportunity.type}
              location={opportunity.location}
              isRemote={opportunity.isRemote}
              deadline={opportunity.deadline}
              coverImage={opportunity.coverImage}
              coverAlt={opportunity.coverAlt}
              applyUrl={opportunity.applyUrl}
              now={now}
            />
          ))}
        </div>
      )}
    </div>
  );
}
