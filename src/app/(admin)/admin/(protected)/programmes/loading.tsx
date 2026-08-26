export default function ProgrammesLoading() {
  return (
    <div className="mx-auto max-w-page">
      <div className="mb-6 h-8 w-40 animate-pulse rounded-md bg-ink-100" />
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="h-16 animate-pulse rounded-card border border-border bg-ink-100"
          />
        ))}
      </ul>
    </div>
  );
}
