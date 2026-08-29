import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import aboutHeroImage from "../../../../public/about/hero_about.jpg";

const description =
  "YouthInTech is a national registered NGO founded in 2025, headquartered at the University of Zambia in Lusaka, equipping young Zambians across every sector with digital skills, mentorship, and innovation opportunities.";

export const metadata: Metadata = {
  title: "About",
  description,
  openGraph: {
    title: "About YouthInTech",
    description,
  },
};

const CORE_VALUES = [
  {
    number: "01",
    title: "Inclusivity",
    description:
      "Technology must reach every young Zambian, regardless of background, field, or location.",
  },
  {
    number: "02",
    title: "Integrity",
    description: "Honesty and transparency in all dealings with members, partners, and funders.",
  },
  {
    number: "03",
    title: "Innovation",
    description: "Curiosity, experimentation, and creative problem-solving as a way of life.",
  },
  {
    number: "04",
    title: "Accountability",
    description:
      "All officers and partners are accountable for conduct and stewardship of resources.",
  },
  {
    number: "05",
    title: "Collaboration",
    description:
      "Cross-sector, cross-discipline partnerships are how Zambia's hardest problems get solved.",
  },
  {
    number: "06",
    title: "Youth Agency",
    description: "Young people are the architects of solutions, not passive recipients of programmes.",
  },
] as const;

const PILLARS = [
  {
    title: "Skills",
    description:
      "Practical, applicable digital skills not theory, taught in multidisciplinary cohorts, with every participant completing a real project.",
  },
  {
    title: "Community",
    description:
      "A national community through university chapters, digital networks, events, and content, where members support and inspire one another.",
  },
  {
    title: "Innovation",
    description:
      "Structured pathways, the Builders Program, Innovation Challenge, and Mentorship Network, turn skills and community into solutions.",
  },
] as const;

// Matches prisma/seed.ts SECTORS exactly — this page is static (no DB call,
// see CLAUDE.md §2), so the eight permanent sectors are hardcoded here the
// same way CORE_VALUES/PILLARS above are.
const SECTORS = [
  { slug: "agriculture", name: "Agriculture" },
  { slug: "healthcare", name: "Healthcare" },
  { slug: "education", name: "Education" },
  { slug: "business-finance", name: "Business & Finance" },
  { slug: "law-governance", name: "Law & Governance" },
  { slug: "engineering-environment", name: "Engineering & Environment" },
  { slug: "creative-industries", name: "Creative Industries" },
  { slug: "ict-computer-science", name: "ICT & Computer Science" },
] as const;

const GOVERNANCE_FACTS = [
  { label: "Registration", value: "Zambia's NGO Act No. 16 of 2009" },
  { label: "Constitution", value: "21 articles" },
  { label: "Governance policies", value: "22 policies" },
  { label: "Oversight", value: "A formal Board" },
] as const;

