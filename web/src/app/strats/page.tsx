'use client'

import { useState, useEffect } from 'react'
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

  const isEmpty = !loading && strategies.length === 0

  return (
    <div className="p-6 bg-brand-black min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-white">My Strategies</h1>
          <p className="text-gray-400 mt-1">Create and manage your Brawl Stars strategies.</p>
        </div>
        <Link
          href="/maps"
          className="shrink-0 px-4 py-2 rounded-lg bg-brand-yellow text-black font-semibold text-sm hover:bg-yellow-400 transition-colors"
        >
          + Create New
        </Link>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <StrategySkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">No strategies yet</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Head to a map and tap &quot;Create Strategy&quot; to start planning.
          </p>
          <Link
            href="/maps"
            className="px-5 py-2.5 rounded-lg bg-brand-yellow text-black font-semibold text-sm hover:bg-yellow-400 transition-colors"
          >
            Browse Maps
          </Link>
        </div>
      )}

      {/* Strategy grid */}
      {!loading && strategies.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {strategies.map((strategy) => (
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
