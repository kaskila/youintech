export default function SectorEditLoading() {
  return (
    <div className="mx-auto max-w-content">
      <div className="mb-6 h-8 w-64 animate-pulse rounded-md bg-ink-100" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-ink-100" />
        ))}
      </div>
    </div>
  );
}
