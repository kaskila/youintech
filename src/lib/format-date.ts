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
