// Add an item only once its page exists — see CLAUDE.md build order.
export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/our-sectors", label: "Our Sectors" },
  { href: "/programmes", label: "Programmes" },
  { href: "/about", label: "About" },
] as const;

export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
