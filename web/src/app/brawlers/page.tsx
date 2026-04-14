'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { fetchBrawlers } from '@/lib/brawlify'
import type { Brawler } from '@/types/brawler'

const RARITY_COLORS: Record<string, string> = {
  'Trophy Road': 'text-gray-400',
  'Rare': 'text-green-400',
  'Super Rare': 'text-blue-400',
  'Epic': 'text-purple-400',
  'Mythic': 'text-red-400',
  'Legendary': 'text-yellow-400',
  'Chromatic': 'text-orange-400',
}

function BrawlerSkeleton() {
  return (
    <div className="rounded-lg bg-[#161B22] border border-gray-800 p-3 flex flex-col items-center gap-2 animate-pulse">
      <div className="w-16 h-16 bg-gray-700 rounded-full" />
      <div className="h-3 w-16 bg-gray-700 rounded" />
      <div className="h-2 w-12 bg-gray-800 rounded" />
    </div>
  )
}

export default function BrawlersPage() {
  const [brawlers, setBrawlers] = useState<Brawler[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBrawlers()
      .then(setBrawlers)
      .catch((err) => setError(err.message ?? 'Failed to load brawlers'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = brawlers.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 bg-[#0D1117] min-h-full">
      <h1 className="text-2xl font-bold text-white mb-1">Brawlers</h1>
      <p className="text-gray-400 mb-5">Browse all Brawl Stars brawlers.</p>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search brawlers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-brand-surface border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
        {loading
          ? Array.from({ length: 24 }).map((_, i) => <BrawlerSkeleton key={i} />)
          : filtered.map((brawler) => (
              <div
                key={brawler.id}
                id={`brawler-${brawler.id}`}
                className="rounded-lg bg-[#161B22] border border-gray-800 p-3 flex flex-col items-center gap-1.5 hover:border-gray-600 transition-colors scroll-mt-24"
              >
                <div className="relative w-16 h-16">
                  <Image
                    src={`https://cdn.brawlify.com/brawlers/borderless/${brawler.id}.png`}
                    alt={brawler.name}
                    fill
                    className="object-contain"
                    sizes="64px"
                  />
                </div>
                <span className="text-xs font-medium text-white text-center leading-tight">
                  {brawler.name}
                </span>
                <span className={`text-[10px] ${RARITY_COLORS[brawler.rarity] ?? 'text-gray-400'}`}>
                  {brawler.rarity}
                </span>
              </div>
            ))}
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && search && (
        <p className="text-gray-500 text-sm mt-8 text-center">
          No brawlers found for &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  )
}
