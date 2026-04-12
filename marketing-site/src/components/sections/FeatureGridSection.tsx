import Image from "next/image";

type FeatureItem = {
  title: string;
  description: string;
  imageSrc: string;
};

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

export function FeatureGridSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
        Everything you need between queue and match start.
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="card-base card-interactive min-h-[156px]"
          >
            <div className="feature-shot-wrap">
              <Image
                src={feature.imageSrc}
                alt={`${feature.title} screenshot`}
                fill
                className="feature-shot"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 520px"
              />
            </div>
            <p className="text-lg font-semibold text-[var(--foreground)]">
              {feature.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
