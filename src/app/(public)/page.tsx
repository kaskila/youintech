import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { SectorCard } from "@/components/public/sector-card";
import { ProgrammeCard } from "@/components/public/programme-card";
import heroImage from "../../../public/hero.png";

// See (public)/our-sectors/page.tsx — same rationale for the revalidate window.
export const revalidate = 3600;

export default async function HomePage() {
  const [sectors, impactStats, programmes] = await Promise.all([
    db.sector.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
    db.impactStat.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
    // Flagship subset, not the full /programmes list — a home-page teaser,
    // not a duplicate of the programmes index.
    db.programme.findMany({
      where: { isFlagship: true, contentStatus: "PUBLISHED" },
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  return (
    <>
      <section className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col justify-center px-4 py-12 sm:py-16 md:py-20 md:pl-12 md:pr-8 lg:pl-20 lg:pr-12 xl:pl-24">
            <p className="text-eyebrow uppercase text-accent-600">
              Zambia Youth in Technology Network
            </p>
            <h1 className="mt-4 text-display-lg">
              <span className="text-ink-900">Empowering young Zambians through</span>{" "}
              <span className="text-brand-900">technology.</span>
            </h1>
            <p className="mt-6 max-w-content text-lead text-ink-600">
              YouthInTech builds practical technology skills in young Zambians
              across eight sectors — from agriculture to ICT — so they can
              build careers, businesses, and solutions for their own
              communities.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/programmes"
                className="rounded-pill bg-brand-900 px-5 py-3 text-center font-medium text-white"
              >
                Explore our programmes
              </Link>
              <Link
                href="/about"
                className="rounded-pill border border-brand-900 px-5 py-3 text-center font-medium text-brand-900"
              >
                About YouthInTech
              </Link>
            </div>

            {/* Reserved: a credibility line ("N,NNN+ young people trained")
                once Application counts exist to back a real number, and
                consented Frontliner photos exist to show faces. See
                CLAUDE.md §2 — don't ship a claim with no data behind it. */}

            {/* Image beneath the CTAs on small screens — the split layout
                only works once there's room for two columns. */}
            <div className="relative mt-10 h-64 overflow-hidden rounded-card sm:h-80 md:hidden">
              <Image
                src={heroImage}
                alt=""
                fill
                priority
                placeholder="blur"
                sizes="100vw"
                className="object-cover object-bottom"
              />
            </div>
          </div>

          {/* Image bleeds to the viewport's right edge — this column is
              deliberately outside any max-w-page wrapper. */}
          <div className="relative hidden md:block">
            <div className="relative h-full">
              <Image
                src={heroImage}
                alt=""
                fill
                priority
                placeholder="blur"
                sizes="50vw"
                className="object-cover object-bottom"
              />
            </div>

            {/* Sits on the image with clear space beneath it, not glued to
                the section's bottom edge — bottom-16 clears the seam where
                the next section starts. */}
            <div className="absolute bottom-16 left-6 max-w-xs rounded-card bg-surface p-5 shadow-(--shadow-lift)">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-pill bg-brand-900 font-display text-lg font-semibold text-white"
              >
                &ldquo;
              </span>
              <p className="mt-3 font-display text-base font-semibold text-ink-900">
                Technology is for everyone — especially YOUth.
              </p>
              <span aria-hidden="true" className="mt-3 block h-0.5 w-10 bg-accent-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Empty state: render nothing rather than an empty stat row — see
          CLAUDE.md §6 "every list renders something sensible when it has
          zero rows," which for a credibility band means not existing. */}
      {impactStats.length > 0 ? (
        <section className="bg-surface-subtle">
          <div className="mx-auto max-w-page px-4 py-12 sm:py-16 lg:py-20">
            <p className="text-eyebrow uppercase text-accent-600">Impact</p>
            <dl className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {impactStats.map((stat) => (
                <div key={stat.id}>
                  <dt className="text-eyebrow uppercase text-ink-600">{stat.label}</dt>
                  <dd className="mt-1 text-display-md">
                    {stat.value}
                    {stat.note ? (
                      <span className="ml-2 text-lead text-ink-600">{stat.note}</span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-page px-4 py-12 sm:py-16 lg:py-20">
        <p className="text-eyebrow uppercase text-accent-600">Sectors</p>
        <h2 className="mt-2 text-display-sm">Our eight focus areas</h2>

        {sectors.length === 0 ? (
          <p className="mt-8 rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
            Sector details are being updated. Check back soon.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </section>

      <section className="bg-surface-subtle">
        <div className="mx-auto max-w-page px-4 py-12 sm:py-16 lg:py-20">
          <p className="text-eyebrow uppercase text-accent-600">Programmes</p>
          <h2 className="mt-2 text-display-sm">Flagship programmes</h2>
          <p className="mt-4 max-w-content text-ink-700">
            Cross-sector initiatives YouthInTech is building — for
            Frontliners across every sector, not just one. Here&apos;s where
            each one currently stands.
          </p>

          {programmes.length === 0 ? (
            <p className="mt-8 rounded-card border border-border bg-surface p-6 text-ink-600">
              No programmes have been announced yet. Check back soon.
            </p>
          ) : (
            // 3 columns at lg, 2 at md, 1 at 375px. Five cards leaves a gap
            // in the last row at lg — normal, and simpler than contorting
            // the grid or the card shape to avoid it.
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  imageSizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="on-brand">
        <div className="mx-auto max-w-page px-4 py-12 sm:py-16 lg:py-20">
          {/* Not accent-600 here — see globals.css contrast table: accent-600
              only clears AA against light backgrounds. Matches the label
              treatment already used on-brand elsewhere (footer, impact). */}
          <p className="text-eyebrow uppercase opacity-75">Get involved</p>
          <h2 className="mt-2 text-display-sm">Three ways in</h2>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/contact?category=volunteer"
              className="rounded-card border border-border bg-surface p-5 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-lift)"
            >
              <p className="font-display font-semibold text-brand-900">Volunteer</p>
              <p className="mt-2 text-sm text-ink-600">
                Join as a Frontliner and help run training in your sector.
              </p>
            </Link>
            <Link
              href="/contact?category=partner"
              className="rounded-card border border-border bg-surface p-5 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-lift)"
            >
              <p className="font-display font-semibold text-brand-900">Partner with us</p>
              <p className="mt-2 text-sm text-ink-600">
                Universities, employers, and NGOs — let&apos;s work together.
              </p>
            </Link>
            <Link
              href="/contact?category=support"
              className="rounded-card border border-border bg-surface p-5 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-lift)"
            >
              <p className="font-display font-semibold text-brand-900">Support our work</p>
              <p className="mt-2 text-sm text-ink-600">
                Get in touch about funding, in-kind support, or resources.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
