export function OrgSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
      {/* Header skeleton */}
      <div className="flex items-start gap-6">
        <div className="h-24 w-24 shrink-0 animate-pulse rounded-xl bg-muted-bg" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-48 animate-pulse rounded bg-muted-bg" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted-bg" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted-bg" />
        </div>
      </div>

      {/* Members skeleton */}
      <div className="mt-12 space-y-3">
        <div className="h-4 w-28 animate-pulse rounded bg-muted-bg" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="h-6 w-6 rounded-full bg-muted-bg" />
            <div className="h-4 w-64 rounded bg-muted-bg" />
          </div>
        ))}
      </div>

      {/* Namespaces skeleton */}
      <div className="mt-12 space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted-bg" />
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-lg border border-border bg-muted-bg"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      {/* Activity skeleton */}
      <div className="mt-12 space-y-3">
        <div className="h-4 w-36 animate-pulse rounded bg-muted-bg" />
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-8 animate-pulse rounded bg-muted-bg"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
