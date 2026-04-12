type FeatureItem = {
  title: string;
  description: string;
  imageSrc: string;
};

const WEB_APP_URL = "https://dashboardbrawlstats.pages.dev";

const FEATURES: FeatureItem[] = [
  {
    title: "Maps",
    description:
      "Jump into game modes quickly and prep around the exact map you are about to play.",
    imageSrc: "/media/screenshots/maps.png",
  },
  {
    title: "Strategy Canvas",
    description:
      "Sketch lanes, pushes, and role assignments with a clean board built for fast planning.",
    imageSrc: "/media/screenshots/strategy-canvas.png",
  },
  {
    title: "Tier Lists",
    description:
      "Maintain personal rankings by mode so your picks stay consistent with your playstyle.",
    imageSrc: "/media/screenshots/tiers.png",
  },
  {
    title: "Brawlers",
    description:
      "Browse the full roster and review options in context with your maps and team ideas.",
    imageSrc: "/media/screenshots/brawlers.png",
  },
];

const FEATURE_LINKS: Record<string, string> = {
  Maps: `${WEB_APP_URL}/maps`,
  "Strategy Canvas": `${WEB_APP_URL}/strats`,
  "Tier Lists": `${WEB_APP_URL}/tiers`,
  Brawlers: `${WEB_APP_URL}/brawlers`,
};

export function FeatureGridSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
        Everything you need between queue and match start.
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <a
            key={feature.title}
            href={FEATURE_LINKS[feature.title] ?? WEB_APP_URL}
            className="card-base card-interactive min-h-[156px] block"
          >
            <div className="feature-shot-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={feature.imageSrc}
                alt={`${feature.title} screenshot`}
                className="feature-shot absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="text-lg font-semibold text-[var(--foreground)]">
              {feature.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {feature.description}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
