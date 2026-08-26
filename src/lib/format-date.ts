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
