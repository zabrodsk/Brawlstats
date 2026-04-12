'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { fetchMaps, fetchGameModes } from '@/lib/brawlify'
import type { GameMap, GameMode } from '@/types/map'

function MapCardSkeleton() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-white/[0.05] overflow-hidden animate-pulse shadow-card">
      <div className="aspect-square bg-white/[0.05] w-full" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-2.5 bg-white/[0.07] rounded-full w-3/4" />
        <div className="h-7 bg-white/[0.04] rounded-lg w-full" />
      </div>
    </div>
  )
}

function GameModeSkeleton() {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4 animate-pulse">
        <div className="w-7 h-7 bg-white/[0.07] rounded-full" />
        <div className="h-4 bg-white/[0.07] rounded-full w-28" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <MapCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function MapsPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [maps, setMaps] = useState<GameMap[]>([])
  const [gameModes, setGameModes] = useState<GameMode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState<number | 'all'>('all')

  useEffect(() => {
    let cancelled = false

    fetchMaps()
      .then((m) => {
        if (!cancelled) setMaps(m)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Failed to load maps')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    fetchGameModes()
      .then((gm) => {
        if (!cancelled) setGameModes(gm)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  const gameModeById = useMemo(() => new Map(gameModes.map((gm) => [gm.id, gm])), [gameModes])

  const mapsByMode = useMemo(() => {
    return maps.reduce<Map<number, GameMap[]>>((acc, map) => {
      const list = acc.get(map.gameModeId) ?? []
      list.push(map)
      acc.set(map.gameModeId, list)
      return acc
    }, new Map())
  }, [maps])

  const sortedModeIds = useMemo(() => {
    return Array.from(mapsByMode.keys()).sort(
      (a, b) => (mapsByMode.get(b)?.length ?? 0) - (mapsByMode.get(a)?.length ?? 0)
    )
  }, [mapsByMode])

  const validModeIds = useMemo(() => new Set(sortedModeIds), [sortedModeIds])

  useEffect(() => {
    if (loading || maps.length === 0) return
    const raw = searchParams.get('mode')
    if (raw == null || raw === '') {
      setModeFilter('all')
      return
    }
    const id = parseInt(raw, 10)
    if (!Number.isFinite(id) || !validModeIds.has(id)) {
      setModeFilter('all')
      return
    }
    setModeFilter(id)
  }, [loading, maps.length, searchParams, validModeIds])

  useEffect(() => {
    if (loading || modeFilter === 'all') return
    const el = document.getElementById(`mode-${modeFilter}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loading, modeFilter, maps.length])

  const setModeAndUrl = (next: number | 'all') => {
    setModeFilter(next)
    if (next === 'all') {
      router.replace('/maps', { scroll: false })
    } else {
      router.replace(`/maps?mode=${next}`, { scroll: false })
    }
  }

  const searchLower = search.trim().toLowerCase()
  const filterMapName = (map: GameMap) =>
    searchLower === '' || map.name.toLowerCase().includes(searchLower)

  const displayModeIds =
    modeFilter === 'all' ? sortedModeIds : validModeIds.has(modeFilter) ? [modeFilter] : sortedModeIds

  return (
    <div className="px-5 py-6 md:px-8 md:py-8 bg-brand-black min-h-full">

      {/* Page header */}
      <div className="mb-7 animate-fade-up">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/25">
          Brawl Stars
        </span>
        <h1 className="mt-1.5 text-2xl md:text-3xl font-bold tracking-[-0.02em] text-white">Maps</h1>
        <p className="mt-1.5 text-[14px] text-white/35">Browse maps and start building strategies.</p>
      </div>

      {/* Filters */}
      {!loading && sortedModeIds.length > 0 && (
        <div className="mb-7 space-y-3 animate-fade-up-delay-1">
          {/* Search */}
          <div className="relative max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search maps…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-surface border border-white/[0.07] rounded-lg pl-8 pr-4 py-2 text-[13px] text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-brand-yellow/40"
            />
          </div>

          {/* Mode filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setModeAndUrl('all')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                modeFilter === 'all'
                  ? 'bg-brand-yellow/10 border-brand-yellow/40 text-brand-yellow'
                  : 'border-white/[0.08] text-white/35 hover:border-white/20 hover:text-white/70'
              }`}
            >
              All modes
            </button>
            {sortedModeIds.map((modeId) => {
              const mode = gameModeById.get(modeId)
              const modeName = mode?.name ?? mapsByMode.get(modeId)?.[0]?.gameModeName ?? 'Mode'
              const isActive = modeFilter === modeId
              return (
                <button
                  key={modeId}
                  type="button"
                  onClick={() => setModeAndUrl(modeId)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] max-w-[9rem] truncate ${
                    isActive
                      ? 'bg-brand-yellow/10 border-brand-yellow/40 text-brand-yellow'
                      : 'border-white/[0.08] text-white/35 hover:border-white/20 hover:text-white/70'
                  }`}
                  title={modeName}
                >
                  {modeName}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-red-400/80 bg-red-900/10 border border-red-900/30 rounded-xl p-4 mb-6 text-[13px]">
          {error}
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <>
          <GameModeSkeleton />
          <GameModeSkeleton />
        </>
      )}

      {/* Map sections */}
      {!loading &&
        displayModeIds.map((modeId) => {
          const mode = gameModeById.get(modeId)
          let modeMaps = mapsByMode.get(modeId) ?? []
          modeMaps = modeMaps.filter(filterMapName)
          if (modeMaps.length === 0) return null

          const modeName = mode?.name ?? modeMaps[0]?.gameModeName ?? 'Unknown'
          const modeIconUrl = `https://cdn.brawlify.com/game-modes/regular/${modeId}.png`

          return (
            <section
              key={modeId}
              id={`mode-${modeId}`}
              className="mb-10 scroll-mt-6"
              style={{
                contentVisibility: 'auto',
                containIntrinsicSize: 'auto 520px',
              }}
            >
              {/* Section header */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="relative w-6 h-6 flex-shrink-0 opacity-80">
                  <Image
                    src={modeIconUrl}
                    alt={modeName}
                    fill
                    className="object-contain"
                    sizes="24px"
                  />
                </div>
                <h2 className="text-[15px] font-semibold text-white/80">{modeName}</h2>
                <span className="text-[11px] text-white/25 ml-0.5">{modeMaps.length}</span>
                <div className="flex-1 h-px bg-white/[0.05] ml-1" />
              </div>

              {/* Map grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {modeMaps.map((map) => (
                  <div
                    key={map.id}
                    className="group"
                  >
                    {/* Double-bezel outer shell */}
                    <div className="p-[1px] rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:from-brand-yellow/15 group-hover:to-brand-yellow/5 shadow-card">
                      <div className="rounded-[calc(1rem-1px)] bg-brand-surface overflow-hidden flex flex-col shadow-inner-highlight">

                        {/* Map image */}
                        <div className="relative aspect-square w-full bg-brand-black overflow-hidden">
                          <Image
                            src={`https://cdn.brawlify.com/maps/regular/${map.id}.png`}
                            alt={map.name}
                            fill
                            className="object-cover transition-transform duration-600 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                            sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 18vw"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>

                        {/* Card body */}
                        <div className="p-3 flex flex-col gap-2 flex-1">
                          <span className="text-[12px] font-medium text-white/70 leading-tight line-clamp-2">
                            {map.name}
                          </span>
                          {/* Strategize CTA — pill button */}
                          <Link
                            href={`/strats/new?mapId=${map.id}&mode=${encodeURIComponent(modeName)}`}
                            className="mt-auto flex items-center justify-between rounded-full bg-brand-yellow/[0.08] border border-brand-yellow/20 pl-3 pr-1 py-1 text-[11px] font-semibold text-brand-yellow/80 transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-yellow hover:text-black hover:border-brand-yellow active:scale-[0.97] group/cta"
                          >
                            Strategize
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-yellow/10 group-hover/cta:bg-black/10 transition-colors">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </Link>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

      {!loading && maps.length === 0 && !error && (
        <p className="text-white/25 text-[13px] text-center mt-20">No maps found.</p>
      )}

      {!loading &&
        maps.length > 0 &&
        displayModeIds.every((id) => (mapsByMode.get(id) ?? []).filter(filterMapName).length === 0) && (
          <p className="text-white/25 text-[13px] text-center mt-12">No maps match your search.</p>
        )}
    </div>
  )
}

export default function MapsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-5 py-6 md:px-8 bg-brand-black min-h-full">
          <div className="mb-7">
            <div className="h-3 w-20 bg-white/[0.05] rounded-full mb-2 animate-pulse" />
            <div className="h-7 w-24 bg-white/[0.07] rounded-full animate-pulse" />
          </div>
          <GameModeSkeleton />
        </div>
      }
    >
      <MapsPageInner />
    </Suspense>
  )
}
