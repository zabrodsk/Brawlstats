'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { normalizeTag, tagToPathSegment } from '@/lib/brawlstars/normalizeTag'
import {
  readKnownProfileHints,
  rememberKnownProfile,
  resolveTagFromInput,
} from '@/lib/brawlstars/profileHints'
import type { BattleLogInsights } from '@/lib/brawlstars/battleInsights'
import {
  fetchBattleLog,
  fetchClub,
  fetchClubMembers,
  fetchEventRotation,
  fetchPlayer,
  fetchWorstCounter,
} from '@/lib/brawlstars/client'
import { eventFromRotationSlot, mapIdFromRotationEvent } from '@/lib/brawlstars/rotationSlot'

export const dynamic = 'force-dynamic'
const STORAGE_MY_PROFILE_TAG = 'brawlstars_my_profile_tag'

// ─── Types ────────────────────────────────────────────────────────────────────

type WorstCounterResponse = {
  playerTag: string
  matchesTracked: number
  worstOnTeamCount: number
  worstRate: number | null
  latestBattleTime: string | null
}

type BattleItem = {
  result: 'victory' | 'defeat' | 'draw' | string
  mode: string
  mapName: string
  mapId: string
  brawlerName: string | null
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

function rotationItems(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>
  const rec = toRecord(data)
  if (!rec) return []
  if (Array.isArray(rec.current)) return rec.current as Array<Record<string, unknown>>
  if (Array.isArray(rec.items)) return rec.items as Array<Record<string, unknown>>
  return []
}

function parseBattleItems(raw: unknown[]): BattleItem[] {
  return raw.map((item) => {
    const rec = toRecord(item) ?? {}
    const ev = toRecord(rec.event) ?? {}
    const bt = toRecord(rec.battle) ?? {}
    const mode = typeof ev.mode === 'string' ? ev.mode : 'unknown'
    const mapName =
      typeof ev.map === 'string'
        ? ev.map
        : typeof ev.mapName === 'string'
          ? ev.mapName
          : 'Unknown map'
    const mapId = ev.mapId != null ? String(ev.mapId) : ''
    const result = typeof bt.result === 'string' ? bt.result : 'unknown'

    let brawlerName: string | null = null
    const teams = bt.teams
    if (Array.isArray(teams)) {
      for (const team of teams) {
        if (!Array.isArray(team)) continue
        for (const p of team) {
          const pr = toRecord(p)
          if (!pr) continue
          const b = toRecord(pr.brawler)
          if (b && typeof b.name === 'string') {
            brawlerName = b.name
            break
          }
        }
        if (brawlerName) break
      }
    }

    return { result, mode, mapName, mapId, brawlerName }
  })
}

// ─── Derived narrative helpers ────────────────────────────────────────────────

function trophyRankLabel(trophies: number): { label: string; color: string } {
  if (trophies >= 80000) return { label: 'Legendary Sweat', color: '#f5cc00' }
  if (trophies >= 50000) return { label: 'Diamond Grinder', color: '#60a5fa' }
  if (trophies >= 30000) return { label: 'Gold Hustler', color: '#fbbf24' }
  if (trophies >= 15000) return { label: 'Silver Climber', color: '#94a3b8' }
  if (trophies >= 5000) return { label: 'Bronze Pusher', color: '#cd7c3a' }
  return { label: 'Fresh Recruit', color: '#6b7280' }
}

function playstyleTag(byMode: BattleLogInsights['byMode']): string {
  if (!byMode.length) return 'Mystery Player'
  const top = byMode[0].label.toLowerCase()
  if (top.includes('gem') || top.includes('grab')) return 'Gem Goblin'
  if (top.includes('showdown') || top.includes('solo')) return 'Showdown Rat'
  if (top.includes('brawl') || top.includes('ball')) return 'Ball Wizard'
  if (top.includes('bounty')) return 'Star Hunter'
  if (top.includes('siege')) return 'IKE Defender'
  if (top.includes('heist')) return 'Safe Cracker'
  if (top.includes('hot') || top.includes('zone')) return 'Zone Controller'
  if (top.includes('knock') || top.includes('out')) return 'KO Artist'
  return `${byMode[0].label} Main`
}

function winRateVerdict(rate: number | null): string {
  if (rate == null) return 'No data'
  if (rate >= 0.65) return 'Absolutely dominant'
  if (rate >= 0.55) return 'Winning more than losing'
  if (rate >= 0.45) return 'Right in the middle'
  if (rate >= 0.35) return 'Rough patch'
  return 'Yikes, keep grinding'
}

function starRateVerdict(rate: number | null): string {
  if (rate == null) return 'No data'
  if (rate >= 0.3) return 'Team MVP material'
  if (rate >= 0.15) return 'Frequently shining'
  if (rate >= 0.05) return 'Occasional standout'
  return 'Staying in the shadows'
}

function trophyDeltaVerdict(delta: number | null): string {
  if (delta == null) return 'No data'
  if (delta >= 5) return 'Gaining ground fast'
  if (delta >= 1) return 'Slowly climbing'
  if (delta >= -1) return 'Treading water'
  if (delta >= -5) return 'Sliding a bit'
  return 'Free-falling'
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function ProfileDashboardPage() {
  const [tagInput, setTagInput] = useState('')
  const [playerTag, setPlayerTag] = useState('')
  const [clubOverride, setClubOverride] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [knownHints, setKnownHints] = useState(readKnownProfileHints())
  const [myProfileTag, setMyProfileTag] = useState<string | null>(null)

  const [profile, setProfile] = useState<unknown>(null)
  const [battlePayload, setBattlePayload] = useState<{
    items: unknown[]
    insights: BattleLogInsights
  } | null>(null)
  const [club, setClub] = useState<unknown>(null)
  const [members, setMembers] = useState<unknown>(null)
  const [rotation, setRotation] = useState<unknown>(null)
  const [worstCounter, setWorstCounter] = useState<WorstCounterResponse | null>(null)

  const encodedPlayerTag = useMemo(
    () => (playerTag ? tagToPathSegment(playerTag) : ''),
    [playerTag]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const urlTag = normalizeTag(params.get('tag') ?? '')
    const savedMyTag = normalizeTag(window.localStorage.getItem(STORAGE_MY_PROFILE_TAG) ?? '')
    if (savedMyTag) setMyProfileTag(savedMyTag)
    if (urlTag) {
      setTagInput(urlTag)
      setPlayerTag(urlTag)
      return
    }
    if (savedMyTag) {
      setTagInput(savedMyTag)
      setPlayerTag(savedMyTag)
    }
  }, [])

  const loadDashboard = useCallback(async () => {
    if (!encodedPlayerTag) return
    setLoading(true)
    setError(null)
    try {
      const [playerRes, battleRes, rotationRes] = await Promise.all([
        fetchPlayer(encodedPlayerTag),
        fetchBattleLog(encodedPlayerTag),
        fetchEventRotation().catch(() => null),
      ])

      setProfile(playerRes)
      const playerRec = toRecord(playerRes)
      if (playerRec && typeof playerRec.tag === 'string') {
        rememberKnownProfile(
          playerRec.tag,
          typeof playerRec.name === 'string' ? playerRec.name : null
        )
        setKnownHints(readKnownProfileHints())
      }
      setBattlePayload(battleRes)
      setRotation(rotationRes)

      const profileRec = toRecord(playerRes)
      const overrideTag = normalizeTag(clubOverride)
      const profileClubTag = toRecord(profileRec?.club)?.tag
      const chosenClubTag =
        overrideTag ??
        (typeof profileClubTag === 'string' ? normalizeTag(profileClubTag) : null)

      if (chosenClubTag) {
        const encodedClubTag = tagToPathSegment(chosenClubTag)
        const [clubRes, membersRes] = await Promise.all([
          fetchClub(encodedClubTag),
          fetchClubMembers(encodedClubTag),
        ])
        setClub(clubRes)
        setMembers(membersRes)
      } else {
        setClub(null)
        setMembers(null)
      }

      try {
        const counterData = await fetchWorstCounter(encodedPlayerTag)
        setWorstCounter(counterData)
      } catch {
        setWorstCounter(null)
      }
    } catch (e) {
      setProfile(null)
      setBattlePayload(null)
      setClub(null)
      setMembers(null)
      setRotation(null)
      setWorstCounter(null)
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [clubOverride, encodedPlayerTag])

  useEffect(() => {
    if (encodedPlayerTag) void loadDashboard()
  }, [encodedPlayerTag, loadDashboard])

  const memberItems = useMemo(() => {
    const rec = toRecord(members)
    if (!rec) return []
    if (!Array.isArray(rec.items)) return []
    return rec.items as Array<Record<string, unknown>>
  }, [members])

  const profileRec = toRecord(profile)
  const insights = battlePayload?.insights ?? null
  const battles = useMemo(
    () => parseBattleItems(battlePayload?.items ?? []),
    [battlePayload]
  )
  const clubRec = toRecord(club)

  const profileName =
    typeof profileRec?.name === 'string' ? profileRec.name : 'Player'
  const trophies =
    typeof profileRec?.trophies === 'number' ? profileRec.trophies : null
  const bestTrophies =
    typeof profileRec?.highestTrophies === 'number' ? profileRec.highestTrophies : null
  const expLevel =
    typeof profileRec?.expLevel === 'number' ? profileRec.expLevel : null
  const brawlers = Array.isArray(profileRec?.brawlers)
    ? (profileRec?.brawlers as Array<Record<string, unknown>>)
    : []

  const trophyPeak = bestTrophies != null && trophies != null ? bestTrophies - trophies : null
  const rankInfo = trophies != null ? trophyRankLabel(trophies) : null
  const playStyle = insights ? playstyleTag(insights.byMode) : null

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const normalized = resolveTagFromInput(tagInput, knownHints)
    if (!normalized) return
    setPlayerTag(normalized)
  }

  const saveAsMyProfile = () => {
    const normalized = normalizeTag(playerTag)
    if (!normalized || typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_MY_PROFILE_TAG, normalized)
    setMyProfileTag(normalized)
  }

  const openMyProfile = () => {
    if (!myProfileTag) return
    setTagInput(myProfileTag)
    setPlayerTag(myProfileTag)
  }

  return (
    <div className="px-5 py-6 md:px-8 md:py-8 bg-brand-black min-h-full max-w-5xl">
      {/* Search form */}
      <section className="rounded-xl border border-white/[0.08] bg-brand-surface p-4 md:p-5 mb-6">
        <form className="flex flex-col md:flex-row gap-3 md:items-end" onSubmit={onSubmit}>
          <div className="flex-1">
            <label className="text-[11px] uppercase tracking-wide text-white/30 block mb-1">
              Player tag
            </label>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="#2PP..."
              list="profile-known-hints"
              className="w-full bg-brand-black border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-white/25"
            />
            <datalist id="profile-known-hints">
              {knownHints.map((hint) => (
                <option key={hint.tag} value={hint.tag}>
                  {hint.name}
                </option>
              ))}
            </datalist>
            <p className="mt-1 text-[11px] text-white/35">
              Name lookup not available via Supercell API — type a previously saved name to map it to a tag.
            </p>
          </div>
          <div className="flex-1">
            <label className="text-[11px] uppercase tracking-wide text-white/30 block mb-1">
              Club override
            </label>
            <input
              value={clubOverride}
              onChange={(e) => setClubOverride(e.target.value)}
              placeholder="Optional #CLUB"
              className="w-full bg-brand-black border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-white/25"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-brand-yellow px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 disabled:opacity-50"
            disabled={!resolveTagFromInput(tagInput, knownHints)}
          >
            Load dashboard
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
          <button
            type="button"
            onClick={saveAsMyProfile}
            disabled={!normalizeTag(playerTag)}
            className="rounded-lg border border-brand-yellow/40 px-2.5 py-1.5 text-brand-yellow/90 hover:bg-brand-yellow/[0.08] disabled:opacity-40"
          >
            Save current as My profile
          </button>
          {myProfileTag && (
            <button
              type="button"
              onClick={openMyProfile}
              className="rounded-lg border border-white/[0.15] px-2.5 py-1.5 text-white/75 hover:text-white"
            >
              Open My profile ({myProfileTag})
            </button>
          )}
        </div>
      </section>

      {error && (
        <p className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-200/90">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-white/40 text-sm mb-5 animate-pulse">Loading profile data…</p>
      )}

      {profileRec && (
        <>
          {/* ── HERO SECTION ─────────────────────────────────────────── */}
          <section className="rounded-xl border border-white/[0.08] bg-brand-surface p-5 md:p-6 mb-6 relative overflow-hidden">
            {/* background glow from rank color */}
            {rankInfo && (
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at top left, ${rankInfo.color} 0%, transparent 70%)`,
                }}
              />
            )}
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {rankInfo && (
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                      style={{
                        color: rankInfo.color,
                        borderColor: `${rankInfo.color}55`,
                        background: `${rankInfo.color}15`,
                      }}
                    >
                      {rankInfo.label}
                    </span>
                  )}
                  {playStyle && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-white/15 text-white/65 bg-white/[0.04]">
                      {playStyle}
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">{profileName}</h2>
                <p className="text-sm text-white/35 font-mono mt-0.5">{playerTag}</p>
              </div>

              {/* trophy block */}
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-white/30 mb-0.5">Trophies</p>
                <p className="text-4xl font-bold text-white tabular-nums">
                  {trophies != null ? trophies.toLocaleString() : '—'}
                </p>
                {trophyPeak != null && trophyPeak > 0 && (
                  <p className="text-[12px] text-red-400/80 mt-0.5">
                    −{trophyPeak.toLocaleString()} from peak
                  </p>
                )}
                {trophyPeak === 0 && (
                  <p className="text-[12px] text-green-400/80 mt-0.5">At all-time best!</p>
                )}
              </div>
            </div>

            {/* streak + star player row */}
            {insights && (
              <div className="relative flex flex-wrap gap-3 mt-5">
                {/* streak pill */}
                {insights.currentStreak.type !== 'none' && (
                  <StreakPill
                    type={insights.currentStreak.type}
                    length={insights.currentStreak.length}
                  />
                )}
                {/* star player pill */}
                {insights.starPlayerBattles > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-brand-yellow/10 border border-brand-yellow/25 px-3 py-1">
                    <span className="text-brand-yellow text-sm">★</span>
                    <span className="text-[12px] text-brand-yellow/90 font-medium">
                      MVP in {insights.starPlayerBattles}/{insights.sampleSize} matches
                      {insights.starPlayerRate != null && insights.starPlayerRate >= 0.25
                        ? ' — teammates love you'
                        : ''}
                    </span>
                  </div>
                )}
                {/* account level + brawlers unlocked */}
                <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1">
                  <span className="text-[12px] text-white/55">
                    Lv {expLevel ?? '?'} · {brawlers.length} brawlers unlocked
                  </span>
                </div>
                {/* mode counts */}
                <div className="flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1">
                  <span className="text-[12px] text-white/55">
                    3v3: {typeof profileRec['3vs3Victories'] === 'number' ? profileRec['3vs3Victories'].toLocaleString() : '—'} wins ·
                    Solo: {typeof profileRec.soloVictories === 'number' ? profileRec.soloVictories.toLocaleString() : '—'} ·
                    Duo: {typeof profileRec.duoVictories === 'number' ? profileRec.duoVictories.toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* ── PERFORMANCE BAR CARDS ─────────────────────────────────── */}
          {insights && (
            <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <BarCard
                label="Win rate"
                value={formatPct(insights.overallWinRate)}
                pct={(insights.overallWinRate ?? 0) * 100}
                barColor="#4ade80"
                verdict={winRateVerdict(insights.overallWinRate)}
              />
              <BarCard
                label="Star player rate"
                value={formatPct(insights.starPlayerRate)}
                pct={(insights.starPlayerRate ?? 0) * 100}
                barColor="#f5cc00"
                verdict={starRateVerdict(insights.starPlayerRate)}
              />
              <BarCard
                label="Avg trophy change"
                value={
                  insights.avgTrophyDelta != null
                    ? `${insights.avgTrophyDelta >= 0 ? '+' : ''}${insights.avgTrophyDelta.toFixed(1)}`
                    : '—'
                }
                pct={
                  insights.avgTrophyDelta != null
                    ? Math.min(100, Math.abs(insights.avgTrophyDelta) * 10)
                    : 0
                }
                barColor={
                  insights.avgTrophyDelta != null && insights.avgTrophyDelta >= 0
                    ? '#4ade80'
                    : '#f87171'
                }
                verdict={trophyDeltaVerdict(insights.avgTrophyDelta)}
              />
              {worstCounter ? (
                <BarCard
                  label="💀 Dead weight moments"
                  value={`${worstCounter.worstOnTeamCount}/${worstCounter.matchesTracked}`}
                  pct={(worstCounter.worstRate ?? 0) * 100}
                  barColor="#f87171"
                  verdict={
                    (worstCounter.worstRate ?? 0) < 0.1
                      ? 'Rarely the weak link'
                      : (worstCounter.worstRate ?? 0) < 0.25
                        ? 'Happens to everyone'
                        : 'Carrying the team... backwards'
                  }
                />
              ) : (
                <BarCard
                  label="Brawlers"
                  value={String(brawlers.length)}
                  pct={Math.min(100, (brawlers.length / 80) * 100)}
                  barColor="#a78bfa"
                  verdict={
                    brawlers.length >= 60
                      ? 'Collector extraordinaire'
                      : brawlers.length >= 30
                        ? 'Good variety'
                        : 'Still building the roster'
                  }
                />
              )}
            </section>
          )}

          {/* ── BRAWLER + MODE SPOTLIGHT ──────────────────────────────── */}
          {insights && (insights.byBrawlerName.length > 0 || insights.byMode.length > 0) && (
            <section className="grid sm:grid-cols-2 gap-3 mb-6">
              {insights.byBrawlerName[0] && (
                <SpotlightCard
                  eyebrow="Your comfort pick"
                  title={insights.byBrawlerName[0].label}
                  battles={insights.byBrawlerName[0].battles}
                  winRate={insights.byBrawlerName[0].winRate}
                  avgDelta={insights.byBrawlerName[0].avgTrophyDelta}
                  accentColor="#a78bfa"
                />
              )}
              {insights.byMode[0] && (
                <SpotlightCard
                  eyebrow="Favourite playground"
                  title={insights.byMode[0].label}
                  battles={insights.byMode[0].battles}
                  winRate={insights.byMode[0].winRate}
                  avgDelta={insights.byMode[0].avgTrophyDelta}
                  accentColor="#38bdf8"
                />
              )}
            </section>
          )}

          {/* ── BATTLE FORM STRIP ─────────────────────────────────────── */}
          {battles.length > 0 && (
            <section className="rounded-xl border border-white/[0.08] bg-brand-surface p-4 md:p-5 mb-6">
              <h3 className="text-sm font-semibold text-white/80 mb-3">Recent form</h3>
              <div className="flex gap-1.5 flex-wrap">
                {battles.slice(0, 20).map((b, i) => (
                  <BattleDot key={i} battle={b} />
                ))}
              </div>
              <div className="flex gap-3 mt-3 text-[11px] text-white/35">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Win
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Loss
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white/20 inline-block" />
                  Draw
                </span>
              </div>
            </section>
          )}

          {/* ── MAP WIN-RATE BARS ─────────────────────────────────────── */}
          {insights && insights.byMapId.length > 0 && (
            <section className="rounded-xl border border-white/[0.08] bg-brand-surface p-4 md:p-5 mb-6">
              <h3 className="text-sm font-semibold text-white/80 mb-3">Win rate by map</h3>
              <div className="space-y-2">
                {insights.byMapId.slice(0, 8).map((m) => (
                  <MapBar key={m.key} map={m} />
                ))}
              </div>
            </section>
          )}

          {/* ── CLUB + ROTATION ROW ───────────────────────────────────── */}
          <section className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Club card */}
            <div className="rounded-xl border border-white/[0.08] bg-brand-surface p-4 md:p-5">
              <h3 className="text-sm font-semibold text-white/80 mb-3">Club</h3>
              {clubRec ? (
                <ClubCard
                  club={clubRec}
                  memberItems={memberItems}
                  viewedPlayerTag={playerTag}
                />
              ) : (
                <p className="text-[13px] text-white/35">No club found for this profile.</p>
              )}
            </div>

            {/* Rotation card */}
            <div className="rounded-xl border border-white/[0.08] bg-brand-surface p-4 md:p-5">
              <h3 className="text-sm font-semibold text-white/80 mb-3">Current rotation</h3>
              <ul className="space-y-2">
                {rotationItems(rotation)
                  .slice(0, 8)
                  .map((slot, idx) => {
                    const ev = eventFromRotationSlot(slot as Record<string, unknown>)
                    const mode = typeof ev.mode === 'string' ? ev.mode : 'Unknown mode'
                    const mapId = mapIdFromRotationEvent(ev)
                    const mapName =
                      typeof ev.map === 'string'
                        ? ev.map
                        : typeof ev.mapName === 'string'
                          ? ev.mapName
                          : 'Unknown map'
                    return (
                      <li
                        key={`${mapId ?? mapName}-${mode}-${idx}`}
                        className="rounded-lg border border-white/[0.07] px-3 py-2"
                      >
                        <p className="text-[13px] text-white/85">{mapName}</p>
                        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[12px] text-white/40">{mode}</span>
                          {mapId && (
                            <span className="flex gap-2">
                              <Link
                                href={`/maps?mapId=${encodeURIComponent(mapId)}`}
                                className="text-[12px] text-brand-yellow/80 hover:text-brand-yellow"
                              >
                                Maps
                              </Link>
                              <Link
                                href={`/strats/new?mapId=${encodeURIComponent(mapId)}&mode=${encodeURIComponent(mode)}`}
                                className="text-[12px] text-brand-yellow/80 hover:text-brand-yellow"
                              >
                                Strat
                              </Link>
                            </span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                {rotationItems(rotation).length === 0 && (
                  <li className="text-[13px] text-white/35">Rotation unavailable right now.</li>
                )}
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StreakPill({ type, length }: { type: 'win' | 'loss'; length: number }) {
  const isWin = type === 'win'
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${
        isWin
          ? 'bg-green-500/10 border-green-500/25'
          : 'bg-blue-400/10 border-blue-400/25'
      }`}
    >
      <span className="text-sm">{isWin ? '🔥' : '🧊'}</span>
      <span
        className={`text-[12px] font-medium ${isWin ? 'text-green-400' : 'text-blue-300'}`}
      >
        {isWin ? 'On fire!' : 'Cold streak'} ×{length}
      </span>
    </div>
  )
}

function BarCard({
  label,
  value,
  pct,
  barColor,
  verdict,
}: {
  label: string
  value: string
  pct: number
  barColor: string
  verdict: string
}) {
  const clampedPct = Math.max(0, Math.min(100, pct))
  return (
    <div className="rounded-lg border border-white/[0.08] bg-brand-black px-4 py-3 flex flex-col gap-2 relative overflow-hidden">
      {/* background bar */}
      <div
        className="absolute bottom-0 left-0 h-[3px] rounded-full transition-all duration-700"
        style={{ width: `${clampedPct}%`, background: barColor }}
      />
      <p className="text-[10px] uppercase tracking-wide text-white/35">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px]" style={{ color: `${barColor}cc` }}>
        {verdict}
      </p>
    </div>
  )
}

function SpotlightCard({
  eyebrow,
  title,
  battles,
  winRate,
  avgDelta,
  accentColor,
}: {
  eyebrow: string
  title: string
  battles: number
  winRate: number | null
  avgDelta: number | null
  accentColor: string
}) {
  return (
    <div
      className="rounded-xl border bg-brand-surface px-4 py-4 relative overflow-hidden"
      style={{ borderColor: `${accentColor}30` }}
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at bottom right, ${accentColor} 0%, transparent 70%)`,
        }}
      />
      <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: `${accentColor}99` }}>
        {eyebrow}
      </p>
      <p className="text-xl font-bold text-white">{title}</p>
      <div className="flex gap-4 mt-3 text-[12px] text-white/55">
        <span>{battles} games</span>
        <span style={{ color: accentColor }}>{formatPct(winRate)} win rate</span>
        {avgDelta != null && (
          <span className={avgDelta >= 0 ? 'text-green-400/80' : 'text-red-400/80'}>
            {avgDelta >= 0 ? '+' : ''}
            {avgDelta.toFixed(1)} avg trophies
          </span>
        )}
      </div>
      {/* win rate bar */}
      <div className="mt-3 h-1 rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.round((winRate ?? 0) * 100)}%`,
            background: accentColor,
          }}
        />
      </div>
    </div>
  )
}

