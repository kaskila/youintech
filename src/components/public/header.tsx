import Image from "next/image";
import Link from "next/link";
import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";
import { MobileMenu } from "./mobile-menu";
import { JoinMovementLink } from "./join-movement-link";

// Not sticky on purpose — costs vertical space on small screens. See
// CLAUDE.md §2 (Zambian network conditions / small-screen budget).
export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* Sized to roughly the full wordmark + tagline block height
              (~36-40px), not the wordmark's cap-height alone — a mark
              matched to cap-height reads as invisible at this weight.
              Centered against the whole two-line block accordingly.
              Decorative: the wordmark alone carries the org name for
              screen readers. */}
          <Image src="/logo_2.png" alt="" width={40} height={40} className="h-10 w-10" />
          <span className="flex flex-col">
            <span className="font-display text-lg font-semibold text-brand-900">
              YouthInTech
            </span>
            {/* Tagline drops below md — the wordmark alone carries the
                header on small screens; the tagline is a nice-to-have. */}
            <span className="hidden text-xs text-ink-500 md:block">
              Technology is for everyone — especially YOUth.
            </span>
          </span>
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

        <div className="hidden md:block">
          <JoinMovementLink />
        </div>

        <MobileMenu />
      </div>
    </header>
  );
}
