import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { SectorCard } from "@/components/public/sector-card";
import heroImage from "../../../public/hero.png";

// See (public)/programmes/page.tsx — same rationale for the revalidate window.
export const revalidate = 3600;

export default async function HomePage() {
  const [sectors, impactStats] = await Promise.all([
    db.sector.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
    db.impactStat.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  return (
    <>
      <section className="relative overflow-hidden">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover opacity-20"
        />
        {/* Solid overlay, not a translucent one: text contrast must hold
            regardless of what's in the photo (busy, light-background shot),
            so the backdrop is dominated by brand-900 rather than trusting a
            guess about the image's tones. See globals.css contrast table. */}
        <div className="on-brand relative bg-brand-900/90">
          <div className="mx-auto max-w-page px-4 py-20 sm:py-28">
            <h1 className="text-display-lg max-w-content">
              Technology is for everyone — especially YOUth.
            </h1>
            <p className="mt-4 max-w-content text-lead">
              YouthInTech (Zambia Youths in Technology Network) builds
              practical technology skills in young Zambians across eight
              sectors — from agriculture to ICT — so they can build careers,
              businesses, and solutions for their own communities.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/programmes"
                className="rounded-pill bg-white px-5 py-3 font-medium text-brand-900"
              >
                Explore programmes
              </Link>
              <Link
                href="/contact"
                className="rounded-pill border border-white px-5 py-3 font-medium text-white"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Empty state: render nothing rather than an empty stat row — see
          CLAUDE.md §6 "every list renders something sensible when it has
          zero rows," which for a credibility band means not existing. */}
      {impactStats.length > 0 ? (
        <section className="on-brand">
          <div className="mx-auto max-w-page px-4 py-12 sm:py-16">
            <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {impactStats.map((stat) => (
                <div key={stat.id}>
                  <dt className="text-eyebrow uppercase opacity-75">{stat.label}</dt>
                  <dd className="mt-1 text-display-md">
                    {stat.value}
                    {stat.note ? (
                      <span className="ml-2 text-lead opacity-75">{stat.note}</span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-page px-4 py-16">
        <p className="text-eyebrow uppercase text-accent-600">Programmes</p>
        <h2 className="mt-2 text-display-sm">Our eight focus areas</h2>

        {sectors.length === 0 ? (
          <p className="mt-8 rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
            Programme details are being updated. Check back soon.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="mx-auto max-w-page px-4 py-16">
          <div className="max-w-content">
            <p className="text-eyebrow uppercase text-accent-600">What we do</p>
            <h2 className="mt-2 text-display-sm">Skills, not slogans</h2>
            <p className="mt-4 text-ink-700">
              YouthInTech runs hands-on training, mentorship, and project work
              across eight sectors, led by volunteer Frontliners and delivered
              in partnership with universities, employers, and civil society.
              We focus on practical, employable skills over certificates for
              their own sake — the kind of work young Zambians can point to.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 py-16">
        <p className="text-eyebrow uppercase text-accent-600">Get involved</p>
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
      </section>
    </>
  );
}