function BattleDot({ battle }: { battle: BattleItem }) {
  const colorClass =
    battle.result === 'victory'
      ? 'bg-green-500 border-green-400/40'
      : battle.result === 'defeat'
        ? 'bg-red-500 border-red-400/40'
        : 'bg-white/20 border-white/10'

  return (
    <div className="group relative flex flex-col items-center gap-1">
      <div
        className={`w-7 h-7 rounded-md border ${colorClass} flex items-center justify-center cursor-default`}
      >
        {battle.brawlerName && (
          <span className="text-[7px] font-bold text-white/80 leading-none text-center px-0.5 truncate w-full text-center">
            {battle.brawlerName.substring(0, 3).toUpperCase()}
          </span>
        )}
      </div>
      {/* tooltip */}
      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10 hidden group-hover:block pointer-events-none">
        <div className="rounded-lg bg-brand-surface border border-white/[0.12] px-2 py-1.5 text-[11px] text-white/85 whitespace-nowrap shadow-lg">
          <p className="font-medium">{battle.mapName}</p>
          <p className="text-white/50">{battle.mode}</p>
        </div>
      </div>
    </div>
  )
}

function MapBar({
  map,
}: {
  map: import('@/lib/brawlstars/battleInsights').BattleSliceStats
}) {
  const pct = Math.round((map.winRate ?? 0) * 100)
  const barColor = pct >= 60 ? '#4ade80' : pct >= 45 ? '#f5cc00' : '#f87171'
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-white/75 w-36 truncate shrink-0">{map.label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/[0.07] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className="text-[12px] text-white/45 w-10 text-right tabular-nums">{pct}%</span>
      <span className="text-[11px] text-white/25 w-12 text-right tabular-nums">
        {map.battles}g
      </span>
    </div>
  )
}

