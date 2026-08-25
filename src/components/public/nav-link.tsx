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
      className={active ? `text-brand-900 ${className ?? ""}` : `text-ink-700 ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}
