import {
  GraduationCap,
  Award,
  Briefcase,
  Landmark,
  Wrench,
  Trophy,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { OpportunityType } from "@/generated/prisma/enums";

// Purely presentational — not stored on the model (Opportunity has no
// `icon` field, unlike Programme/Sector). One neutral style for every
// type: unlike ProgrammeStatusBadge, no type here is more "real" than
// another, so there's no honesty-over-hype case for differentiating them.
const TYPE_META: Record<OpportunityType, { label: string; icon: LucideIcon }> = {
  SCHOLARSHIP: { label: "Scholarship", icon: GraduationCap },
  FELLOWSHIP: { label: "Fellowship", icon: Award },
  INTERNSHIP: { label: "Internship", icon: Briefcase },
  JOB: { label: "Job", icon: Landmark },
  GRANT: { label: "Grant", icon: Wrench },
  TRAINING: { label: "Training", icon: GraduationCap },
  COMPETITION: { label: "Competition", icon: Trophy },
  OTHER: { label: "Opportunity", icon: Sparkles },
};

export function OpportunityTypeBadge({ type }: { type: OpportunityType }) {
  const { label, icon: Icon } = TYPE_META[type];
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-border-strong bg-surface px-3 py-1 text-xs font-medium text-ink-700">
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export { TYPE_META };
