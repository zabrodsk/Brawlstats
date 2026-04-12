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
    <div className="rounded-lg bg-brand-surface border border-gray-800 overflow-hidden animate-pulse">
      <div className="w-full aspect-video bg-gray-700" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 w-3/4 bg-gray-700 rounded" />
        <div className="h-3 w-1/2 bg-gray-800 rounded" />
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
        // Sort newest first (modifiedAt descending)
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
    <div className="min-h-full bg-brand-black px-6 py-6">
      <section className="rounded-xl border border-gray-800 bg-[#11161C] p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Strategy Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-white">My Strategies</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Track your playbook, refine compositions, and jump back into strategy editing fast.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/maps"
              className="inline-flex items-center rounded-lg bg-brand-yellow px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-yellow-400"
            >
              + New Strategy
            </Link>
            <Link
              href="/maps"
              className="inline-flex items-center rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-gray-500 hover:text-white"
            >
              Browse Maps
            </Link>
          </div>
        </div>

        {!loading && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-800 bg-brand-surface px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Total strategies</p>
              <p className="mt-1 text-2xl font-semibold text-white">{dashboardStats.total}</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-brand-surface px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Game modes covered</p>
              <p className="mt-1 text-2xl font-semibold text-white">{dashboardStats.modes}</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-brand-surface px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Updated this week</p>
              <p className="mt-1 text-2xl font-semibold text-white">{dashboardStats.updatedThisWeek}</p>
            </div>
          </div>
        )}
      </section>

      {!loading && !isEmpty && (
        <section className="mt-5 rounded-xl border border-gray-800 bg-brand-surface p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-sm">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or mode..."
                className="w-full rounded-lg border border-gray-700 bg-brand-black py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="rounded-lg border border-gray-700 bg-brand-black px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-yellow md:w-56"
            >
              <option value="all">All modes</option>
              {modeOptions.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setModeFilter('all')
                }}
                className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <StrategySkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-brand-surface py-16 text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">No strategies yet</h2>
          <p className="mb-6 max-w-sm text-sm text-gray-500">
            Build your first strategy board from a map and start saving team plans.
          </p>
          <Link
            href="/maps"
            className="rounded-lg bg-brand-yellow px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-yellow-400"
          >
            Create Strategy
          </Link>
        </div>
      )}

      {noFilterResults && (
        <div className="mt-6 rounded-xl border border-gray-800 bg-brand-surface p-8 text-center">
          <p className="text-sm text-gray-400">No strategies match your current filters.</p>
        </div>
      )}

      {/* Strategy grid */}
      {!loading && filteredStrategies.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredStrategies.map((strategy) => (
            <div
              key={strategy.id}
              className="group rounded-lg bg-brand-surface border border-gray-800 overflow-hidden hover:border-gray-600 transition-colors"
            >
              {/* Thumbnail */}
              <Link href={`/strats/${strategy.id}`} className="block relative w-full aspect-video bg-gray-900">
                <Image
                  src={`https://cdn.brawlify.com/maps/regular/${strategy.mapId}.png`}
                  alt={strategy.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  onError={(e) => {
                    // Hide broken image, show fallback bg
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </Link>

              {/* Card body */}
              <div className="p-3">
                <Link href={`/strats/${strategy.id}`} className="block group/link">
                  <h3 className="text-sm font-semibold text-white truncate group-hover/link:text-yellow-400 transition-colors">
                    {strategy.title}
                  </h3>
                </Link>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400 truncate max-w-[60%]">
                    {strategy.gameMode}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">
                    {formatDate(strategy.modifiedAt)}
                  </span>
                </div>

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDuplicate(strategy.id)}
                    disabled={duplicatingId === strategy.id || deletingId === strategy.id}
                    className="flex-1 text-xs font-medium text-brand-yellow hover:text-yellow-400 transition-colors py-1 rounded border border-gray-700 hover:border-brand-yellow-muted disabled:opacity-50"
                  >
                    {duplicatingId === strategy.id ? 'Duplicating…' : 'Duplicate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(strategy.id, strategy.title)}
                    disabled={deletingId === strategy.id || duplicatingId === strategy.id}
                    className="flex-1 text-xs text-gray-500 hover:text-red-400 transition-colors py-1 rounded hover:bg-red-900/20 disabled:opacity-50"
                  >
                    {deletingId === strategy.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
