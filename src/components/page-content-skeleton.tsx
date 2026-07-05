type PageContentSkeletonProps = {
  heroHeight?: string;
  sidePanels?: boolean;
  statCount?: number;
};

export function PageContentSkeleton({
  heroHeight = "h-44 md:h-52",
  sidePanels = true,
  statCount = 4,
}: PageContentSkeletonProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
      <div
        className={`animate-pulse rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm ${heroHeight}`}
      />
      <div
        className={`grid gap-4 ${statCount === 5 ? "md:grid-cols-5" : "md:grid-cols-4"}`}
      >
        {Array.from({ length: statCount }).map((_, index) => (
          <div
            className="h-32 animate-pulse rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm"
            key={`page-skeleton-stat-${index}`}
          />
        ))}
      </div>
      <div className={`grid gap-6 ${sidePanels ? "xl:grid-cols-[1fr_420px]" : ""}`}>
        <div className="h-[420px] animate-pulse rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm" />
        {sidePanels ? (
          <div className="h-[420px] animate-pulse rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm" />
        ) : null}
      </div>
    </div>
  );
}
