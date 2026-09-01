"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

export type AdminNavItem = { href: string; label: string };

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);
}

// 44px minimum hit area on every link and the toggle — CLAUDE.md §6
// accessibility. `on-brand` is deliberately not used here: its `a { color }`
// rule outranks utility classes, and this nav needs per-item active styling.
const linkBase =
  "flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors";

export function AdminHeader({
  userName,
  userRole,
  navItems,
}: {
  userName: string;
  userRole: string;
  navItems: AdminNavItem[];
}) {
  const [open, setOpen] = useState(false);
  const isActive = useIsActive();

  const userBlock = (
    <span className="text-brand-100">
      {userName} <span className="opacity-75">· {userRole}</span>
    </span>
  );

  return (
    <header className="bg-brand-700 text-brand-100">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-3 px-4 py-2">
        <Link
          href="/admin"
          className="flex min-h-11 items-center font-semibold text-white"
        >
          YouthInTech admin
        </Link>

        {/* Desktop: full nav + user block inline */}
        <nav aria-label="Admin" className="hidden lg:block">
          <ul className="flex flex-wrap items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`${linkBase} ${
                    isActive(item.href)
                      ? "bg-brand-600 text-white"
                      : "text-brand-100 hover:bg-brand-600/40"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 text-sm lg:flex">
          {userBlock}
          <SignOutButton />
        </div>

        {/* Mobile / tablet: hamburger. Folds the nav AND the user block in —
            requirement 2. Breakpoint is lg, not md: eight items don't fit a
            768px row without wrapping into three lines. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          onClick={() => setOpen(!open)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-brand-100/40 text-lg text-brand-100 lg:hidden"
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>

        {open ? (
          <nav
            id="admin-mobile-nav"
            aria-label="Admin"
            className="w-full border-t border-brand-100/20 pt-2 lg:hidden"
          >
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`${linkBase} ${
                      isActive(item.href)
                        ? "bg-brand-600 text-white"
                        : "text-brand-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-brand-100/20 pt-3 text-sm">
              {userBlock}
              <SignOutButton />
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