export default function AboutPage() {
  return (
    <>
      {/* 1. Hero — two columns at lg (not md, unlike the homepage hero):
          text left, photo right. display-md, not display-lg: this is the
          interior-page-header size used on /our-sectors and /programmes.
          display-lg is reserved below for the Insight, the one place on
          this page that should read bigger than any page header on the
          site. */}
      <section className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col justify-center px-4 py-12 sm:py-16 lg:py-20 lg:pl-12 lg:pr-8 xl:pl-20">
            <p className="text-eyebrow uppercase text-accent-600">About Us</p>
            <h1 className="mt-2 text-display-md">
              Technology the Engine of Innovation.
            </h1>
            <p className="mt-4 max-w-content text-lead text-ink-600">
              YouthInTech is a national registered NGO founded in 2025,
              headquartered at the University of Zambia in Lusaka.
              We&apos;re building a national platform that equips young
              Zambians across every sector with digital skills, mentorship,
              and innovation opportunities.
            </p>
            <div className="mt-8">
              <Link
                href="/our-sectors"
                className="inline-block rounded-pill bg-brand-600 px-5 py-3 text-center font-medium text-white"
              >
                Explore our sectors
              </Link>
            </div>

            {/* Image beneath the text below lg — the two-column split only
                works once there's room for it. */}
            <div className="relative mt-10 h-64 overflow-hidden rounded-card sm:h-80 lg:hidden">
              <Image
                src={aboutHeroImage}
                alt="Two young men in white YouthInTech-branded T-shirts smile while holding up a tablet and a laptop carrying a YouthInTech sticker."
                fill
                priority
                placeholder="blur"
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Image bleeds to the viewport's right edge at lg, outside
              max-w-page — same pattern as the homepage hero. */}
          <div className="relative hidden lg:block">
            <Image
              src={aboutHeroImage}
              alt="Two young men in white YouthInTech-branded T-shirts smile while holding up a tablet and a laptop carrying a YouthInTech sticker."
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2. The Insight — visual peak #1. Tinted surface, no illustration,
          the biggest type on the page. Measure capped to ~20ch and
          centred so it breaks to ~4 lines instead of a 6-line wall.
          Section padding matches the standard rhythm used everywhere
          else on the page (and on the homepage) — the earlier oversized
          py-32 was what made this section read as its own full screen. */}
      <section className="bg-surface-subtle">
        <div className="mx-auto max-w-page px-4 py-12 text-center sm:py-16 lg:py-20">
          <blockquote>
            {/* max-w-5xl (1024px), not a literal 20ch: at display-lg's
                60px desktop size this exact sentence wraps to 4 lines
                right around 1024–1152px — narrower (e.g. max-w-sm) means
                MORE lines, not fewer, since less width per line means
                more wraps. Measured empirically at 1280px viewport. */}
            <h2 className="mx-auto max-w-5xl text-display-lg">
              We don&apos;t train people to become technology professionals,
              we train people to use technology as professionals in
              their own field.
            </h2>
          </blockquote>
          <p className="mx-auto mt-6 max-w-content text-lead text-ink-600">
            The best innovators are the people who face the actual problem.
          </p>
        </div>
      </section>

      {/* 3. Vision & Mission — plain surface, recedes after the Insight. */}
      <section className="mx-auto max-w-page px-4 py-12 sm:py-16 lg:py-20">
        <p className="text-eyebrow uppercase text-accent-600">Vision &amp; Mission</p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-6 sm:p-8">
            <h3 className="font-display font-semibold text-brand-900">Vision</h3>
            <p className="mt-3 text-lead text-ink-700">
              A Zambia where every young person, in every sector and
              community, is equipped to harness technology for growth,
              problem-solving, and national development.
            </p>
          </div>
          <div className="rounded-card border border-border bg-surface p-6 sm:p-8">
            <h3 className="font-display font-semibold text-brand-900">Mission</h3>
            <p className="mt-3 text-lead text-ink-700">
              To build a national platform equipping young Zambians across
              all sectors with digital skills, mentorship, and innovation
              opportunities to solve real problems.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Core Values — plain surface, restrained: numbering, not icons. */}
      <section className="mx-auto max-w-page px-4 py-12 sm:py-16 lg:py-20">
        <p className="text-eyebrow uppercase text-accent-600">Core Values</p>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {CORE_VALUES.map((value) => (
            <div
              key={value.number}
              className="rounded-card border border-border bg-surface p-5"
            >
              <span aria-hidden="true" className="font-display text-2xl font-semibold text-brand-300">
                {value.number}
              </span>
              <h3 className="mt-2 font-display font-semibold text-brand-900">{value.title}</h3>
              <p className="mt-1 text-sm text-ink-600">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Three Pillars — visual peak #2, inverted brand band. */}
      <section className="on-brand">
        <div className="mx-auto max-w-page px-4 py-12 sm:py-16 lg:py-20">
          <h2 className="text-display-sm">Three pillars</h2>
          <span aria-hidden="true" className="mt-4 block h-0.5 w-10 bg-accent-500" />

          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar.title}>
                <h3 className="font-display font-semibold">{pillar.title}</h3>
                <p className="mt-2 text-sm text-brand-100">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Sectors transition — two columns at lg: heading/text left, the
          eight sector names as a plain list right. A list, not cards —
          /our-sectors already owns the icon grid; this must not repeat it. */}
      <section className="mx-auto max-w-page px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-eyebrow uppercase text-accent-600">Sectors</p>
            <h2 className="mt-2 text-display-sm">Eight sectors, one approach</h2>
            <p className="mt-4 max-w-content text-lead text-ink-600">
              YouthInTech applies technology across eight sectors — because
              every field needs people who can put technology to work on
              its problems, not just the ICT sector.
            </p>
            <Link
              href="/our-sectors"
              className="mt-6 inline-block font-medium text-brand-700 underline"
            >
              See all eight sectors
            </Link>
          </div>
          <ul className="border-t border-border">
            {SECTORS.map((sector) => (
              <li key={sector.slug} className="border-b border-border">
                <Link
                  href={`/our-sectors/${sector.slug}`}
                  className="flex min-h-11 items-center font-display font-medium text-brand-900 hover:underline"
                >
                  {sector.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. Governance & Registration — the credibility section, same
          bordered-card-on-tinted-surface pattern the homepage uses for
          ImpactStat, so it reads as solid/institutional rather than a
          footnote. No download button — see the TODO below. */}
      <section className="bg-surface-subtle">
        <div className="mx-auto max-w-page px-4 py-12 sm:py-16 lg:py-20">
          <p className="text-eyebrow uppercase text-accent-600">Governance &amp; Registration</p>
          <h2 className="mt-2 text-display-sm">A registered, governed organization</h2>
          <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {GOVERNANCE_FACTS.map((fact) => (
              <div key={fact.label} className="rounded-card border border-border bg-surface p-5">
                <dt className="text-sm text-ink-600">{fact.label}</dt>
                <dd className="mt-1 font-display font-semibold text-brand-900">{fact.value}</dd>
              </div>
            ))}
          </dl>
          {/* TODO: once the Document model exists (CLAUDE.md §9), link the
              constitution and governance policies here. No download button
              until there's a real file behind it. */}
        </div>
      </section>

      {/* 8. Closing CTA — visual peak #3, inverted brand band with a solid
          (not outline) primary button, matching the homepage's closing
          "get involved" band. */}
      <section className="on-brand">
        <div className="mx-auto max-w-page px-4 py-12 sm:py-16 lg:py-20">
          <h2 className="text-display-sm">Get in touch</h2>
          <p className="mt-3 max-w-content text-brand-100">
            Questions about our sectors, programmes, or how to volunteer or
            partner with us — contact YouthInTech directly.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-pill bg-white px-5 py-3 text-center font-medium text-brand-900"
          >
            Contact us
          </Link>
        </div>
      </section>
    </>
  );
}
