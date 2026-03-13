export function RegistrySkeleton() {
  return (
    <div className="space-y-10">
      {/* Verify bar skeleton */}
      <div>
        <div className="mb-2 h-7 w-72 animate-pulse rounded bg-muted-bg" />
        <div className="mb-8 h-4 w-96 animate-pulse rounded bg-muted-bg" />
        <div className="flex gap-3">
          <div className="h-[42px] flex-1 animate-pulse rounded-lg border border-border bg-muted-bg" />
          <div className="h-[42px] w-[90px] animate-pulse rounded-lg border border-border bg-muted-bg" />
        </div>
        <div className="mt-4 flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-28 animate-pulse rounded-lg border border-border bg-muted-bg"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Network pulse skeleton */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted-bg" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted-bg" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg border border-border bg-muted-bg"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Ecosystem grid skeleton */}
      <div>
        <div className="mb-4 h-4 w-36 animate-pulse rounded bg-muted-bg" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-muted-bg"
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
