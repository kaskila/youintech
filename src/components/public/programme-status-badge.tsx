import type { ProgrammeStatus } from "@/generated/prisma/enums";

// Honesty over hype: only RUNNING gets the bold brand-green treatment,
// because it's the only state that's actually true right now. PLANNED and
// UPCOMING stay quiet and outlined on purpose — nothing has run yet (see
// prisma/seed.ts), and styling them like a live event would be a lie.
const STATUS_STYLES: Record<ProgrammeStatus, { label: string; className: string }> = {
  PLANNED: {
    label: "Planned",
    className: "border border-border-strong bg-surface text-ink-600",
  },
  UPCOMING: {
    label: "Upcoming",
    className: "border border-brand-300 bg-brand-50 text-brand-800",
  },
  RUNNING: {
    label: "Running now",
    className: "border border-brand-700 bg-brand-700 text-white",
  },
  COMPLETED: {
    label: "Completed",
    className: "border border-border-strong bg-surface-subtle text-ink-500",
  },
};

export function ProgrammeStatusBadge({ status }: { status: ProgrammeStatus }) {
  const { label, className } = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
