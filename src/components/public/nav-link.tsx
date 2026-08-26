"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive } from "./nav-items";

// Client so public pages keep ISR eligibility — a Server Component would
// need headers()/dynamic rendering to know the current path, which taints
// every page under (public)/, not just this one. See CLAUDE.md §4.
export function NavLink({
  href,
  className,
  onNavigate,
  children,
}: {
  href: string;
  className?: string;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = isNavItemActive(href, pathname);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`inline-flex flex-col items-center gap-1.5 text-ink-700 hover:text-brand-800 ${className ?? ""}`}
    >
      <span>{children}</span>
      {/* Underline rule marks the active item — never a colour change on its
          own, per the design brief. Rendered transparent when inactive so
          the rule doesn't shift layout on route change. */}
      <span
        aria-hidden="true"
        className={`h-0.5 w-4 rounded-pill ${active ? "bg-brand-900" : "bg-transparent"}`}
      />
    </Link>
  );
}
