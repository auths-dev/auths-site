export function RegistrySkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
      <div className="mb-8 h-8 w-64 animate-pulse rounded bg-muted-bg" />

      <div className="flex gap-3">
        <div className="h-[42px] flex-1 animate-pulse rounded-lg border border-border bg-muted-bg" />
        <div className="h-[42px] w-[52px] animate-pulse rounded-lg border border-border bg-muted-bg" />
      </div>

      <div className="mt-8 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-border bg-muted-bg"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
