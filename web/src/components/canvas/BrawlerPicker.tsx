'use client'

import React, { useEffect, useState, useRef } from 'react'
import { fetchBrawlers } from '@/lib/brawlify'
import type { Brawler } from '@/types/brawler'
import type { BrawlerElement } from '@/types/strategy'

// CDN URL for brawler icons — using borderless variant
function brawlerIconURL(id: number) {
  return `https://cdn.brawlify.com/brawlers/borderless/${id}.png`
}

export interface BrawlerPickerProps {
  /** Currently placed brawlers on the canvas */
  placedBrawlers: BrawlerElement[]
  /** Called when user picks a brawler to place */
  onPlace: (brawler: Brawler, team: 'blue' | 'red') => void
  /** Whether the panel is visible (mobile bottom sheet open) */
  isOpen: boolean
  onClose: () => void
}

export default function BrawlerPicker({
  placedBrawlers,
  onPlace,
  isOpen,
  onClose,
}: BrawlerPickerProps) {
  const [brawlers, setBrawlers] = useState<Brawler[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTeam, setActiveTeam] = useState<'blue' | 'red'>('blue')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchBrawlers()
      .then(setBrawlers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Focus search when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const filtered = brawlers.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  const placedIds = new Set(placedBrawlers.map((pb) => pb.brawlerId))

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <h2 className="text-sm font-semibold text-gray-200">Place Brawler</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-200 transition-colors text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Team toggle */}
      <div className="flex gap-2 px-4 pb-3 shrink-0">
        <button
          onClick={() => setActiveTeam('blue')}
          className={[
            'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors border',
            activeTeam === 'blue'
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500',
          ].join(' ')}
        >
          Blue Team
        </button>
        <button
          onClick={() => setActiveTeam('red')}
          className={[
            'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors border',
            activeTeam === 'red'
              ? 'bg-red-600 border-red-500 text-white'
              : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500',
          ].join(' ')}
        >
          Red Team
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brawlers…"
          className="w-full px-3 py-1.5 rounded-lg bg-brand-black border border-gray-700 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-yellow"
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {loading && (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Loading brawlers…
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-32 text-red-400 text-sm px-4 text-center">
            {error}
          </div>
        )}
        {!loading && !error && (
          <div className="grid grid-cols-4 gap-2">
            {filtered.map((brawler) => {
              const isPlaced = placedIds.has(String(brawler.id))
              const placedTeam = placedBrawlers.find(
                (pb) => pb.brawlerId === String(brawler.id)
              )?.team

              return (
                <button
                  key={brawler.id}
                  onClick={() => onPlace(brawler, activeTeam)}
                  title={brawler.name}
                  className="relative flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-[#21262D] transition-colors group"
                >
                  {/* Team color indicator if already placed */}
                  {isPlaced && (
                    <span
                      className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-[#161B22] z-10"
                      style={{
                        backgroundColor:
                          placedTeam === 'blue' ? '#1E90FF' : '#FF4444',
                      }}
                    />
                  )}
                  <div
                    className={[
                      'w-12 h-12 rounded-full overflow-hidden border-2 transition-colors',
                      isPlaced
                        ? placedTeam === 'blue'
                          ? 'border-blue-500'
                          : 'border-red-500'
                        : 'border-gray-700 group-hover:border-gray-500',
                    ].join(' ')}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brawlerIconURL(brawler.id)}
                      alt={brawler.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 group-hover:text-gray-200 leading-tight text-center line-clamp-1 w-full">
                    {brawler.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: fixed right panel */}
      <aside className="hidden md:flex flex-col w-56 bg-[#161B22] border border-gray-700 rounded-xl overflow-hidden shrink-0">
        {content}
      </aside>

      {/* Mobile: bottom sheet */}
      <div
        className={[
          'md:hidden fixed inset-x-0 bottom-0 z-50 bg-[#161B22] border-t border-gray-700 rounded-t-2xl transition-transform duration-300',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ maxHeight: '70vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-700" />
        </div>
        <div style={{ height: 'calc(70vh - 12px)' }}>{content}</div>
      </div>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
        />
      )}
    </>
  )
}
