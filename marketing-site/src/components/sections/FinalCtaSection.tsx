type FinalCtaSectionProps = {
  webAppUrl: string;
  iosUrl: string;
};

export function FinalCtaSection({ webAppUrl, iosUrl }: FinalCtaSectionProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
      <div className="card-base">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Plan cleaner. Queue faster.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
          Use Brawl Strategy to make better picks with less guesswork before
          every match.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a className="btn-primary" href={webAppUrl}>
            Start in Browser
          </a>
          <a className="btn-secondary" href={iosUrl}>
            Download on iOS
          </a>
        </div>
      </div>
    </section>
  );
}
