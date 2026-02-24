export function IdentitySkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
      {/* Header skeleton */}
      <div className="flex items-start gap-6">
        <div className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-muted-bg" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-48 animate-pulse rounded bg-muted-bg" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted-bg" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted-bg" />
        </div>
        <div className="h-24 w-24 shrink-0 animate-pulse rounded-lg bg-muted-bg" />
      </div>

      {/* Platform passport skeleton */}
      <div className="mt-12 space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-muted-bg" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-border bg-muted-bg"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Keys skeleton */}
      <div className="mt-12 space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted-bg" />
        <div className="h-24 animate-pulse rounded-lg border border-border bg-muted-bg" />
      </div>

      {/* Artifacts skeleton */}
      <div className="mt-12 space-y-3">
        <div className="h-4 w-44 animate-pulse rounded bg-muted-bg" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-border bg-muted-bg"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
