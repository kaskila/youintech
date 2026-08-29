import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { OpportunityForm } from "../opportunity-form";

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [opportunity, sectors] = await Promise.all([
    db.opportunity.findUnique({ where: { id } }),
    db.sector.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }),
  ]);

  if (!opportunity) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-content">
      <Link href="/admin/opportunities" className="text-sm">
        ← Back to opportunities
      </Link>
      <h1 className="text-display-sm mb-6 mt-2">Edit {opportunity.title}</h1>
      <OpportunityForm opportunity={opportunity} sectors={sectors} />
    </div>
  );
}
