type HeroSectionProps = {
  webAppUrl: string;
  iosUrl: string;
};

const TOOLS = ["Maps", "Strategy Canvas", "Tier Lists", "Brawlers"];

export function HeroSection({ webAppUrl, iosUrl }: HeroSectionProps) {
  return (
    <section className="hero-wrap">
      {/* Nav row */}
      <div className="hero-nav">
        <span className="hero-logo">Brawl Strategy</span>
        <a href={webAppUrl} className="hero-nav-cta">
          Open App →
        </a>
      </div>

      {/* Main hero content */}
      <div className="hero-main">
        <div className="hero-eyebrow">
          <span className="hero-eyebrow-bar" aria-hidden="true" />
          <span className="hero-eyebrow-text">Map-First Strategy Tool</span>
        </div>

        <h1 className="hero-headline">
          Win more
          <span className="hero-headline-accent">matches.</span>
        </h1>

        <p className="hero-body">
          Browse maps, build team plans on a tactical canvas, and keep personal
          tier lists in one place. Designed for players who want cleaner prep
          and faster decision-making.
        </p>

        <div className="hero-actions">
          <a className="btn-primary" href={webAppUrl}>
            Open Web App
          </a>
          <a className="btn-secondary" href={iosUrl}>
            Get iOS App
          </a>
        </div>
      </div>

      {/* Feature strip */}
      <div className="hero-strip" aria-hidden="true">
        {TOOLS.map((tool) => (
          <span key={tool} className="hero-strip-item">
            {tool}
          </span>
        ))}
      </div>
    </section>
  );
}
