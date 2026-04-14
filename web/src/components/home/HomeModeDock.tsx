import Image from 'next/image'
import Link from 'next/link'

export interface ModeDockShortcut {
  label: string
  gameModeId: number
}

interface HomeModeDockProps {
  shortcuts: ModeDockShortcut[]
  /** When shortcuts are empty (e.g. name drift), still show a slim mode strip. */
  gameModesFallback: { id: number; name: string }[]
}

export function HomeModeDock({ shortcuts, gameModesFallback }: HomeModeDockProps) {
  const dockItems: ModeDockShortcut[] =
    shortcuts.length > 0
      ? shortcuts
      : gameModesFallback.slice(0, 10).map((m) => ({ label: m.name, gameModeId: m.id }))

  if (dockItems.length === 0) return null

  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/30">Modes</p>
          <h2 className="text-lg font-semibold text-white">Jump in</h2>
        </div>
        <Link href="/maps" className="text-[12px] text-brand-yellow/80 hover:text-brand-yellow shrink-0">
          All maps →
        </Link>
      </div>
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {dockItems.map((s) => (
          <Link
            key={s.gameModeId}
            href={`/maps?mode=${s.gameModeId}`}
            className="group flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-brand-surface px-3 py-3 w-[92px] md:w-[104px] transition-colors hover:border-brand-yellow/30 hover:bg-brand-yellow/[0.05]"
          >
            <div className="relative h-12 w-12 md:h-14 md:w-14">
              <Image
                src={`https://cdn.brawlify.com/game-modes/regular/${s.gameModeId}.png`}
                alt=""
                fill
                className="object-contain"
                sizes="56px"
              />
            </div>
            <span className="text-center text-[11px] font-medium leading-tight text-white/55 group-hover:text-brand-yellow/90 line-clamp-2">
              {s.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
