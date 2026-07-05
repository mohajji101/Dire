import { AppShell } from "@/components/app-shell";

type ModulePageProps = {
  title: string;
  description: string;
  activeItem: string;
  stats: Array<{ label: string; value: string }>;
  sections: string[];
};

export function ModulePage({
  activeItem,
  description,
  sections,
  stats,
  title,
}: ModulePageProps) {
  return (
    <AppShell activeItem={activeItem}>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
            Dire Cargo
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
            {description}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <article
              className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
              key={stat.label}
            >
              <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                {stat.label}
              </p>
              <p className="mt-3 font-heading text-3xl font-bold text-primary">
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Implementation Scope
            </h2>
          </div>
          <div className="grid gap-0 md:grid-cols-2">
            {sections.map((section) => (
              <div
                className="border-b border-outline-variant p-5 last:border-b-0 md:border-r md:even:border-r-0"
                key={section}
              >
                <p className="font-data text-sm font-bold text-on-surface">
                  {section}
                </p>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                  Screen implementation will follow the PDF spec and visual
                  reference set for this module.
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
