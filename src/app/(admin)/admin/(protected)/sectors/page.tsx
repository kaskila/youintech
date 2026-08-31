import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { Role } from "@/generated/prisma/enums";
import { SectorMoveButtons } from "./sector-move-buttons";

export default async function SectorsPage() {
  const [sectors, user] = await Promise.all([
    db.sector.findMany({ orderBy: { displayOrder: "asc" } }),
    getSessionUser(),
  ]);

  const isAdmin = user?.role === Role.ADMIN;

  return (
    <div className="mx-auto max-w-page">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-display-sm">Sectors</h1>
        <p className="text-sm text-ink-500">
          Fixed at eight — no create, no delete.
        </p>
      </div>

      {sectors.length === 0 ? (
        <p className="rounded-card border border-border bg-surface-subtle p-6 text-ink-600">
          No sectors yet. Run <code>npx prisma db seed</code> to create them.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sectors.map((sector, index) => (
            <li
              key={sector.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-(--shadow-card)"
            >
              <div>
                <p className="font-medium text-ink-800">
                  {sector.displayOrder}. {sector.name}
                </p>
                <p className="text-sm text-ink-500">
                  /{sector.slug} · {sector.isActive ? "Active" : "Inactive"}
                </p>
              </div>

              {isAdmin ? (
                <div className="flex items-center gap-3">
                  <SectorMoveButtons
                    id={sector.id}
                    name={sector.name}
                    disableUp={index === 0}
                    disableDown={index === sectors.length - 1}
                  />
                  <Link
                    href={`/admin/sectors/${sector.id}`}
                    className="rounded-card border border-border-strong px-3 py-1 text-sm text-brand-700"
                  >
                    Edit
                  </Link>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
