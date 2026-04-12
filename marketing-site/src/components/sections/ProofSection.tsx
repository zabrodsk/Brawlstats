const PROOF_ITEMS = [
  "Map-specific prep with mode-aware navigation",
  "Strategy flow built for speed, not clutter",
  "Personal tier boards separated by game mode",
];

export function ProofSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
      <div className="card-base">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Built for practical, pre-match decisions.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
          Brawl Strategy focuses on what helps right before a match: clear map
          context, fast planning tools, and your own rankings. No noisy
          dashboard, just the pieces that make picks and plans easier.
        </p>
        <ul className="mt-8 space-y-3">
          {PROOF_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span
                className="mt-2 h-2 w-2 rounded-full bg-[var(--brand-yellow)]"
                aria-hidden
              />
              <span className="text-sm text-[var(--foreground)] sm:text-base">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
