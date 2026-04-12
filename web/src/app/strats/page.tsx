'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAllStrategies, deleteStrategy, duplicateStrategy } from '@/lib/storage'
import type { Strategy } from '@/types/strategy'
import type { BrawlerElement } from '@/types/strategy'

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

function getStrategyStats(strategy: Strategy) {
  const brawlers = strategy.elements.filter(
    (el): el is BrawlerElement => el.type === 'brawler'
  )
  const blueCount = brawlers.filter((b) => b.team === 'blue').length
  const redCount = brawlers.filter((b) => b.team === 'red').length
  const arrowCount = strategy.elements.filter((el) => el.type === 'arrow').length
  const zoneCount = strategy.elements.filter((el) => el.type === 'zone').length
  return { blueCount, redCount, arrowCount, zoneCount, totalElements: strategy.elements.length }
}

type SortKey = 'modified' | 'created' | 'title'
type ViewMode = 'grid' | 'list'

function StrategySkeleton() {
  return (
    <div className="rounded-xl bg-brand-surface border border-gray-800 overflow-hidden animate-pulse">
      <div className="w-full aspect-video bg-gray-800" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 w-3/4 bg-gray-700 rounded" />
        <div className="h-3 w-1/2 bg-gray-800 rounded" />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="rounded-xl bg-brand-surface border border-gray-800 p-4 animate-pulse flex items-center gap-4">
      <div className="w-20 h-14 bg-gray-800 rounded-lg shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-1/3 bg-gray-700 rounded" />
        <div className="h-3 w-1/4 bg-gray-800 rounded" />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-brand-surface border border-gray-800 rounded-xl px-4 py-3 flex flex-col gap-0.5 min-w-0">
      <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
      <span className="text-xs text-gray-500 truncate">{label}</span>
    </div>
  )
}

