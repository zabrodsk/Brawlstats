export function PlatformSection() {
  return (
    <section style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="section-inner">
        <p className="section-label">Platforms</p>
        <h2 className="section-heading">Where you play,&nbsp;we&rsquo;re there.</h2>

        <div className="platform-grid">
          <article className="platform-card">
            <p className="platform-label">Web</p>
            <h3 className="platform-title">Open instantly,<br />no setup.</h3>
            <p className="platform-body">
              Maps, brawlers, strategies, and tier lists — all available
              directly in the browser whenever you need to prep fast.
            </p>
            <span className="platform-label-bg" aria-hidden="true">WEB</span>
          </article>

          <article className="platform-card">
            <p className="platform-label">iOS</p>
            <h3 className="platform-title">Synced with<br />your routine.</h3>
            <p className="platform-body">
              Keep strategy prep close on mobile. Quick access to maps,
              brawlers, and tier workflows — wherever you are.
            </p>
            <span className="platform-label-bg" aria-hidden="true">iOS</span>
          </article>
        </div>
      </div>
    </section>
  );
}
