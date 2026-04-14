import Image from 'next/image'
import Link from 'next/link'

export interface HomeRotationCardItem {
  rowKey: string
  mapId: string | null
  mapName: string
  mode: string
}

interface HomeRotationCardsProps {
  items: HomeRotationCardItem[]
  rotationError: string | null
}

export function HomeRotationCards({ items, rotationError }: HomeRotationCardsProps) {
  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/30">Live now</p>
          <h2 className="text-xl font-semibold text-white">Map rotation</h2>
        </div>
        <Link href="/maps" className="text-[12px] text-brand-yellow/80 hover:text-brand-yellow shrink-0">
          See all maps →
        </Link>
      </div>
      {rotationError && (
        <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200/90">
          {rotationError}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((row) => (
          <div
            key={row.rowKey}
            className="flex overflow-hidden rounded-2xl border border-white/[0.08] bg-brand-surface hover:border-brand-yellow/30 transition-colors"
          >
            {row.mapId ? (
              <Link
                href={`/maps?mapId=${encodeURIComponent(row.mapId)}`}
                className="relative block h-24 w-28 shrink-0 bg-black/40"
              >
                <Image
                  src={`https://cdn.brawlify.com/maps/regular/${row.mapId}.png`}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </Link>
            ) : (
              <div className="h-24 w-28 shrink-0 bg-white/[0.04]" />
            )}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2">
              <p className="text-[13px] font-medium text-white/90 truncate">{row.mapName}</p>
              <p className="text-[12px] text-white/40">{row.mode}</p>
              {row.mapId ? (
                <Link
                  href={`/strats/new?mapId=${encodeURIComponent(row.mapId)}&mode=${encodeURIComponent(row.mode)}`}
                  className="text-[12px] font-medium text-brand-yellow/85 hover:text-brand-yellow w-fit"
                >
                  New strat
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && !rotationError && (
        <p className="text-[13px] text-white/35 mt-2">No rotation slots available yet.</p>
      )}
    </section>
  )
}
