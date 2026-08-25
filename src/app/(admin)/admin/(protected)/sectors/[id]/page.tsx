import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { SectorEditForm } from "./sector-edit-form";

export default async function SectorEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [sector, user] = await Promise.all([
    db.sector.findUnique({ where: { id } }),
    getSessionUser(),
  ]);

  if (user?.role !== Role.ADMIN) {
    redirect("/admin/sectors");
  }

  if (!sector) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-content">
      <Link href="/admin/sectors" className="text-sm">
        ← Back to sectors
      </Link>
      <h1 className="text-display-sm mb-6 mt-2">Edit {sector.name}</h1>
      <SectorEditForm sector={sector} />
    </div>
  );
}
