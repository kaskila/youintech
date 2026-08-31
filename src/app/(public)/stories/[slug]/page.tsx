import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format-date";
import { Markdown } from "@/components/public/markdown";

// See (public)/stories/page.tsx — same window and reasoning.
export const revalidate = 3600;

// Deduped per-request: generateMetadata and the page component both need the
// same row, and Prisma (unlike fetch()) has no built-in request cache.
const getPost = cache((slug: string) =>
  db.post.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true } },
      sector: { select: { name: true } },
    },
  })
);

export async function generateStaticParams() {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      siteName: "YouthInTech",
      locale: "en_ZM",
      type: "article",
      ...(post.publishedAt ? { publishedTime: post.publishedAt.toISOString() } : {}),
      ...(post.coverImage ? { images: [{ url: post.coverImage }] } : {}),
    },
  };
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:py-16">
      <Link href="/stories" className="text-sm">
        ← All stories
      </Link>

      {/* Not every story has a cover yet (admin-editable, defaults to null)
          — fall back to no banner rather than a placeholder. */}
      {post.coverImage ? (
        <div className="relative mt-4 h-56 w-full overflow-hidden rounded-card sm:h-72">
          <Image
            src={post.coverImage}
            alt={post.coverAlt ?? ""}
            fill
            priority
            sizes="(min-width: 768px) 704px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      {post.sector ? (
        <span className="mt-4 inline-flex w-fit items-center rounded-pill border border-border-strong bg-surface px-3 py-1 text-xs font-medium text-ink-700">
          {post.sector.name}
        </span>
      ) : null}

      <h1 className="mt-3 text-display-md">{post.title}</h1>

      <p className="mt-3 text-sm text-ink-500">
        {formatDate(post.publishedAt ?? post.createdAt)}
        {post.author?.name ? ` · ${post.author.name}` : ""}
      </p>

      <p className="mt-4 text-lead text-ink-600">{post.excerpt}</p>

      <Markdown className="mt-6">{post.body}</Markdown>
    </div>
  );
}
