import Link from 'next/link'

const TILES: { href: string; title: string; blurb: string }[] = [
  { href: '/maps', title: 'Maps', blurb: 'Browse arenas & filters' },
  { href: '/brawlers', title: 'Brawlers', blurb: 'Roster & search' },
  { href: '/tiers', title: 'Tier lists', blurb: 'Personal rankings' },
  { href: '/strats', title: 'Strategies', blurb: 'Saved boards' },
  { href: '/profile', title: 'Profiles', blurb: 'Player lookup' },
  { href: '/account', title: 'Account', blurb: 'Sign in & settings' },
]

export function HomeNavTiles() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
      {TILES.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-brand-surface p-4 md:p-5 min-h-[108px] transition-colors duration-200 hover:border-brand-yellow/35 hover:bg-brand-yellow/[0.06] active:scale-[0.99]"
        >
          <span className="text-base md:text-lg font-semibold text-white group-hover:text-brand-yellow">
            {t.title}
          </span>
          <span className="mt-2 text-[12px] md:text-[13px] text-white/40 group-hover:text-white/55 leading-snug">
            {t.blurb}
          </span>
        </Link>
      ))}
    </div>
  )
}
