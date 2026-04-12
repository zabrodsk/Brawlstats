'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getAllStrategies, deleteStrategy, duplicateStrategy } from '@/lib/storage'
import type { Strategy } from '@/types/strategy'

function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function StrategySkeleton() {
  return (
    <div className="rounded-2xl bg-brand-surface border border-white/[0.06] overflow-hidden animate-pulse shadow-card">
      <div className="w-full aspect-video bg-white/[0.05]" />
      <div className="p-3.5 flex flex-col gap-2">
        <div className="h-3.5 w-3/4 bg-white/[0.07] rounded-full" />
        <div className="h-2.5 w-1/2 bg-white/[0.04] rounded-full" />
      </div>
    </div>
  )
}

export default function StratsPage() {
  const router = useRouter()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState<string>('all')

  useEffect(() => {
    getAllStrategies()
      .then((all) => {
        const sorted = [...all].sort(
          (a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
        )
        setStrategies(sorted)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await deleteStrategy(id)
      setStrategies((prev) => prev.filter((s) => s.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id)
    try {
      const copy = await duplicateStrategy(id)
      router.push(`/strats/${copy.id}`)
    } catch (e) {
      console.error(e)
    } finally {
      setDuplicatingId(null)
    }
  }

  const modeOptions = useMemo(() => {
    const modeSet = new Set(strategies.map((s) => s.gameMode).filter(Boolean))
    return Array.from(modeSet).sort((a, b) => a.localeCompare(b))
  }, [strategies])

  const filteredStrategies = useMemo(() => {
    const q = search.trim().toLowerCase()
    return strategies.filter((strategy) => {
      const matchesSearch =
        q.length === 0 ||
        strategy.title.toLowerCase().includes(q) ||
        strategy.gameMode.toLowerCase().includes(q)
      const matchesMode = modeFilter === 'all' || strategy.gameMode === modeFilter
      return matchesSearch && matchesMode
    })
  }, [modeFilter, search, strategies])

  const dashboardStats = useMemo(() => {
    const total = strategies.length
    const modes = new Set(strategies.map((s) => s.gameMode).filter(Boolean)).size
    const now = Date.now()
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const updatedThisWeek = strategies.filter(
      (s) => now - new Date(s.modifiedAt).getTime() <= weekMs
    ).length
    return { total, modes, updatedThisWeek }
  }, [strategies])

  const isEmpty = !loading && strategies.length === 0
  const hasFilters = search.trim().length > 0 || modeFilter !== 'all'
  const noFilterResults = !loading && !isEmpty && filteredStrategies.length === 0

  return (
    <div className="min-h-full bg-brand-black px-5 py-6 md:px-8 md:py-8">

      {/* Header section — Double-Bezel outer shell */}
      <section className="p-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] animate-fade-up">
        <div className="rounded-[calc(1rem-1px)] bg-brand-surface-2 p-5 md:p-6 shadow-inner-highlight">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/25">
                Strategy Dashboard
              </span>
              <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-[-0.02em] text-white">
                My strategies
              </h1>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-white/35">
                Track your playbook, refine compositions, and jump back into strategy editing fast.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {/* Primary CTA */}
              <Link
                href="/maps"
                className="group inline-flex items-center gap-2.5 rounded-full bg-brand-yellow pl-4 pr-1.5 py-1.5 text-sm font-semibold text-black transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-yellow-400 active:scale-[0.98]"
              >
                New strategy
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black/10 group-hover:translate-x-0.5 group-hover:-translate-y-[1px] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </Link>
              <Link
                href="/maps"
                className="inline-flex items-center rounded-full border border-white/[0.1] px-4 py-2 text-sm font-medium text-white/50 transition-all duration-250 hover:border-white/20 hover:text-white/80 hover:bg-white/[0.04] active:scale-[0.98]"
              >
                Browse maps
              </Link>
            </div>
          </div>

          {/* Stat cards */}
          {!loading && (
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {[
                { label: 'Total strategies', value: dashboardStats.total },
                { label: 'Game modes covered', value: dashboardStats.modes },
                { label: 'Updated this week', value: dashboardStats.updatedThisWeek },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`rounded-xl border border-white/[0.06] bg-brand-black/60 px-4 py-3.5 shadow-inner-highlight animate-fade-up`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/25">{stat.label}</p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-tight text-white tabular-nums">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Filter bar */}
      {!loading && !isEmpty && (
        <section className="mt-4 p-[1px] rounded-xl bg-white/[0.04] animate-fade-up-delay-1">
          <div className="rounded-[calc(0.75rem-1px)] bg-brand-surface px-4 py-3">
            <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
              {/* Search */}
              <div className="relative w-full md:max-w-xs">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search strategies…"
                  className="w-full rounded-lg border border-white/[0.07] bg-brand-black/60 py-2 pl-8 pr-3 text-[13px] text-white placeholder-white/20 transition-all duration-200 focus:outline-none focus:border-brand-yellow/40 focus:bg-brand-black"
                />
              </div>

              {/* Mode select */}
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="rounded-lg border border-white/[0.07] bg-brand-black/60 px-3 py-2 text-[13px] text-white/60 transition-all duration-200 focus:outline-none focus:border-brand-yellow/40 md:w-48"
              >
                <option value="all">All modes</option>
                {modeOptions.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>

              {hasFilters && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setModeFilter('all') }}
                  className="text-[13px] text-white/30 transition-colors hover:text-white/70"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <StrategySkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="mt-5 p-[1px] rounded-2xl bg-white/[0.04]">
          <div className="rounded-[calc(1rem-1px)] bg-brand-surface flex flex-col items-center justify-center py-20 text-center shadow-inner-highlight">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl border border-white/[0.06] bg-brand-black/60 mb-5 text-3xl">
              🗺️
            </div>
            <h2 className="text-base font-semibold text-white/80 mb-1.5">No strategies yet</h2>
            <p className="mb-7 max-w-xs text-[13px] leading-relaxed text-white/35">
              Build your first strategy board from a map and save your team plans.
            </p>
            <Link
              href="/maps"
              className="group inline-flex items-center gap-2.5 rounded-full bg-brand-yellow pl-5 pr-2 py-2 text-sm font-semibold text-black transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-yellow-400 active:scale-[0.98]"
            >
              Create a strategy
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black/10 group-hover:translate-x-0.5 transition-transform duration-300">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* No results */}
      {noFilterResults && (
        <div className="mt-5 rounded-xl border border-white/[0.05] bg-brand-surface p-8 text-center">
          <p className="text-[13px] text-white/30">No strategies match your filters.</p>
        </div>
      )}

      {/* Strategy grid */}
      {!loading && filteredStrategies.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredStrategies.map((strategy, i) => (
            <div
              key={strategy.id}
              className="group animate-fade-up"
              style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
            >
              {/* Double-bezel outer shell */}
              <div className="p-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:from-brand-yellow/20 group-hover:to-brand-yellow/5 shadow-card">
                <div className="rounded-[calc(1rem-1px)] bg-brand-surface overflow-hidden shadow-inner-highlight">

                  {/* Thumbnail */}
                  <Link href={`/strats/${strategy.id}`} className="block relative w-full aspect-video bg-brand-black overflow-hidden">
                    <Image
                      src={`https://cdn.brawlify.com/maps/regular/${strategy.mapId}.png`}
                      alt={strategy.title}
                      fill
                      className="object-cover transition-transform duration-600 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </Link>

                  {/* Card body */}
                  <div className="p-3.5">
                    <Link href={`/strats/${strategy.id}`} className="block">
                      <h3 className="text-[13px] font-semibold text-white/80 truncate transition-colors duration-200 group-hover:text-brand-yellow leading-snug">
                        {strategy.title}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-white/30 truncate max-w-[60%]">
                        {strategy.gameMode}
                      </span>
                      <span className="text-[11px] text-white/20 shrink-0 ml-2">
                        {formatDate(strategy.modifiedAt)}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-2 border-t border-white/[0.05] pt-3">
                      <button
                        type="button"
                        onClick={() => handleDuplicate(strategy.id)}
                        disabled={duplicatingId === strategy.id || deletingId === strategy.id}
                        className="flex-1 text-[12px] font-medium text-brand-yellow/60 hover:text-brand-yellow transition-colors duration-200 py-1 rounded-lg border border-white/[0.06] hover:border-brand-yellow/30 hover:bg-brand-yellow/[0.06] disabled:opacity-40"
                      >
                        {duplicatingId === strategy.id ? 'Copying…' : 'Duplicate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(strategy.id, strategy.title)}
                        disabled={deletingId === strategy.id || duplicatingId === strategy.id}
                        className="flex-1 text-[12px] text-white/25 hover:text-red-400 transition-colors duration-200 py-1 rounded-lg hover:bg-red-900/20 disabled:opacity-40"
                      >
                        {deletingId === strategy.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
