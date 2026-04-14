import Image from 'next/image'
import Link from 'next/link'

interface HomeBrawlerStripProps {
  brawlerIds: number[]
}

export function HomeBrawlerStrip({ brawlerIds }: HomeBrawlerStripProps) {
  if (brawlerIds.length === 0) return null

  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/30">Today&apos;s picks</p>
          <h2 className="text-lg font-semibold text-white">Spotlight brawlers</h2>
        </div>
        <Link href="/brawlers" className="text-[12px] text-brand-yellow/80 hover:text-brand-yellow shrink-0">
          All brawlers →
        </Link>
      </div>
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {brawlerIds.map((id) => (
          <Link
            key={id}
            href="/brawlers"
            className="relative shrink-0 h-[72px] w-[72px] md:h-20 md:w-20 rounded-xl overflow-hidden bg-brand-surface border border-white/[0.06] hover:border-brand-yellow/40 transition-colors"
          >
            <Image
              src={`https://cdn.brawlify.com/brawlers/borderless/${id}.png`}
              alt=""
              fill
              className="object-contain object-bottom scale-110"
              sizes="80px"
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
