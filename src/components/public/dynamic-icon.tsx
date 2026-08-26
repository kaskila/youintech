import * as icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Renders a lucide-react icon by component name, where the name is free
// text set by an admin (Sector.icon, Programme.icon). Fall back to a
// generic icon rather than rendering nothing if it's empty or no longer a
// valid name.
const iconRegistry = icons as unknown as Record<string, LucideIcon>;
const FALLBACK_ICON = "Layers";

export function DynamicIcon({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  const Icon = (name && iconRegistry[name]) || iconRegistry[FALLBACK_ICON];
  return <Icon aria-hidden="true" className={className} />;
}
