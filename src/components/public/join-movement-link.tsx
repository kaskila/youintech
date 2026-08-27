import Link from "next/link";

export function JoinMovementLink({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    // TODO: repoint to the Frontliner application flow once it ships
    // (CLAUDE.md §9, build order item 7) — /contact?category=volunteer is a
    // stand-in until then.
    <Link
      href="/contact?category=volunteer"
      onClick={onNavigate}
      className={`inline-flex items-center justify-center gap-2 rounded-pill bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 ${className ?? ""}`}
    >
      Join the Movement
      <span aria-hidden="true">→</span>
    </Link>
  );
}
