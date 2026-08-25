"use client";

import { useState } from "react";
import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-nav"
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-md border border-border-strong p-2 text-ink-700 md:hidden"
      >
        <span aria-hidden="true">{isOpen ? "✕" : "☰"}</span>
        <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
      </button>

      {isOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="w-full border-t border-border pt-4 md:hidden"
        >
          <ul className="flex flex-col gap-3 text-base font-medium">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} onNavigate={() => setIsOpen(false)}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </>
  );
}
