import Link from "next/link";
import { db } from "@/lib/db";
import { EventForm } from "../event-form";

export default async function NewEventPage() {
  const sectors = await db.sector.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-content">
      <Link href="/admin/events" className="text-sm">
        ← Back to events
      </Link>
      <h1 className="text-display-sm mb-6 mt-2">New event</h1>
      <EventForm sectors={sectors} now={new Date()} />
    </div>
  );
}
