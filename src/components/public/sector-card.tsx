import Link from "next/link";
import { DynamicIcon } from "./dynamic-icon";

export function SectorCard({
  slug,
  name,
  tagline,
  icon,
}: {
  slug: string;
  name: string;
  tagline: string | null;
  icon: string | null;
}) {
  return (
    <Link
      href={`/our-sectors/${slug}`}
      className="group flex flex-col gap-1.5 rounded-card border border-border bg-surface p-4 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-lift)"
    >
      <DynamicIcon name={icon} className="h-7 w-7 text-brand-700" />
      <p className="font-display font-semibold text-brand-900 group-hover:underline">{name}</p>
      {tagline ? <p className="text-sm text-ink-600">{tagline}</p> : null}
    </Link>
  );
}
