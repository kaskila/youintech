import Image from "next/image";
import Link from "next/link";
import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";
import { MobileMenu } from "./mobile-menu";

// Not sticky on purpose — costs vertical space on small screens. See
// CLAUDE.md §2 (Zambian network conditions / small-screen budget).
export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="shrink-0">
          {/* Source is 500x500 — next/image resizes/recompresses it down to
              what an ~40px header mark actually needs, so the oversized
              source never ships to the browser as-is. */}
          <Image src="/logo_2.png" alt="YouthInTech" width={40} height={40} className="h-10 w-10" />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
