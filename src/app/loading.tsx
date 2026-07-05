function LoadingCard({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm ${className}`}
    />
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface">
      <div className="hidden md:block">
        <aside className="fixed left-0 top-0 h-screen w-[260px] border-r border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3 border-b border-surface-container-highest px-3 py-4">
            <div className="h-10 w-10 animate-pulse rounded-md bg-surface-container-high" />
            <div className="flex-1">
              <div className="h-5 w-28 animate-pulse rounded bg-surface-container-high" />
              <div className="mt-2 h-3 w-36 animate-pulse rounded bg-surface-container-high" />
            </div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                className="h-11 animate-pulse rounded-lg bg-surface-container-high"
                key={`loading-nav-${index}`}
              />
            ))}
          </div>
        </aside>
      </div>

      <header className="fixed right-0 top-0 z-30 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-4 shadow-sm md:w-[calc(100%-260px)] md:px-6">
        <div className="hidden w-full max-w-xl md:block">
          <div className="h-11 animate-pulse rounded-lg bg-surface-container-high" />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-surface-container-high" />
          <div className="hidden h-8 w-px bg-outline-variant md:block" />
          <div className="hidden md:block">
            <div className="h-10 w-36 animate-pulse rounded-lg bg-surface-container-high" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded-lg bg-surface-container-high" />
        </div>
      </header>

      <main className="pt-16 md:ml-[260px]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
          <LoadingCard className="h-44 md:h-52" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingCard className="h-32" key={`loading-stat-${index}`} />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <LoadingCard className="h-[420px]" />
            <LoadingCard className="h-[420px]" />
          </div>
        </div>
      </main>
    </div>
  );
}
