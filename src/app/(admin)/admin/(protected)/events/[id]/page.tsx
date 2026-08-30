import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { EventForm } from "../event-form";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, sectors] = await Promise.all([
    db.event.findUnique({ where: { id } }),
    db.sector.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-content">
      <Link href="/admin/events" className="text-sm">
        ← Back to events
      </Link>
      <h1 className="text-display-sm mb-6 mt-2">Edit {event.title}</h1>
      <EventForm event={event} sectors={sectors} now={new Date()} />
    </div>
  );
}
