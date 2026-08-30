// Retention decision (2026-08, see /privacy "How long we keep it"): 24
// months from last contact, then personal fields are anonymised. Set on
// insert by every Server Action that creates a row with a `retentionUntil`
// column — currently submitInquiry (contact/actions.ts). Application's own
// submission action doesn't exist yet (CLAUDE.md §9); wire this in there
// too once it does.
export const RETENTION_MONTHS = 24;

export function retentionDeadline(from: Date = new Date()): Date {
  const deadline = new Date(from);
  deadline.setMonth(deadline.getMonth() + RETENTION_MONTHS);
  return deadline;
}
