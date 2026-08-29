import Link from "next/link";
import { db } from "@/lib/db";
import { OpportunityForm } from "../opportunity-form";

export default async function NewOpportunityPage() {
  const sectors = await db.sector.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-content">
      <Link href="/admin/opportunities" className="text-sm">
        ← Back to opportunities
      </Link>
      <h1 className="text-display-sm mb-6 mt-2">New opportunity</h1>
      <OpportunityForm sectors={sectors} />
    </div>
  );
}
