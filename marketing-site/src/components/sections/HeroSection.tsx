type HeroSectionProps = {
  webAppUrl: string;
  iosUrl: string;
};

export function HeroSection({ webAppUrl, iosUrl }: HeroSectionProps) {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 pt-20 pb-16 sm:px-10 sm:pt-28">
      {/* Hero background video slot (replace this file when needed) */}
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen"
        autoPlay
        muted
        loop
        playsInline
        poster="/media/hero/hero-fallback.png"
        aria-hidden="true"
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Content sits above the video */}
      <div className="relative">
        <p className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-1 text-xs font-semibold tracking-[0.08em] text-[var(--brand-yellow)] uppercase">
          Brawl Strategy
        </p>
        <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
          Win more matches with map-first strategy planning.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-muted)] sm:text-lg">
          Browse maps, build team plans on a tactical canvas, and keep personal
          tier lists in one place. Designed for players who want cleaner prep
          and faster decision-making.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a className="btn-primary" href={webAppUrl}>
            Open Web App
          </a>
          <a className="btn-secondary" href={iosUrl}>
            Get iOS App
          </a>
        </div>
      </div>
    </section>
  );
}
