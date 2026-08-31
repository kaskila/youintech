import Link from "next/link";
import { db } from "@/lib/db";
import { StoryForm } from "../story-form";

export default async function NewStoryPage() {
  const sectors = await db.sector.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-content">
      <Link href="/admin/stories" className="text-sm">
        ← Back to stories
      </Link>
      <h1 className="text-display-sm mb-6 mt-2">New story</h1>
      <StoryForm sectors={sectors} />
    </div>
  );
}
