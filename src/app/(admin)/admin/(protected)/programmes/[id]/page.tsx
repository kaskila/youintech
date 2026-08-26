import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ProgrammeForm } from "../programme-form";

export default async function EditProgrammePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const programme = await db.programme.findUnique({ where: { id } });

  if (!programme) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-content">
      <Link href="/admin/programmes" className="text-sm">
        ← Back to programmes
      </Link>
      <h1 className="text-display-sm mb-6 mt-2">Edit {programme.title}</h1>
      <ProgrammeForm programme={programme} />
    </div>
  );
}
