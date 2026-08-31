import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { StoryCard } from "@/components/public/story-card";

// Long ISR window, like /programmes — nothing on this page is a live time
// comparison (unlike /events' upcoming-vs-past or /opportunities' deadline
// filter). The admin actions call revalidatePath("/stories") on every
// publish/edit/archive, so this is just a safety net between those.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Stories of young Zambians using technology to solve real problems — the people behind the work YouthInTech supports.",
};

export default async function StoriesPage() {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: {
      author: { select: { name: true } },
      sector: { select: { name: true } },
    },
  });

  return (
    <div className="mx-auto max-w-page px-4 py-12 sm:py-16">
      <p className="text-eyebrow uppercase text-accent-600">Stories</p>
      <h1 className="mt-2 text-display-md">Stories</h1>
      <p className="mt-4 max-w-content text-lead text-ink-600">
        The young Zambians behind the work — how they&apos;re using technology to solve real
        problems in their communities, in their own words.
      </p>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
          <p>
            We publish new stories regularly — check back soon. If you have one to tell, or know
            someone whose work we should feature,{" "}
            <Link href="/contact" className="font-medium">
              get in touch
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <StoryCard
              key={post.id}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              coverImage={post.coverImage}
              coverAlt={post.coverAlt}
              sectorName={post.sector?.name}
              publishedAt={post.publishedAt ?? post.createdAt}
              authorName={post.author?.name}
              imageSizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>
      )}
    </div>
  );
}
