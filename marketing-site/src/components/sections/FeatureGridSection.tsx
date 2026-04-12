type FeatureItem = {
  num: string;
  title: string;
  description: string;
  mock: "maps" | "canvas" | "tiers" | "brawlers";
};

const FEATURES: FeatureItem[] = [
  {
    num: "01",
    title: "Maps",
    description:
      "Jump into game modes quickly and prep around the exact map you are about to play.",
    mock: "maps",
  },
  {
    num: "02",
    title: "Strategy Canvas",
    description:
      "Sketch lanes, pushes, and role assignments with a clean board built for fast planning.",
    mock: "canvas",
  },
  {
    num: "03",
    title: "Tier Lists",
    description:
      "Maintain personal rankings by mode so your picks stay consistent with your playstyle.",
    mock: "tiers",
  },
  {
    num: "04",
    title: "Brawlers",
    description:
      "Browse the full roster and review options in context with your maps and team ideas.",
    mock: "brawlers",
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
              <div className={`feat-mock feat-mock-${feature.mock}`}>
                <div className="feat-mock-head">
                  <span className="feat-mock-chip" />
                  <span className="feat-mock-line feat-mock-line-short" />
                </div>
                <div className="feat-mock-grid">
                  <span className="feat-mock-block" />
                  <span className="feat-mock-block" />
                  <span className="feat-mock-block" />
                  <span className="feat-mock-block" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
