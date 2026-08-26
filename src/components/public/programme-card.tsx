import Link from "next/link";
import { DynamicIcon } from "./dynamic-icon";
import { ProgrammeStatusBadge } from "./programme-status-badge";
import type { ProgrammeStatus } from "@/generated/prisma/enums";

export function ProgrammeCard({
  slug,
  title,
  summary,
  icon,
  status,
}: {
  slug: string;
  title: string;
  summary: string;
  icon: string;
  status: ProgrammeStatus;
}) {
  return (
    <Link
      href={`/programmes/${slug}`}
      className="group flex flex-col gap-3 rounded-card border border-border bg-surface p-5 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-lift)"
    >
      <div className="flex items-start justify-between gap-3">
        <DynamicIcon name={icon} className="h-8 w-8 text-brand-700" />
        <ProgrammeStatusBadge status={status} />
      </div>
      <p className="font-display font-semibold text-brand-900 group-hover:underline">{title}</p>
      <p className="text-sm text-ink-600">{summary}</p>
    </Link>
  );
}
