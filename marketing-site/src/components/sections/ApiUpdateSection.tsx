type ApiUpdateSectionProps = {
  webAppUrl: string;
};

const UPDATE_ITEMS = [
  {
    title: "Live account hub",
    body: "Save your tag and open a dedicated Account page for live profile data and roster status.",
  },
  {
    title: "Battle insights",
    body: "Recent battle logs now include win rate, streaks, trophy delta trends, and map/mode breakdowns.",
  },
  {
    title: "Club + rotation",
    body: "Track club members and current event rotation with one flow into Maps and Strategy creation.",
  },
];

export function ApiUpdateSection({ webAppUrl }: ApiUpdateSectionProps) {
  return (
    <section className="api-update-section">
      <div className="section-inner">
        <p className="section-label">New in this update</p>
        <h2 className="section-heading">Official Brawl Stars API, now in your dashboard.</h2>

        <div className="api-update-grid">
          {UPDATE_ITEMS.map((item, idx) => (
            <article key={item.title} className="api-update-card">
              <p className="api-update-index">0{idx + 1}</p>
              <h3 className="api-update-title">{item.title}</h3>
              <p className="api-update-body">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="api-update-actions">
          <a className="btn-primary" href={`${webAppUrl}/account`}>
            Open Account in Dashboard
          </a>
        </div>
      </div>
    </section>
  );
}
