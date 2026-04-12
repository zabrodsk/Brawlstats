import Link from 'next/link'

export interface HomeShortcut {
  label: string
  gameModeId: number
}

interface HomeViewProps {
  shortcuts: HomeShortcut[]
}

export function HomeView({ shortcuts }: HomeViewProps) {
  return (
    <div className="px-6 py-12 md:px-12 md:py-16 max-w-2xl min-h-full">

      {/* Eyebrow */}
      <div className="animate-fade-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/20 bg-brand-yellow/[0.07] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-yellow/80">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow/70 animate-pulse" />
          Strategy hub
        </span>
      </div>

      {/* Headline */}
      <div className="animate-fade-up-delay-1">
        <h1 className="mt-5 text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.08] text-white">
          Plan your<br />
          <span className="text-brand-yellow">Brawl Stars</span><br />
          strategies
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/40 max-w-sm">
          Browse maps, build strategy boards on the canvas, and keep personal tier lists — all saved in your browser.
        </p>
      </div>

      {/* CTAs */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-up-delay-2">
        {/* Primary CTA — button-in-button pattern */}
        <Link
          href="/maps"
          className="group inline-flex items-center justify-between gap-3 rounded-full bg-brand-yellow pl-5 pr-1.5 py-1.5 text-sm font-semibold text-black transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-yellow-400 active:scale-[0.98]"
        >
          Browse all maps
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black/10 group-hover:translate-x-0.5 group-hover:-translate-y-[1px] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </Link>

        {/* Secondary CTA */}
        <Link
          href="/strats"
          className="inline-flex items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/60 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/20 hover:text-white/90 hover:bg-white/[0.06] active:scale-[0.98]"
        >
          My strategies
        </Link>
      </div>

      {/* Quick-jump mode pills */}
      {shortcuts.length > 0 && (
        <section className="mt-12 animate-fade-up-delay-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/25 mb-3">
            Jump to game mode
          </p>
          <div className="flex flex-wrap gap-2">
            {shortcuts.map((s) => (
              <Link
                key={s.gameModeId}
                href={`/maps?mode=${s.gameModeId}`}
                className="group inline-flex items-center px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-[13px] text-white/50 transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-brand-yellow/25 hover:bg-brand-yellow/[0.06] hover:text-brand-yellow/80 active:scale-[0.97]"
              >
                {s.label}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-white/20">
            Opens maps filtered to that mode.{' '}
            <Link href="/maps" className="text-brand-yellow/50 hover:text-brand-yellow transition-colors">
              See all →
            </Link>
          </p>
        </section>
      )}

      {/* Footer nav */}
      <nav className="mt-16 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-[13px]">
        {[
          { href: '/brawlers', label: 'Brawlers' },
          { href: '/tiers', label: 'Tier lists' },
          { href: '/maps', label: 'Maps' },
          { href: '/strats', label: 'My strats' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-white/25 hover:text-white/70 transition-colors duration-200"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
