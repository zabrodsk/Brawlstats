'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { fetchMaps, fetchGameModes } from '@/lib/brawlify'
import type { GameMap, GameMode } from '@/types/map'

function MapCardSkeleton() {
  return (
    <div className="rounded-lg bg-brand-surface border border-gray-800 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-700 w-full" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 bg-gray-700 rounded w-3/4" />
        <div className="h-7 bg-gray-800 rounded w-full" />
      </div>
    </div>
  )
}

function GameModeSkeleton() {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4 animate-pulse">
        <div className="w-8 h-8 bg-gray-700 rounded-full" />
        <div className="h-5 bg-gray-700 rounded w-32" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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

  // Sync ?mode= from URL when maps are known
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

  // Scroll to section when deep-linking
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
    <div className="p-6 bg-brand-black min-h-full">
      <h1 className="text-2xl font-bold text-white mb-1">Maps</h1>
      <p className="text-gray-400 mb-5">Browse Brawl Stars maps and plan strategies.</p>

      {!loading && sortedModeIds.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="relative max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search maps by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-surface border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              type="button"
              onClick={() => setModeAndUrl('all')}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                modeFilter === 'all'
                  ? 'bg-brand-yellow/15 border-brand-yellow text-brand-yellow'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              All
            </button>
            {sortedModeIds.map((modeId) => {
              const mode = gameModeById.get(modeId)
              const modeName = mode?.name ?? mapsByMode.get(modeId)?.[0]?.gameModeName ?? 'Mode'
              return (
                <button
                  key={modeId}
                  type="button"
                  onClick={() => setModeAndUrl(modeId)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors max-w-[10rem] truncate ${
                    modeFilter === modeId
                      ? 'bg-brand-yellow/15 border-brand-yellow text-brand-yellow'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
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

      {error && (
        <div className="text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <>
          <GameModeSkeleton />
          <GameModeSkeleton />
        </>
      )}

      {!loading &&
        displayModeIds.map((modeId) => {
          const mode = gameModeById.get(modeId)
          let modeMaps = mapsByMode.get(modeId) ?? []
          modeMaps = modeMaps.filter(filterMapName)
          if (modeMaps.length === 0) return null

          const modeName = mode?.name ?? modeMaps[0]?.gameModeName ?? 'Unknown'
          // CDN serves game-modes/regular/{id}.png (numeric id), not the slug hash.
          const modeIconUrl = `https://cdn.brawlify.com/game-modes/regular/${modeId}.png`

          return (
            <section
              key={modeId}
              id={`mode-${modeId}`}
              className="mb-10 scroll-mt-4"
              style={{
                contentVisibility: 'auto',
                containIntrinsicSize: 'auto 520px',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                {modeIconUrl && (
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <Image
                      src={modeIconUrl}
                      alt={modeName}
                      fill
                      className="object-contain"
                      sizes="32px"
                    />
                  </div>
                )}
                <h2 className="text-lg font-semibold text-white">{modeName}</h2>
                <span className="text-xs text-gray-500 ml-1">{modeMaps.length} maps</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {modeMaps.map((map) => (
                  <div
                    key={map.id}
                    className="rounded-lg bg-brand-surface border border-gray-800 overflow-hidden flex flex-col hover:border-gray-600 transition-colors"
                  >
                    <div className="relative aspect-square w-full bg-gray-900">
                      <Image
                        src={`https://cdn.brawlify.com/maps/regular/${map.id}.png`}
                        alt={map.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 18vw"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    <div className="p-3 flex flex-col gap-2 flex-1">
                      <span className="text-xs font-medium text-white leading-tight line-clamp-2">
                        {map.name}
                      </span>
                      <Link
                        href={`/strats/new?mapId=${map.id}&mode=${encodeURIComponent(modeName)}`}
                        className="mt-auto text-center text-xs font-semibold bg-brand-yellow hover:bg-yellow-400 text-black rounded px-2 py-1.5 transition-colors"
                      >
                        Strategize
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

      {!loading && maps.length === 0 && !error && (
        <p className="text-gray-500 text-sm text-center mt-16">No maps found.</p>
      )}

      {!loading &&
        maps.length > 0 &&
        displayModeIds.every((id) => (mapsByMode.get(id) ?? []).filter(filterMapName).length === 0) && (
          <p className="text-gray-500 text-sm text-center mt-8">No maps match your search.</p>
        )}
    </div>
  )
}

export default function MapsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 bg-brand-black min-h-full">
          <h1 className="text-2xl font-bold text-white mb-1">Maps</h1>
          <p className="text-gray-400 mb-8">Browse Brawl Stars maps and plan strategies.</p>
          <GameModeSkeleton />
        </div>
      }
    >
      <MapsPageInner />
    </Suspense>
  )
}
