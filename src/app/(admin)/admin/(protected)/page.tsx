import { db } from "@/lib/db";

export default async function AdminDashboardPage() {
  const [sectorCount, activeSectorCount] = await Promise.all([
    db.sector.count(),
    db.sector.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="mx-auto max-w-page">
      <h1 className="text-display-sm mb-6">Dashboard</h1>

      <dl className="inline-flex flex-col gap-1 rounded-card border border-border bg-surface p-6 shadow-card">
        <dt className="text-eyebrow uppercase text-ink-500">Sectors</dt>
        <dd className="text-display-md text-brand-900">
          {activeSectorCount}
          <span className="text-lead text-ink-500"> / {sectorCount} active</span>
        </dd>
      </dl>
    </div>
  );
}
