import Link from "next/link";
import { type LucideIcon } from "lucide-react";

// One shape for all three "get involved" routes — icon badge, title +
// description, left-aligned throughout. No trailing arrow: the whole card
// is the tap target (hover/focus lift already signals that), so a
// decorative arrow only added dead space without adding information.
// Icon sits above the text at 375px, beside it from sm up.
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
      className="group flex h-full flex-col items-start gap-3 rounded-card border border-border bg-surface p-5 text-left shadow-(--shadow-card) transition hover:-translate-y-1 hover:shadow-(--shadow-lift) sm:flex-row"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100">
        <Icon aria-hidden="true" className="h-6 w-6 text-brand-700" />
      </span>
      <div>
        <p className="font-display font-semibold text-brand-900">{title}</p>
        <p className="mt-1 text-sm text-ink-600">{description}</p>
      </div>
    </Link>
  );
}
