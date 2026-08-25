// Exactly these three — see CLAUDE.md build order. Add an item only once its
// page exists.
export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/programmes", label: "Programmes" },
  { href: "/about", label: "About" },
] as const;

export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
