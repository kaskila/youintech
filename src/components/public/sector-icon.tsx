import * as icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Sector.icon is a free-text lucide-react component name set by an admin
// (see prisma/schema.prisma "Sector.icon"). Fall back to a generic icon
// rather than rendering nothing if it's empty or no longer a valid name.
const iconRegistry = icons as unknown as Record<string, LucideIcon>;
const FALLBACK_ICON = "Layers";

export function SectorIcon({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  const Icon = (name && iconRegistry[name]) || iconRegistry[FALLBACK_ICON];
  return <Icon aria-hidden="true" className={className} />;
}
