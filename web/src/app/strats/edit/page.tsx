'use client'

import React, { useRef, useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { StrategyCanvasHandle, DrawingTool } from '@/components/canvas/StrategyCanvas'
import Toolbar from '@/components/canvas/Toolbar'
import BrawlerPicker from '@/components/canvas/BrawlerPicker'
import type { StrategyElement, BrawlerElement, Strategy } from '@/types/strategy'
import type { Brawler } from '@/types/brawler'
import { getStrategy, saveStrategy } from '@/lib/storage'
import { shareStrategyPng } from '@/lib/shareImage'
import { normalizeStrategyMapId } from '@/lib/strategyMapId'

const StrategyCanvas = dynamic(() => import('@/components/canvas/StrategyCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
      Loading canvas…
    </div>
  ),
})

function useHistory(initial: StrategyElement[]) {
  const [history, setHistory] = useState<StrategyElement[][]>([initial])
  const [cursor, setCursor] = useState(0)
  const historyRef = useRef(history)
  historyRef.current = history

  const present = history[cursor]

  const push = useCallback(
    (next: StrategyElement[]) => {
      setHistory((h) => [...h.slice(0, cursor + 1), next])
      setCursor((c) => c + 1)
    },
    [cursor]
  )

  const undo = useCallback(() => {
    setCursor((c) => Math.max(0, c - 1))
  }, [])

  const redo = useCallback(() => {
    setCursor((c) => Math.min(historyRef.current.length - 1, c + 1))
  }, [])

  const reset = useCallback((elements: StrategyElement[]) => {
    setHistory([elements])
    setCursor(0)
  }, [])

  const canUndo = cursor > 0
  const canRedo = cursor < history.length - 1

  return { present, push, undo, redo, canUndo, canRedo, reset }
}

function EditStrategyInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id') ?? ''

  const canvasRef = useRef<StrategyCanvasHandle>(null)

  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [title, setTitle] = useState('')
  const [activeTool, setActiveTool] = useState<DrawingTool>('select')
  const [activeColor, setActiveColor] = useState('#F5CC00')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)
  const [mobileHeaderExpanded, setMobileHeaderExpanded] = useState(true)
  const [mobileToolbarExpanded, setMobileToolbarExpanded] = useState(true)

  const { present: elements, push: pushElements, undo, redo, canUndo, canRedo, reset } = useHistory([])

  useEffect(() => {
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }
    getStrategy(id)
      .then((s) => {
        if (!s) {
          setNotFound(true)
          return
        }
        setStrategy({
          ...s,
          mapId: normalizeStrategyMapId(s.mapId),
        })
        setTitle(s.title)
        reset(s.elements)
      })
      .catch((err) => {
        console.error('Load failed', err)
        setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [id, reset])

  const handleToolChange = (tool: DrawingTool) => {
    setActiveTool(tool)
    setPickerOpen(tool === 'brawler')
  }

  const handlePlaceBrawler = (brawler: Brawler, team: 'blue' | 'red') => {
    const cx = 1080 / 2
    const cy = 1920 / 2
    const newBrawler: BrawlerElement = {
      type: 'brawler',
      id: `brawler-${Date.now()}-${brawler.id}`,
      brawlerId: String(brawler.id),
      brawlerName: brawler.name,
      team,
      position: { x: cx + Math.random() * 40 - 20, y: cy + Math.random() * 40 - 20 },
      rotation: 0,
    }
    pushElements([...elements, newBrawler])
  }

  const handleSave = async () => {
    if (!strategy) return
    setSaving(true)
    try {
      const updated: Strategy = {
        ...strategy,
        title,
        modifiedAt: new Date().toISOString(),
        elements,
      }
      await saveStrategy(updated)
      router.push('/strats')
    } catch (err) {
      console.error('Save failed', err)
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    const dataURL = canvasRef.current?.exportPNG()
    if (!dataURL) return
    const a = document.createElement('a')
    a.href = dataURL
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`
    a.rel = 'noopener'
    a.click()
  }

  const handleShare = async () => {
    const dataURL = canvasRef.current?.exportPNG()
    if (!dataURL) return
    setShareBusy(true)
    try {
      await shareStrategyPng(dataURL, { title })
    } catch (err) {
      console.error('Share failed', err)
      handleExport()
    } finally {
      setShareBusy(false)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault()
          if (e.shiftKey) {
            if (canRedo) redo()
          } else if (canUndo) {
            undo()
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault()
          if (canRedo) redo()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [canUndo, canRedo, undo, redo])

  const placedBrawlers = elements.filter(
    (el): el is BrawlerElement => el.type === 'brawler'
  )

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D1117] text-gray-500 text-sm">
        Loading strategy…
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0D1117] gap-4">
        <p className="text-gray-400 text-sm">Strategy not found.</p>
        <button
          onClick={() => router.push('/strats')}
          className="px-4 py-2 rounded-lg bg-brand-yellow hover:bg-yellow-400 text-black text-sm font-medium"
        >
          Back to strategies
        </button>
      </div>
    )
  }

  const mobileActiveToolLabel =
    activeTool === 'select'
      ? 'Select'
      : activeTool === 'arrow'
        ? 'Arrow'
        : activeTool === 'brawler'
          ? 'Brawler'
          : 'Zone'

  return (
    <div className="flex flex-col h-screen bg-[#0D1117] overflow-hidden">
      <header className="hidden md:flex items-center gap-3 px-4 py-2 bg-[#161B22] border-b border-gray-700 shrink-0">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors text-sm"
          aria-label="Back"
        >
          ← Back
        </button>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-white font-semibold text-sm focus:outline-none border-b border-transparent focus:border-gray-500 transition-colors py-0.5 truncate"
          placeholder="Strategy title…"
        />

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            disabled={shareBusy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] disabled:opacity-50 text-gray-200 text-xs font-medium transition-colors border border-gray-700"
          >
            {shareBusy ? 'Sharing…' : 'Share'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-gray-300 text-xs font-medium transition-colors border border-gray-700"
          >
            Download PNG
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-yellow hover:bg-yellow-400 disabled:opacity-50 text-black text-xs font-semibold transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <header className="flex md:hidden flex-col shrink-0 bg-[#161B22] border-b border-gray-700">
        {mobileHeaderExpanded ? (
          <div className="relative px-3 pt-2 pb-3">
            <button
              type="button"
              onClick={() => setMobileHeaderExpanded(false)}
              className="absolute right-2 top-2 p-2 text-gray-400 hover:text-white rounded-md"
              aria-label="Collapse header"
            >
              <span className="text-lg leading-none">⌃</span>
            </button>
            <div className="flex items-center gap-2 pr-10">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white transition-colors text-sm shrink-0"
                aria-label="Back"
              >
                ← Back
              </button>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-white font-semibold text-sm focus:outline-none border-b border-gray-600 py-1"
                placeholder="Strategy title…"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleShare}
                disabled={shareBusy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] disabled:opacity-50 text-gray-200 text-xs font-medium border border-gray-700"
              >
                {shareBusy ? 'Sharing…' : 'Share'}
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-gray-300 text-xs font-medium border border-gray-700"
              >
                PNG
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-yellow hover:bg-yellow-400 disabled:opacity-50 text-black text-xs font-semibold"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            {strategy?.gameMode ? (
              <p className="mt-2 text-xs text-gray-500 truncate">{strategy.gameMode}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white text-sm shrink-0"
              aria-label="Back"
            >
              ←
            </button>
            <span className="flex-1 min-w-0 text-sm font-semibold text-white truncate">
              {title || 'Strategy'}
            </span>
            <button
              type="button"
              onClick={handleShare}
              disabled={shareBusy}
              className="text-xs text-gray-300 px-2 py-1 rounded border border-gray-600 shrink-0"
            >
              Share
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-semibold text-black px-2 py-1 rounded bg-brand-yellow shrink-0"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setMobileHeaderExpanded(true)}
              className="p-2 text-gray-400 hover:text-white shrink-0"
              aria-label="Expand header"
            >
              <span className="text-lg leading-none">⌄</span>
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden gap-2 p-2">
        <div className="hidden md:flex items-start pt-1 shrink-0">
          <Toolbar
            activeTool={activeTool}
            activeColor={activeColor}
            onToolChange={handleToolChange}
            onColorChange={setActiveColor}
            onUndo={undo}
            canUndo={canUndo}
          />
        </div>

        <div className="flex-1 min-h-0 min-w-0 h-full rounded-lg overflow-hidden">
          {strategy && (
            <StrategyCanvas
              ref={canvasRef}
              mapId={strategy.mapId}
              elements={elements}
              activeTool={activeTool}
              activeColor={activeColor}
              onElementsChange={pushElements}
            />
          )}
        </div>

        <div className="hidden md:flex shrink-0">
          <BrawlerPicker
            placedBrawlers={placedBrawlers}
            onPlace={handlePlaceBrawler}
            isOpen={true}
            onClose={() => {}}
          />
        </div>
      </div>

      <div className="md:hidden shrink-0 border-t border-gray-800 bg-[#0D1117]">
        {mobileToolbarExpanded ? (
          <div className="relative pt-1">
            <button
              type="button"
              onClick={() => setMobileToolbarExpanded(false)}
              className="absolute right-3 top-2 z-10 p-1.5 text-gray-400 hover:text-white rounded-md bg-[#161B22]/90 border border-gray-700 text-xs"
              aria-label="Collapse tools"
            >
              Hide tools
            </button>
            <Toolbar
              activeTool={activeTool}
              activeColor={activeColor}
              onToolChange={handleToolChange}
              onColorChange={setActiveColor}
              onUndo={undo}
              canUndo={canUndo}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-xs text-gray-500 shrink-0">{mobileActiveToolLabel}</span>
            <span className="flex-1 text-xs text-gray-500 truncate">
              Pinch to zoom · two fingers when Select is active
            </span>
            <button
              type="button"
              onClick={() => setMobileToolbarExpanded(true)}
              className="text-xs font-medium text-brand-yellow px-2 py-1 shrink-0"
            >
              Show tools
            </button>
          </div>
        )}
      </div>

      <BrawlerPicker
        placedBrawlers={placedBrawlers}
        onPlace={handlePlaceBrawler}
        isOpen={pickerOpen}
        onClose={() => {
          setPickerOpen(false)
          setActiveTool('select')
        }}
      />
    </div>
  )
}

export default function EditStrategyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#0D1117] text-gray-500 text-sm">
          Loading…
        </div>
      }
    >
      <EditStrategyInner />
    </Suspense>
  )
}
