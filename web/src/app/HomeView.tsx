'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HomeBrawlerStrip } from '@/components/home/HomeBrawlerStrip'
import { HomeModeDock } from '@/components/home/HomeModeDock'
import {
  HomeRotationCards,
  type HomeRotationCardItem,
} from '@/components/home/HomeRotationCards'
import { HomeNavTiles } from '@/components/home/HomeNavTiles'
import { HomeStatChips } from '@/components/home/HomeStatChips'
import { fetchEventRotation } from '@/lib/brawlstars/client'
import { eventFromRotationSlot, mapIdFromRotationEvent } from '@/lib/brawlstars/rotationSlot'
import { readKnownProfileHints, resolveTagFromInput } from '@/lib/brawlstars/profileHints'
import { getAllStrategies } from '@/lib/storage'

export interface HomeShortcut {
  label: string
  gameModeId: number
}

export interface HomeGameModeSummary {
  id: number
  name: string
}

interface HomeViewProps {
  shortcuts: HomeShortcut[]
  mapCount: number
  modeCount: number
  brawlerCount: number
  spotlightBrawlerIds: number[]
  gameModes: HomeGameModeSummary[]
}

export function HomeView({
  shortcuts,
  mapCount,
  modeCount,
  brawlerCount,
  spotlightBrawlerIds,
  gameModes,
}: HomeViewProps) {
  const router = useRouter()
  const [rotation, setRotation] = useState<Array<Record<string, unknown>>>([])
  const [rotationError, setRotationError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [knownHints] = useState(readKnownProfileHints())
  const [myStratCount, setMyStratCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    getAllStrategies()
      .then((list) => {
        if (!cancelled) setMyStratCount(list.length)
      })
      .catch(() => {
        if (!cancelled) setMyStratCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchEventRotation()
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data)) {
          setRotation(data as Array<Record<string, unknown>>)
          return
        }
        if (data && typeof data === 'object') {
          const rec = data as Record<string, unknown>
          if (Array.isArray(rec.current)) {
            setRotation(rec.current as Array<Record<string, unknown>>)
            return
          }
          if (Array.isArray(rec.items)) {
            setRotation(rec.items as Array<Record<string, unknown>>)
            return
          }
        }
        setRotation([])
      })
      .catch(() => {
        if (cancelled) return
        setRotation([])
        setRotationError('Live rotation is temporarily unavailable.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const topRotation = useMemo(() => rotation.slice(0, 6), [rotation])

  const rotationCards: HomeRotationCardItem[] = useMemo(
    () =>
      topRotation.map((slot, idx) => {
        const slotRec = slot as Record<string, unknown>
        const event = eventFromRotationSlot(slotRec)
        const mapId = mapIdFromRotationEvent(event)
        const mapName =
          typeof event.map === 'string'
            ? event.map
            : typeof event.mapName === 'string'
              ? event.mapName
              : 'Unknown map'
        const mode = typeof event.mode === 'string' ? event.mode : 'Unknown mode'
        const rowKey = mapId ?? `${mapName}-${mode}-${idx}`
        return { rowKey, mapId, mapName, mode }
      }),
    [topRotation]
  )

  const onFindProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = resolveTagFromInput(tagInput, knownHints)
    if (!normalized) return
    router.push(`/profile?tag=${encodeURIComponent(normalized)}`)
  }

  return (
    <div className="px-4 py-10 sm:px-6 md:px-10 md:py-14 max-w-6xl xl:max-w-7xl mx-auto min-h-full w-full">
      <div className="animate-fade-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/20 bg-brand-yellow/[0.07] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-yellow/80">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow/70 animate-pulse" />
          Strategy hub
        </span>
      </div>

      <div className="animate-fade-up-delay-1 mt-5">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.08] text-white">
          Plan your <span className="text-brand-yellow">Brawl Stars</span> strategies
        </h1>
        <p className="mt-3 text-[14px] sm:text-[15px] leading-relaxed text-white/40 max-w-xl">
          Browse maps, draw on the strategy canvas, and keep tier lists — saved locally in your browser.
        </p>
      </div>

      <div className="mt-8 animate-fade-up-delay-2">
        <HomeStatChips
          mapCount={mapCount}
          modeCount={modeCount}
          brawlerCount={brawlerCount}
          myStratCount={myStratCount}
        />
      </div>

      <div className="mt-10 animate-fade-up-delay-2">
        <HomeNavTiles />
      </div>

      <div className="mt-10 space-y-10 animate-fade-up-delay-3">
        <HomeModeDock shortcuts={shortcuts} gameModesFallback={gameModes} />
        <HomeBrawlerStrip brawlerIds={spotlightBrawlerIds} />
        <HomeRotationCards items={rotationCards} rotationError={rotationError} />
      </div>

      <section className="mt-12 rounded-2xl border border-brand-yellow/20 bg-brand-yellow/[0.06] p-4 md:p-5 animate-fade-up-delay-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-brand-yellow/75">Find profile</p>
        <h2 className="mt-1 text-lg font-semibold text-white">Open a full player dashboard</h2>
        <p className="mt-1 text-[13px] text-white/45">Search by player tag to load profile, club, battle insights, and worst-stat counter.</p>
        <p className="mt-1 text-[12px] text-white/35">
          Supercell API does not support global player-name search. Name matches here work only for profiles you opened before on this device.
        </p>
        <form className="mt-3 flex flex-col sm:flex-row gap-2" onSubmit={onFindProfile}>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="#2PP..."
            list="known-profile-hints"
            className="w-full rounded-lg border border-white/[0.1] bg-brand-black px-3 py-2 text-sm text-white placeholder:text-white/25"
          />
          <datalist id="known-profile-hints">
            {knownHints.map((hint) => (
              <option key={hint.tag} value={hint.tag}>
                {hint.name}
              </option>
            ))}
          </datalist>
          <button
            type="submit"
            className="rounded-lg bg-brand-yellow px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 disabled:opacity-50"
            disabled={!resolveTagFromInput(tagInput, knownHints)}
          >
            View profile
          </button>
        </form>
      </section>

      <footer className="mt-14 pt-8 border-t border-white/[0.06] flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-white/25">
        <span className="text-white/35 w-full sm:w-auto">Quick links</span>
        {[
          { href: '/maps', label: 'Maps' },
          { href: '/brawlers', label: 'Brawlers' },
          { href: '/tiers', label: 'Tier lists' },
          { href: '/strats', label: 'My strats' },
          { href: '/profile', label: 'Profiles' },
          { href: '/account', label: 'Account' },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-white/60 transition-colors">
            {link.label}
          </Link>
        ))}
      </footer>
    </div>
  )
}
