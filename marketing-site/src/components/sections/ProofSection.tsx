const PROOF_ITEMS = [
  {
    index: "01",
    heading: "Map-specific context.",
    body: "Mode-aware navigation puts you on the right map immediately. No hunting, no guessing — just fast prep.",
  },
  {
    index: "02",
    heading: "Built for speed.",
    body: "The strategy flow strips out noise. Every tool is one tap away and tuned for the pre-match window.",
  },
  {
    index: "03",
    heading: "Your tier boards.",
    body: "Personal rankings separated by game mode so your picks stay consistent with your actual playstyle.",
  },
];

export function ProofSection() {
  return (
    <section className="proof-section">
      <div className="section-inner">
        <p className="section-label">Why it works</p>
        <h2 className="section-heading">
          Built for practical,
          <br />
          Brawl Stars decisions.
        </h2>

        <div className="proof-items">
          {PROOF_ITEMS.map((item) => (
            <div key={item.index} className="proof-item">
              <p className="proof-index">{item.index}</p>
              <p className="proof-stat">{item.heading}</p>
              <p className="proof-body">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
