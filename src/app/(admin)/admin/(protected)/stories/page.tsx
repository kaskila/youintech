import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Role, ContentStatus } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/format-date";
import { StoryArchiveButton } from "./story-archive-button";

const FILTERS = [
  { value: undefined, label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

function isStatus(value: string | undefined): value is ContentStatus {
  return value === "DRAFT" || value === "PUBLISHED" || value === "ARCHIVED";
}

export default async function StoriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = isStatus(status) ? status : undefined;

  const [posts, user] = await Promise.all([
    db.post.findMany({
      where: filter ? { status: filter } : undefined,
      // Newest first by when it was written — published or not. publishedAt
      // is null for drafts, so it can't carry the ordering here.
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    getSessionUser(),
  ]);

  const isAdmin = user?.role === Role.ADMIN;

  return (
    <div className="mx-auto max-w-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-display-sm">Stories</h1>
        <Link
          href="/admin/stories/new"
          className="rounded-card bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          New story
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {FILTERS.map(({ value, label }) => (
          <Link
            key={label}
            href={value ? `/admin/stories?status=${value}` : "/admin/stories"}
            className={`rounded-pill border px-3 py-1 ${
              filter === value
                ? "border-brand-700 text-brand-700"
                : "border-border-strong text-ink-600"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
          {filter ? "No stories match this filter." : "No stories yet. Create one to get started."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-(--shadow-card)"
            >
              <div>
                <p className="font-medium text-ink-800">{post.title}</p>
                <p className="text-sm text-ink-500">
                  /{post.slug} · {post.status} ·{" "}
                  {post.publishedAt ? formatDate(post.publishedAt) : "not published"} ·{" "}
                  {post.author?.name ?? "No author"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/stories/${post.id}`}
                  className="rounded-card border border-border-strong px-3 py-1 text-sm text-brand-700"
                >
                  Edit
                </Link>
                {isAdmin && post.status !== "ARCHIVED" ? (
                  <StoryArchiveButton id={post.id} title={post.title} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
