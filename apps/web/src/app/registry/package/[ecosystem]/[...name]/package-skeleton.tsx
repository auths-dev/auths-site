export function PackageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 animate-pulse rounded bg-muted-bg" />
        <div className="h-8 w-56 animate-pulse rounded bg-muted-bg" />
      </div>

      {/* Badge skeleton */}
      <div className="mt-4 h-8 w-52 animate-pulse rounded-full bg-muted-bg" />

      {/* Terminal blocks skeleton */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-28 animate-pulse rounded-lg border border-border bg-muted-bg" />
        <div
          className="h-28 animate-pulse rounded-lg border border-border bg-muted-bg"
          style={{ animationDelay: '100ms' }}
        />
      </div>

      {/* Chain of trust skeleton */}
      <div className="mt-12 space-y-3">
        <div className="h-4 w-36 animate-pulse rounded bg-muted-bg" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="h-5 w-5 animate-pulse rounded-full bg-muted-bg" />
            <div className="h-12 flex-1 animate-pulse rounded-lg bg-muted-bg" />
          </div>
        ))}
      </div>

      {/* Signers skeleton */}
      <div className="mt-12 space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-muted-bg" />
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 w-16 animate-pulse rounded-full bg-muted-bg"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Ledger skeleton */}
      <div className="mt-12 space-y-3">
        <div className="h-4 w-48 animate-pulse rounded bg-muted-bg" />
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg border border-border bg-muted-bg"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
