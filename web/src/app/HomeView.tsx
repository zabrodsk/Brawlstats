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
    <div className="p-6 md:p-10 max-w-3xl mx-auto min-h-full bg-brand-black text-white">
      <h1 className="text-3xl md:text-4xl font-bold text-brand-yellow tracking-tight">
        Brawl Strategy
      </h1>
      <p className="mt-3 text-gray-400 text-sm md:text-base max-w-xl">
        Browse maps, plan strats on the canvas, and keep personal tier lists — all in your browser.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/maps"
          className="inline-flex justify-center items-center px-5 py-3 rounded-lg bg-brand-yellow text-black font-semibold text-sm hover:bg-yellow-400 transition-colors"
        >
          Browse all maps
        </Link>
        <Link
          href="/strats"
          className="inline-flex justify-center items-center px-5 py-3 rounded-lg border border-gray-700 text-gray-200 font-medium text-sm hover:border-brand-yellow-muted hover:text-brand-yellow transition-colors"
        >
          My strategies
        </Link>
      </div>

      {shortcuts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Quick jump — popular modes
          </h2>
          <p className="text-xs text-gray-600 mb-4">
            Opens Maps filtered to that mode.{' '}
            <Link href="/maps" className="text-brand-yellow hover:underline">
              All game modes
            </Link>
          </p>
          <div className="flex flex-wrap gap-2">
            {shortcuts.map((s) => (
              <Link
                key={s.gameModeId}
                href={`/maps?mode=${s.gameModeId}`}
                className="inline-flex items-center px-3 py-2 rounded-lg bg-brand-surface border border-gray-800 text-sm text-gray-200 hover:border-brand-yellow-muted hover:text-brand-yellow transition-colors"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <nav className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap gap-4 text-sm">
        <Link href="/brawlers" className="text-gray-400 hover:text-brand-yellow transition-colors">
          Brawlers
        </Link>
        <Link href="/tiers" className="text-gray-400 hover:text-brand-yellow transition-colors">
          Tier lists
        </Link>
        <Link href="/maps" className="text-gray-400 hover:text-brand-yellow transition-colors">
          Maps
        </Link>
        <Link href="/strats" className="text-gray-400 hover:text-brand-yellow transition-colors">
          My strats
        </Link>
      </nav>
    </div>
  )
}
