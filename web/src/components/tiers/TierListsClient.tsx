'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { fetchBrawlers, fetchGameModes } from '@/lib/brawlify'
import { getTierBoard, saveTierBoard } from '@/lib/storage'
import type { Brawler } from '@/types/brawler'
import type { GameMode } from '@/types/map'
import {
  TIER_ORDER,
  type TierBoardState,
  type TierLetter,
  mergeTierBoard,
  parseTierBoardState,
} from '@/types/tier'

type ColumnId = 'pool' | TierLetter

const CONTAINERS: ColumnId[] = ['pool', 'S', 'A', 'B', 'C', 'D']

const EMPTY_DROP_PREFIX = 'empty-'

function emptyDropId(col: ColumnId): string {
  return `${EMPTY_DROP_PREFIX}${col}`
}

function parseEmptyDropId(id: string): ColumnId | undefined {
  if (!id.startsWith(EMPTY_DROP_PREFIX)) return undefined
  const col = id.slice(EMPTY_DROP_PREFIX.length) as ColumnId
  return CONTAINERS.includes(col) ? col : undefined
}

function boardToColumns(b: TierBoardState): Record<ColumnId, string[]> {
  return { pool: b.pool, S: b.tiers.S, A: b.tiers.A, B: b.tiers.B, C: b.tiers.C, D: b.tiers.D }
}

function columnsToBoard(cols: Record<ColumnId, string[]>): TierBoardState {
  return {
    pool: cols.pool,
    tiers: { S: cols.S, A: cols.A, B: cols.B, C: cols.C, D: cols.D },
    updatedAt: new Date().toISOString(),
  }
}

function findContainer(items: Record<ColumnId, string[]>, id: string): ColumnId | undefined {
  for (const key of CONTAINERS) {
    if (items[key].includes(id)) return key
  }
  return undefined
}

function SortableChip({
  id,
  name,
  iconUrl,
  className = '',
  disabled = false,
}: {
  id: string
  name: string
  iconUrl: string
  className?: string
  disabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg bg-brand-surface border border-gray-800 hover:border-brand-yellow-muted shrink-0 w-[4.5rem] touch-none ${className}`}
      {...attributes}
      {...listeners}
    >
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-900">
        <Image src={iconUrl} alt="" fill className="object-contain" sizes="40px" />
      </div>
      <span className="text-[10px] text-gray-300 truncate w-full text-center leading-tight">{name}</span>
    </button>
  )
}

function EmptyDropZone({ columnId }: { columnId: ColumnId }) {
  const { setNodeRef, isOver } = useDroppable({ id: emptyDropId(columnId) })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[3rem] w-full rounded-md border border-dashed transition-colors ${
        isOver ? 'border-brand-yellow bg-brand-yellow/5' : 'border-gray-800/80 bg-brand-black/40'
      }`}
    />
  )
}

const RARITY_COLORS: Record<string, string> = {
  'Trophy Road': 'text-gray-400',
  Rare: 'text-green-400',
  'Super Rare': 'text-cyan-400',
  Epic: 'text-purple-400',
  Mythic: 'text-red-400',
  Legendary: 'text-yellow-400',
  Chromatic: 'text-orange-400',
}

