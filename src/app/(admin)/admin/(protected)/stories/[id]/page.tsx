import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { StoryForm } from "../story-form";

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, sectors] = await Promise.all([
    db.post.findUnique({ where: { id } }),
    db.sector.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-content">
      <Link href="/admin/stories" className="text-sm">
        ← Back to stories
      </Link>
      <h1 className="text-display-sm mb-6 mt-2">Edit {post.title}</h1>
      <StoryForm post={post} sectors={sectors} />
    </div>
  );
}
