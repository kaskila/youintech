"use client";

export default function ProgrammesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-page">
      <div className="rounded-card border border-border bg-surface p-6">
        <p className="mb-3 text-ink-800" style={{ color: "var(--color-danger)" }}>
          Couldn&apos;t load programmes. Try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-pill border border-border-strong px-3 py-1 text-sm text-brand-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
