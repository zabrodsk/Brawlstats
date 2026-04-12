export function PlatformSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="card-base">
          <p className="text-xs font-semibold tracking-[0.08em] text-[var(--brand-yellow)] uppercase">
            Web
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            Open instantly, no setup.
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            Use maps, brawlers, strategies, and tiers directly in the browser
            when you want to prep fast.
          </p>
        </article>
        <article className="card-base">
          <p className="text-xs font-semibold tracking-[0.08em] text-[var(--brand-yellow)] uppercase">
            iOS
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            Stay synced with your routine.
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            Keep strategy prep close on mobile, including quick access to maps,
            brawlers, and tier workflows.
          </p>
        </article>
      </div>
    </section>
  );
}