function ClubCard({
  club,
  memberItems,
  viewedPlayerTag,
}: {
  club: Record<string, unknown>
  memberItems: Array<Record<string, unknown>>
  viewedPlayerTag: string
}) {
  const name = typeof club.name === 'string' ? club.name : 'Club'
  const tag = typeof club.tag === 'string' ? club.tag : ''
  const clubType = typeof club.type === 'string' ? club.type : ''
  const requiredTrophies =
    typeof club.requiredTrophies === 'number' ? club.requiredTrophies : null
  const description = typeof club.description === 'string' ? club.description : ''

  const sorted = memberItems
    .slice()
    .sort((a, b) => ((b.trophies as number) ?? 0) - ((a.trophies as number) ?? 0))

  // find viewer rank
  const normalizeForCompare = (t: string) =>
    t.replace('#', '').toUpperCase().replace(/[^0-9A-Z]/g, '')
  const viewerRank =
    sorted.findIndex(
      (m) =>
        typeof m.tag === 'string' &&
        normalizeForCompare(m.tag) === normalizeForCompare(viewedPlayerTag)
    ) + 1

  const typeLabel: Record<string, string> = {
    open: 'Open',
    inviteOnly: 'Invite Only',
    closed: 'Closed',
    unknown: '—',
  }
  const typeColor: Record<string, string> = {
    open: '#4ade80',
    inviteOnly: '#f5cc00',
    closed: '#f87171',
  }

  const rankColors = ['#f5cc00', '#94a3b8', '#cd7c3a']

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-lg font-semibold text-white">{name}</p>
          <p className="text-xs text-white/35 font-mono">{tag}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {clubType && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{
                color: typeColor[clubType] ?? '#94a3b8',
                borderColor: `${typeColor[clubType] ?? '#94a3b8'}44`,
                background: `${typeColor[clubType] ?? '#94a3b8'}11`,
              }}
            >
              {typeLabel[clubType] ?? clubType}
            </span>
          )}
          {requiredTrophies != null && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/15 text-white/55 bg-white/[0.04]">
              {requiredTrophies.toLocaleString()} 🏆 req.
            </span>
          )}
        </div>
      </div>

      {viewerRank > 0 && (
        <p className="text-[12px] text-brand-yellow/80 mb-2">
          You are #{viewerRank} in this club
        </p>
      )}

      {description && (
        <p className="text-[12px] text-white/45 mb-3 line-clamp-2">{description}</p>
      )}

      <p className="text-[11px] text-white/30 mb-1.5">
        {sorted.length} members — sorted by trophies
      </p>
      <ul className="space-y-1 max-h-56 overflow-y-auto pr-1">
        {sorted.slice(0, 25).map((member, idx) => (
          <li
            key={`${member.tag ?? idx}`}
            className="text-[12px] flex justify-between gap-2 items-center"
          >
            <span
              className="font-medium"
              style={{ color: idx < 3 ? rankColors[idx] : 'rgba(255,255,255,0.8)' }}
            >
              {idx < 3 && <span className="mr-1">{['🥇', '🥈', '🥉'][idx]}</span>}
              {String(member.name ?? 'Unknown')}
            </span>
            <span className="text-white/35">{String(member.role ?? 'member')}</span>
            <span className="font-mono text-white/60 ml-auto">
              {typeof member.trophies === 'number'
                ? member.trophies.toLocaleString()
                : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