export default function StratsPage() {
  const router = useRouter()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortKey>('modified')
  const [view, setView] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAllStrategies()
      .then((all) => setStrategies(all))
      .finally(() => setLoading(false))
  }, [])

  const sorted = useMemo(() => {
    const searchLower = search.trim().toLowerCase()
    let list = [...strategies]

    if (searchLower) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(searchLower) ||
          s.gameMode.toLowerCase().includes(searchLower)
      )
    }

    list.sort((a, b) => {
      if (sortBy === 'modified') return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return a.title.localeCompare(b.title)
    })

    return list
  }, [strategies, sortBy, search])

  const dashboardStats = useMemo(() => {
    const modes = new Set(strategies.map((s) => s.gameMode).filter(Boolean))
    const maps = new Set(strategies.map((s) => s.mapId))
    const totalElements = strategies.reduce((sum, s) => sum + s.elements.length, 0)
    return { total: strategies.length, modes: modes.size, maps: maps.size, elements: totalElements }
  }, [strategies])

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
      router.push(`/strats/edit?id=${copy.id}`)
    } catch (e) {
      console.error(e)
    } finally {
      setDuplicatingId(null)
    }
  }

  const isEmpty = !loading && strategies.length === 0

  return (
    <div className="p-6 bg-brand-black min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Strategy Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Plan, organize, and refine your Brawl Stars strategies.
          </p>
        </div>
        <Link
          href="/maps"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-yellow text-black font-semibold text-sm hover:bg-yellow-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Strategy
        </Link>
      </div>

      {/* Dashboard Stats */}
      {!loading && strategies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Strategies" value={dashboardStats.total} />
          <StatCard label="Game Modes" value={dashboardStats.modes} />
          <StatCard label="Unique Maps" value={dashboardStats.maps} />
          <StatCard label="Canvas Elements" value={dashboardStats.elements} />
        </div>
      )}

      {/* Controls */}
      {!loading && strategies.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search strategies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-surface border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-brand-surface border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-yellow transition-colors cursor-pointer appearance-none"
            >
              <option value="modified">Last Modified</option>
              <option value="created">Date Created</option>
              <option value="title">Name A–Z</option>
            </select>

            {/* View toggle */}
            <div className="flex rounded-lg border border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`px-2.5 py-2 transition-colors ${
                  view === 'grid'
                    ? 'bg-brand-yellow/15 text-brand-yellow'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                aria-label="Grid view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={`px-2.5 py-2 transition-colors ${
                  view === 'list'
                    ? 'bg-brand-yellow/15 text-brand-yellow'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                aria-label="List view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StrategySkeleton key={i} />
          ))}
        </div>
      )}
      {loading && view === 'list' && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-brand-surface border border-gray-800 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">No strategies yet</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Pick a map and start planning your team composition and tactics.
          </p>
          <Link
            href="/maps"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-yellow text-black font-semibold text-sm hover:bg-yellow-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Browse Maps
          </Link>
        </div>
      )}

      {/* No search results */}
      {!loading && strategies.length > 0 && sorted.length === 0 && search && (
        <p className="text-gray-500 text-sm text-center mt-8">
          No strategies match &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Grid view */}
      {!loading && sorted.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map((strategy) => {
            const stats = getStrategyStats(strategy)
            return (
              <div
                key={strategy.id}
                className="group rounded-xl bg-brand-surface border border-gray-800 overflow-hidden hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-black/20"
              >
                {/* Thumbnail */}
                <Link href={`/strats/edit?id=${strategy.id}`} className="block relative w-full aspect-video bg-gray-900 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://cdn.brawlify.com/maps/regular/${strategy.mapId}.png`}
                    alt={strategy.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  {/* Overlay badge */}
                  {strategy.gameMode && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-medium text-brand-yellow border border-brand-yellow/20">
                      {strategy.gameMode}
                    </span>
                  )}
                </Link>

                {/* Card body */}
                <div className="p-3.5">
                  <Link href={`/strats/edit?id=${strategy.id}`} className="block group/link">
                    <h3 className="text-sm font-semibold text-white truncate group-hover/link:text-brand-yellow transition-colors">
                      {strategy.title}
                    </h3>
                  </Link>

                  {/* Element badges */}
                  <div className="flex items-center gap-2 mt-2">
                    {stats.blueCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-[10px] font-medium text-blue-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {stats.blueCount}
                      </span>
                    )}
                    {stats.redCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-[10px] font-medium text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {stats.redCount}
                      </span>
                    )}
                    {stats.arrowCount > 0 && (
                      <span className="text-[10px] text-gray-500">
                        {stats.arrowCount} arrow{stats.arrowCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {stats.zoneCount > 0 && (
                      <span className="text-[10px] text-gray-500">
                        {stats.zoneCount} zone{stats.zoneCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-xs text-gray-500">
                      {formatDate(strategy.modifiedAt)}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(strategy.id)}
                      disabled={duplicatingId === strategy.id || deletingId === strategy.id}
                      className="flex-1 text-xs font-medium text-brand-yellow hover:text-yellow-400 transition-colors py-1.5 rounded-lg border border-gray-700 hover:border-brand-yellow-muted disabled:opacity-50"
                    >
                      {duplicatingId === strategy.id ? 'Duplicating…' : 'Duplicate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(strategy.id, strategy.title)}
                      disabled={deletingId === strategy.id || duplicatingId === strategy.id}
                      className="flex-1 text-xs text-gray-500 hover:text-red-400 transition-colors py-1.5 rounded-lg hover:bg-red-900/20 disabled:opacity-50"
                    >
                      {deletingId === strategy.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List view */}
      {!loading && sorted.length > 0 && view === 'list' && (
        <div className="flex flex-col gap-2">
          {sorted.map((strategy) => {
            const stats = getStrategyStats(strategy)
            return (
              <div
                key={strategy.id}
                className="group rounded-xl bg-brand-surface border border-gray-800 overflow-hidden hover:border-gray-600 transition-all flex items-stretch"
              >
                {/* Thumbnail */}
                <Link href={`/strats/edit?id=${strategy.id}`} className="block relative w-28 sm:w-36 shrink-0 bg-gray-900 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://cdn.brawlify.com/maps/regular/${strategy.mapId}.png`}
                    alt={strategy.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center gap-1.5">
                  <div className="flex items-center gap-2">
                    <Link href={`/strats/edit?id=${strategy.id}`} className="group/link min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate group-hover/link:text-brand-yellow transition-colors">
                        {strategy.title}
                      </h3>
                    </Link>
                    {strategy.gameMode && (
                      <span className="shrink-0 px-2 py-0.5 rounded-md bg-brand-yellow/10 text-[10px] font-medium text-brand-yellow">
                        {strategy.gameMode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{formatDate(strategy.modifiedAt)}</span>
                    <span>{stats.totalElements} element{stats.totalElements !== 1 ? 's' : ''}</span>
                    {stats.blueCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-blue-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {stats.blueCount}
                      </span>
                    )}
                    {stats.redCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {stats.redCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 px-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDuplicate(strategy.id)}
                    disabled={duplicatingId === strategy.id || deletingId === strategy.id}
                    className="text-xs font-medium text-brand-yellow hover:text-yellow-400 transition-colors px-3 py-1.5 rounded-lg border border-gray-700 hover:border-brand-yellow-muted disabled:opacity-50"
                  >
                    {duplicatingId === strategy.id ? '…' : 'Duplicate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(strategy.id, strategy.title)}
                    disabled={deletingId === strategy.id || duplicatingId === strategy.id}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-900/20 disabled:opacity-50"
                  >
                    {deletingId === strategy.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
