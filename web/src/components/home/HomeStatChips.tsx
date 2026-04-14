interface HomeStatChipsProps {
  mapCount: number
  modeCount: number
  brawlerCount: number
  myStratCount: number | null
}

export function HomeStatChips({
  mapCount,
  modeCount,
  brawlerCount,
  myStratCount,
}: HomeStatChipsProps) {
  const stratLabel = myStratCount === null ? '—' : String(myStratCount)

  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {[
        { label: 'Maps', value: mapCount },
        { label: 'Modes', value: modeCount },
        { label: 'Brawlers', value: brawlerCount },
        { label: 'My strats', value: stratLabel },
      ].map((chip) => (
        <div
          key={chip.label}
          className="inline-flex items-baseline gap-2 rounded-xl border border-white/[0.08] bg-brand-surface px-3.5 py-2.5 md:px-4 md:py-3"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">
            {chip.label}
          </span>
          <span className="text-lg font-semibold tabular-nums text-white/90">{chip.value}</span>
        </div>
      ))}
    </div>
  )
}
