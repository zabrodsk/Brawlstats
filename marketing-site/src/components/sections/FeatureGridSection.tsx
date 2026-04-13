import Image from "next/image";

type FeatureItem = {
  num: string;
  title: string;
  description: string;
  imageSrc: string;
  imagePosition: string;
};

const FEATURES: FeatureItem[] = [
  {
    num: "01",
    title: "Maps",
    description:
      "Jump into game modes quickly and prep around the exact map you are about to play.",
    imageSrc: "/media/screenshots/maps.png",
    imagePosition: "object-center",
  },
  {
    num: "02",
    title: "Strategy Canvas",
    description:
      "Sketch lanes, pushes, and role assignments with a clean board built for fast planning.",
    imageSrc: "/media/screenshots/strategy-canvas.png",
    imagePosition: "object-[50%_35%]",
  },
  {
    num: "03",
    title: "Tier Lists",
    description:
      "Maintain personal rankings by mode so your picks stay consistent with your playstyle.",
    imageSrc: "/media/screenshots/tiers.png",
    imagePosition: "object-[50%_20%]",
  },
  {
    num: "04",
    title: "Brawlers",
    description:
      "Browse the full roster and review options in context with your maps and team ideas.",
    imageSrc: "/media/screenshots/brawlers.png",
    imagePosition: "object-[50%_14%]",
  },
];

export function FeatureGridSection() {
  return (
    <section
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="section-inner">
        <p className="section-label">Features</p>
        <h2 className="section-heading">
          Everything between
          <br />
          queue and kick&#8209;off.
        </h2>

        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="feature-card">
              <p className="feat-num">{feature.num}</p>
              <h3 className="feat-title">{feature.title}</h3>
              <p className="feat-desc">{feature.description}</p>
              <div className="feat-shot-frame">
                <Image
                  src={feature.imageSrc}
                  alt={`${feature.title} screenshot`}
                  fill
                  className={`feat-shot ${feature.imagePosition}`}
                  sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 560px"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
