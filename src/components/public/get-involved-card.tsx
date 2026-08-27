import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

// One shape for all three "get involved" routes — icon badge, title +
// description, arrow anchored bottom-right regardless of description
// length. Icon sits above the text at 375px, beside it from sm up.
export function GetInvolvedCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col items-center gap-4 rounded-card border border-border bg-surface p-6 pb-12 text-center shadow-(--shadow-card) transition hover:-translate-y-1 hover:shadow-(--shadow-lift) sm:flex-row sm:items-start sm:pb-12 sm:text-left"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100">
        <Icon aria-hidden="true" className="h-7 w-7 text-brand-700" />
      </span>
      <div>
        <p className="font-display font-semibold text-brand-900">{title}</p>
        <p className="mt-2 text-sm text-ink-600">{description}</p>
      </div>
      <ArrowRight
        aria-hidden="true"
        className="absolute bottom-4 right-4 h-5 w-5 text-brand-700 transition-transform group-hover:translate-x-1"
      />
    </Link>
  );
}
