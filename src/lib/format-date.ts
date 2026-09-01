// All timestamps are stored UTC — see CLAUDE.md §5. Render in Africa/Lusaka
// everywhere a human reads one.
const dateTimeFormatter = new Intl.DateTimeFormat("en-ZM", {
  timeZone: "Africa/Lusaka",
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}

// Date-only — for fields like Programme.targetDate where a time-of-day
// would be misleading (nothing was scheduled to a specific hour).
const dateFormatter = new Intl.DateTimeFormat("en-ZM", {
  timeZone: "Africa/Lusaka",
  dateStyle: "long",
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

// "3 days ago" / "in 2 days" / "today". For dashboard lists where an exact
// timestamp is noise — the reader wants "how stale is this", not the minute.
export function formatRelative(date: Date, now: Date = new Date()): string {
  let duration = (date.getTime() - now.getTime()) / 1000;
  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(duration) < amount) {
      return relativeFormatter.format(Math.round(duration), unit);
    }
    duration /= amount;
  }
  return relativeFormatter.format(Math.round(duration), "year");
}

// "12 days" / "3 weeks" / "less than a day" — a bare span, no direction.
// For "this has been a draft for ___".
export function formatAge(since: Date, now: Date = new Date()): string {
  const ms = Math.max(0, now.getTime() - since.getTime());
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return "less than a day";
  if (days === 1) return "1 day";
  if (days < 14) return `${days} days`;
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return `${weeks} weeks`;
  const months = Math.floor(days / 30);
  return months < 2 ? "about a month" : `${months} months`;
}
