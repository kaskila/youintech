import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { SectorCard } from "@/components/public/sector-card";
import heroImage from "../../../public/hero.png";

// See (public)/programmes/page.tsx — same rationale for the revalidate window.
export const revalidate = 3600;

export default async function HomePage() {
  const sectors = await db.sector.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

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
                href="mailto:youintech25@gmail.com"
                className="rounded-pill border border-white px-5 py-3 font-medium text-white"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

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
    </>
  );
}