export function TierListsClient() {
  const [brawlers, setBrawlers] = useState<Brawler[]>([])
  const [modes, setModes] = useState<GameMode[]>([])
  const [context, setContext] = useState<string>('general')
  const [columns, setColumns] = useState<Record<ColumnId, string[]>>(() =>
    boardToColumns({
      pool: [],
      tiers: { S: [], A: [], B: [], C: [], D: [] },
      updatedAt: '',
    })
  )
  const [loading, setLoading] = useState(true)
  const [boardReady, setBoardReady] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState<string | null>(null)
  const [poolOpen, setPoolOpen] = useState(true)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const brawlerById = useMemo(() => new Map(brawlers.map((b) => [String(b.id), b])), [brawlers])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchBrawlers(), fetchGameModes()])
      .then(([b, m]) => {
        if (cancelled) return
        setBrawlers(b)
        setModes(m)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (brawlers.length === 0) return
    let stale = false
    setBoardReady(false)
    ;(async () => {
      const raw = await getTierBoard(context)
      const ids = brawlers.map((b) => String(b.id))
      const merged = mergeTierBoard(parseTierBoardState(raw), ids)
      if (stale) return
      setColumns(boardToColumns(merged))
      setBoardReady(true)
    })()
    return () => {
      stale = true
    }
  }, [context, brawlers])

  useEffect(() => {
    if (!boardReady || brawlers.length === 0) return
    const board = columnsToBoard(columns)
    const t = setTimeout(() => {
      void saveTierBoard(context, board)
    }, 450)
    return () => clearTimeout(t)
  }, [columns, context, boardReady, brawlers.length])

  const poolFilterVisible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const vis = new Set<string>()
    for (const id of columns.pool) {
      const b = brawlerById.get(id)
      if (!b) continue
      if (rarityFilter && b.rarity !== rarityFilter) continue
      if (q && !b.name.toLowerCase().includes(q)) continue
      vis.add(id)
    }
    return vis
  }, [columns.pool, brawlerById, search, rarityFilter])

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)

    const activeContainer = findContainer(columns, activeIdStr)
    if (!activeContainer) return

    const emptyCol = parseEmptyDropId(overIdStr)
    const overContainer: ColumnId | undefined =
      emptyCol ?? findContainer(columns, overIdStr)

    if (!overContainer) return

    if (activeContainer === overContainer) {
      const list = columns[overContainer]
      const activeIndex = list.indexOf(activeIdStr)
      const overIndex = list.indexOf(overIdStr)
      if (activeIndex < 0) return
      if (overIndex < 0) return
      if (activeIndex === overIndex) return
      setColumns((prev) => ({
        ...prev,
        [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
      }))
      return
    }

    setColumns((prev) => {
      const next: Record<ColumnId, string[]> = { ...prev }
      next[activeContainer] = prev[activeContainer].filter((id) => id !== activeIdStr)
      const dest = [...next[overContainer]]
      if (emptyCol) {
        dest.push(activeIdStr)
      } else {
        const overIndex = dest.indexOf(overIdStr)
        if (overIndex >= 0) dest.splice(overIndex, 0, activeIdStr)
        else dest.push(activeIdStr)
      }
      next[overContainer] = dest
      return next
    })
  }

  const handleReset = () => {
    if (!confirm('Clear this entire board? All brawlers go back to the pool.')) return
    const ids = brawlers.map((b) => String(b.id)).sort((a, b) => Number(a) - Number(b))
    setColumns({ pool: ids, S: [], A: [], B: [], C: [], D: [] })
  }

  const copyAsText = () => {
    const lines = TIER_ORDER.map((tier) => {
      const names = columns[tier].map((id) => brawlerById.get(id)?.name ?? id).join(', ')
      return `${tier}: ${names || '—'}`
    })
    void navigator.clipboard.writeText(lines.join('\n'))
  }

  const activeBrawler = activeId ? brawlerById.get(activeId) : undefined

  if (loading) {
    return <div className="p-6 text-gray-500 text-sm">Loading tier board…</div>
  }

  return (
    <div className="p-6 bg-brand-black min-h-full pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-white mb-1">Tier lists</h1>
      <p className="text-gray-400 text-sm mb-2">
        Your rankings — not official meta. Switch mode for a separate saved board.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setContext('general')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
            context === 'general'
              ? 'bg-brand-yellow/15 border-brand-yellow text-brand-yellow'
              : 'border-gray-700 text-gray-400 hover:border-gray-500'
          }`}
        >
          General
        </button>
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setContext(`mode:${m.id}`)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border max-w-[10rem] truncate ${
              context === `mode:${m.id}`
                ? 'bg-brand-yellow/15 border-brand-yellow text-brand-yellow'
                : 'border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
            title={m.name}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-900/50"
        >
          Reset board
        </button>
        <button
          type="button"
          onClick={copyAsText}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-yellow-400"
        >
          Copy as text
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4 mb-6">
          {TIER_ORDER.map((tier) => (
            <div
              key={tier}
              className="rounded-lg border border-gray-800 bg-brand-surface/80 overflow-hidden flex flex-col sm:flex-row sm:items-stretch"
            >
              <div
                className={`shrink-0 w-full sm:w-12 flex items-center justify-center py-2 sm:py-0 font-bold text-lg ${
                  tier === 'S'
                    ? 'bg-brand-yellow/20 text-brand-yellow'
                    : 'bg-gray-900/80 text-gray-400'
                }`}
              >
                {tier}
              </div>
              <div className="flex-1 min-h-[4.5rem] p-2 flex flex-col gap-2">
                <SortableContext id={tier} items={columns[tier]} strategy={rectSortingStrategy}>
                  <div className="flex flex-wrap gap-2 min-h-[4rem]">
                    {columns[tier].map((id) => {
                      const b = brawlerById.get(id)
                      if (!b) return null
                      return (
                        <SortableChip
                          key={id}
                          id={id}
                          name={b.name}
                          iconUrl={`https://cdn.brawlify.com/brawlers/borderless/${b.id}.png`}
                        />
                      )
                    })}
                  </div>
                </SortableContext>
                {columns[tier].length === 0 ? <EmptyDropZone columnId={tier} /> : null}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-gray-800 bg-brand-surface">
          <button
            type="button"
            className="md:hidden w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-white border-b border-gray-800"
            onClick={() => setPoolOpen((o) => !o)}
          >
            Brawler pool
            <span className="text-gray-500">{poolOpen ? 'Hide' : 'Show'}</span>
          </button>
          <div className={`${poolOpen ? 'block' : 'hidden'} md:block p-3`}>
            <div className="flex flex-wrap gap-2 mb-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pool…"
                className="flex-1 min-w-[8rem] max-w-xs px-3 py-1.5 rounded-lg bg-brand-black border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => setRarityFilter(null)}
                className={`px-2 py-1 rounded text-[10px] border ${
                  rarityFilter === null
                    ? 'border-brand-yellow text-brand-yellow'
                    : 'border-gray-700 text-gray-500'
                }`}
              >
                All rarities
              </button>
              {Array.from(new Set(brawlers.map((b) => b.rarity))).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRarityFilter(r === rarityFilter ? null : r)}
                  className={`px-2 py-1 rounded text-[10px] border ${
                    rarityFilter === r ? 'border-brand-yellow text-brand-yellow' : 'border-gray-700 text-gray-500'
                  } ${RARITY_COLORS[r] ?? ''}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <SortableContext id="pool" items={columns.pool} strategy={rectSortingStrategy}>
              <div className="flex flex-wrap gap-2 max-h-[40vh] md:max-h-none overflow-y-auto relative">
                {columns.pool.map((id) => {
                  const b = brawlerById.get(id)
                  if (!b) return null
                  const hidden = !poolFilterVisible.has(id)
                  return (
                    <SortableChip
                      key={id}
                      id={id}
                      name={b.name}
                      iconUrl={`https://cdn.brawlify.com/brawlers/borderless/${b.id}.png`}
                      className={hidden ? 'hidden' : ''}
                      disabled={hidden}
                    />
                  )
                })}
                {columns.pool.length === 0 ? <EmptyDropZone columnId="pool" /> : null}
              </div>
            </SortableContext>
          </div>
        </div>

        <DragOverlay>
          {activeBrawler ? (
            <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg bg-brand-surface border border-brand-yellow w-[4.5rem]">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-900">
                <Image
                  src={`https://cdn.brawlify.com/brawlers/borderless/${activeBrawler.id}.png`}
                  alt=""
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="text-[10px] text-gray-200 truncate w-full text-center">{activeBrawler.name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
