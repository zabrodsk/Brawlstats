type FinalCtaSectionProps = {
  webAppUrl: string;
  iosUrl: string;
};

export function FinalCtaSection({ webAppUrl, iosUrl }: FinalCtaSectionProps) {
  return (
    <section className="cta-section">
      <div className="cta-inner">
        <h2 className="cta-heading">
          Plan cleaner.
          <br />
          Queue faster.
        </h2>
        <p className="cta-body">
          Use Brawl Strategy to make better picks with less guesswork before
          every match. Free on web and iOS.
        </p>
        <div className="cta-actions">
          <a className="btn-cta-primary" href={webAppUrl}>
            Start in Browser
          </a>
          <a className="btn-cta-secondary" href={iosUrl}>
            Download on iOS
          </a>
        </div>
      </div>
    </section>
  );
}
