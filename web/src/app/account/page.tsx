'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { normalizeTag, tagToPathSegment } from '@/lib/brawlstars/normalizeTag'
import {
  readKnownProfileHints,
  rememberKnownProfile,
  resolveTagFromInput,
} from '@/lib/brawlstars/profileHints'
import type { BattleLogInsights, BattleSliceStats } from '@/lib/brawlstars/battleInsights'
import {
  fetchBrawlStarsHealth,
  fetchPlayer,
  fetchBattleLog,
  fetchClub,
  fetchClubMembers,
  fetchEventRotation,
} from '@/lib/brawlstars/client'
import { mapIdFromRotationEvent } from '@/lib/brawlstars/rotationSlot'

const STORAGE_PLAYER = 'brawlstars_player_tag'
const STORAGE_CLUB = 'brawlstars_club_tag_override'

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return `${Math.round(n * 100)}%`
}

function safePlayer(rec: unknown): Record<string, unknown> | null {
  return rec && typeof rec === 'object' ? (rec as Record<string, unknown>) : null
}

function rotationSlots(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (Array.isArray(d.current)) return d.current as Array<Record<string, unknown>>
    if (Array.isArray(d.items)) return d.items as Array<Record<string, unknown>>
  }
  return []
}

function slotMeta(slot: Record<string, unknown>): {
  mapId: string | null
  mode: string | null
  mapName: string | null
} {
  const ev =
    slot.event && typeof slot.event === 'object'
      ? (slot.event as Record<string, unknown>)
      : slot
  const mapId = mapIdFromRotationEvent(ev)
  const mode = typeof ev.mode === 'string' ? ev.mode : null
  const mapName =
    typeof ev.map === 'string'
      ? ev.map
      : typeof ev.mapName === 'string'
        ? ev.mapName
        : mapId
  return { mapId, mode, mapName }
}

export default function AccountPage() {
  const [apiReady, setApiReady] = useState<boolean | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [playerTag, setPlayerTag] = useState<string | null>(null)
  const [clubOverride, setClubOverride] = useState('')

  const [profile, setProfile] = useState<unknown>(null)
  const [battlePayload, setBattlePayload] = useState<{
    items: unknown[]
    insights: BattleLogInsights
  } | null>(null)
  const [club, setClub] = useState<unknown>(null)
  const [members, setMembers] = useState<unknown>(null)
  const [rotation, setRotation] = useState<unknown>(null)
  const [knownHints] = useState(readKnownProfileHints())

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = window.localStorage.getItem(STORAGE_PLAYER)
    const c = window.localStorage.getItem(STORAGE_CLUB)
    if (p) {
      setTagInput(p)
      setPlayerTag(normalizeTag(p))
    }
    if (c) setClubOverride(c)
  }, [])

  useEffect(() => {
    fetchBrawlStarsHealth()
      .then((h) => setApiReady(h.hasToken))
      .catch(() => setApiReady(false))
  }, [])

  const encodedPlayer = useMemo(
    () => (playerTag ? tagToPathSegment(playerTag) : ''),
    [playerTag]
  )

  const loadAll = useCallback(async () => {
    if (!encodedPlayer) return
    setLoading(true)
    setErr(null)
    try {
      const [p, b] = await Promise.all([fetchPlayer(encodedPlayer), fetchBattleLog(encodedPlayer)])
      setProfile(p)
      setBattlePayload(b)
      const playerRec = safePlayer(p)
      if (playerRec && typeof playerRec.tag === 'string') {
        rememberKnownProfile(
          playerRec.tag,
          typeof playerRec.name === 'string' ? playerRec.name : null
        )
      }

      const pr = safePlayer(p)
      const clubTagRaw =
        (clubOverride && normalizeTag(clubOverride)) ||
        (pr?.club && typeof pr.club === 'object'
          ? normalizeTag(String((pr.club as Record<string, unknown>).tag ?? ''))
          : null)

      if (clubTagRaw) {
        const enc = tagToPathSegment(clubTagRaw)
        const [c, m] = await Promise.all([fetchClub(enc), fetchClubMembers(enc)])
        setClub(c)
        setMembers(m)
      } else {
        setClub(null)
        setMembers(null)
      }

      try {
        const rot = await fetchEventRotation()
        setRotation(rot)
      } catch {
        setRotation(null)
      }
    } catch (e) {
      setProfile(null)
      setBattlePayload(null)
      setClub(null)
      setMembers(null)
      setRotation(null)
      setErr(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [encodedPlayer, clubOverride])

  useEffect(() => {
    if (encodedPlayer) void loadAll()
  }, [encodedPlayer, loadAll])

  const memberList = useMemo(() => {
    if (!members) return []
    if (Array.isArray(members)) return members as Record<string, unknown>[]
    if (typeof members !== 'object') return []
    const m = members as Record<string, unknown>
    const items = m.items
    if (!Array.isArray(items)) return []
    return items as Record<string, unknown>[]
  }, [members])

  const saveTags = () => {
    const n = resolveTagFromInput(tagInput, knownHints)
    if (!n || typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_PLAYER, n)
    setPlayerTag(n)
    const co = clubOverride.trim()
    if (co) {
      const cn = normalizeTag(co)
      if (cn) window.localStorage.setItem(STORAGE_CLUB, cn)
    } else {
      window.localStorage.removeItem(STORAGE_CLUB)
    }
  }

  const pr = safePlayer(profile)
  const name = typeof pr?.name === 'string' ? pr.name : 'Player'
  const iconId =
    pr?.icon && typeof pr.icon === 'object' && pr.icon !== null
      ? String((pr.icon as Record<string, unknown>).id ?? '')
      : ''
  const iconUrl =
    iconId && !Number.isNaN(Number(iconId))
      ? `https://cdn.brawlify.com/profile-icons/regular/${iconId}.png`
      : null
  const trophies = typeof pr?.trophies === 'number' ? pr.trophies : null
  const best = typeof pr?.bestTrophies === 'number' ? pr.bestTrophies : null
  const expLevel = typeof pr?.expLevel === 'number' ? pr.expLevel : null
  const v3 = typeof pr?.['3vs3Victories'] === 'number' ? pr['3vs3Victories'] : null
  const solo = typeof pr?.soloVictories === 'number' ? pr.soloVictories : null
  const duo = typeof pr?.duoVictories === 'number' ? pr.duoVictories : null

  const brawlers = Array.isArray(pr?.brawlers) ? (pr!.brawlers as Record<string, unknown>[]) : []

  const insights = battlePayload?.insights

  return (
    <div className="px-5 py-6 md:px-8 md:py-8 bg-brand-black min-h-full max-w-4xl">
      <div className="mb-8">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/25">Account</span>
        <h1 className="mt-1.5 text-2xl md:text-3xl font-bold tracking-[-0.02em] text-white">Brawl Stars profile</h1>
        <p className="mt-1.5 text-[14px] text-white/35">
          Live stats via Supercell API (token stays on the server). Saved tag is stored in this browser only.
        </p>
      </div>

      {apiReady === false && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-200/90">
          Server token missing: set <code className="text-amber-100/90">BRAWL_STARS_API_TOKEN</code> in{' '}
          <code className="text-amber-100/90">web/.env.local</code> and restart <code className="text-amber-100/90">npm run dev</code>.
        </div>
      )}

      <section className="rounded-xl border border-white/[0.08] bg-brand-surface p-4 md:p-5 mb-8">
        <h2 className="text-sm font-semibold text-white/80 mb-3">Player tag</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1">
            <label className="text-[11px] uppercase tracking-wide text-white/30 block mb-1">Tag</label>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="#2PP…"
              list="account-known-hints"
              className="w-full bg-brand-black border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-white/25"
            />
            <datalist id="account-known-hints">
              {knownHints.map((hint) => (
                <option key={hint.tag} value={hint.tag}>
                  {hint.name}
                </option>
              ))}
            </datalist>
            <p className="mt-1 text-[11px] text-white/35">
              API supports tag lookup only. Name suggestions here are local hints from profiles loaded on this device.
            </p>
          </div>
          <div className="flex-1 sm:max-w-xs">
            <label className="text-[11px] uppercase tracking-wide text-white/30 block mb-1">
              Club tag (optional override)
            </label>
            <input
              value={clubOverride}
              onChange={(e) => setClubOverride(e.target.value)}
              placeholder="Leave empty to use club from profile"
              className="w-full bg-brand-black border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-white/25"
            />
          </div>
          <button
            type="button"
            onClick={saveTags}
            className="shrink-0 rounded-lg bg-brand-yellow px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400"
          >
            Save &amp; load
          </button>
        </div>
      </section>

      {err && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-200/90">
          {err}
        </div>
      )}

      {loading && <p className="text-white/40 text-sm mb-6">Loading…</p>}

      {pr && (
        <>
          <section className="rounded-xl border border-white/[0.08] bg-brand-surface p-4 md:p-6 mb-8">
            <div className="flex flex-wrap items-start gap-4">
              {iconUrl && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-brand-black border border-white/[0.08] shrink-0">
                  <Image src={iconUrl} alt="" fill className="object-cover" sizes="64px" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-white">{name}</h2>
                <p className="text-sm text-white/40 font-mono mt-0.5">{playerTag}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-[13px] text-white/60">
                  {trophies != null && (
                    <span>
                      Trophies: <span className="text-white font-medium">{trophies}</span>
                    </span>
                  )}
                  {best != null && (
                    <span>
                      Best: <span className="text-white font-medium">{best}</span>
                    </span>
                  )}
                  {expLevel != null && (
                    <span>
                      Level: <span className="text-white font-medium">{expLevel}</span>
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-white/45">
                  {v3 != null && <span>3v3 wins: {v3}</span>}
                  {solo != null && <span>Solo: {solo}</span>}
                  {duo != null && <span>Duo: {duo}</span>}
                </div>
              </div>
            </div>
          </section>

          {brawlers.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold text-white/70 mb-3">Brawler roster</h2>
              <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                <table className="w-full text-left text-[12px] text-white/70">
                  <thead className="bg-brand-black/80 text-white/40 uppercase tracking-wide text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Brawler</th>
                      <th className="px-3 py-2">Power</th>
                      <th className="px-3 py-2">Rank</th>
                      <th className="px-3 py-2">Trophies</th>
                      <th className="px-3 py-2 hidden sm:table-cell">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brawlers.map((b) => {
                      const id = b.id != null ? String(b.id) : ''
                      const bname = typeof b.name === 'string' ? b.name : id
                      const power = typeof b.power === 'number' ? b.power : '—'
                      const rank = typeof b.rank === 'number' ? b.rank : '—'
                      const tro = typeof b.trophies === 'number' ? b.trophies : '—'
                      return (
                        <tr key={id || bname} className="border-t border-white/[0.06]">
                          <td className="px-3 py-2 text-white/90">{bname}</td>
                          <td className="px-3 py-2">{power}</td>
                          <td className="px-3 py-2">{rank}</td>
                          <td className="px-3 py-2">{tro}</td>
                          <td className="px-3 py-2 hidden sm:table-cell">
                            {id ? (
                              <Link
                                href={`/brawlers#brawler-${encodeURIComponent(id)}`}
                                className="text-brand-yellow/80 hover:text-brand-yellow"
                              >
                                Details
                              </Link>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {insights && insights.sampleSize > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold text-white/70 mb-3">Battle log insights</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <StatCard label="Win rate" value={pct(insights.overallWinRate)} />
                <StatCard
                  label="Streak"
                  value={
                    insights.currentStreak.type === 'none'
                      ? '—'
                      : `${insights.currentStreak.type} ×${insights.currentStreak.length}`
                  }
                />
                <StatCard
                  label="Avg trophy Δ"
                  value={
                    insights.avgTrophyDelta == null
                      ? '—'
                      : insights.avgTrophyDelta.toFixed(1)
                  }
                />
                <StatCard label="Star player rate" value={pct(insights.starPlayerRate)} />
              </div>
              <SliceTable title="By mode" rows={insights.byMode} />
              <SliceTable title="By map" rows={insights.byMapId} mapLink />
              <SliceTable title="By your brawler" rows={insights.byBrawlerName} />
              {insights.highVarianceMaps.length > 0 && (
                <div className="mt-4 text-[12px] text-white/45">
                  High trophy swing maps:{' '}
                  {insights.highVarianceMaps.map((m) => m.label).join(', ')}
                </div>
              )}
            </section>
          )}

          {battlePayload && battlePayload.items.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold text-white/70 mb-3">Recent battles</h2>
              <ul className="space-y-2 text-[12px] text-white/60">
                {battlePayload.items.slice(0, 15).map((raw, i) => {
                  const it = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
                  const ev =
                    it.event && typeof it.event === 'object'
                      ? (it.event as Record<string, unknown>)
                      : {}
                  const battle =
                    it.battle && typeof it.battle === 'object'
                      ? (it.battle as Record<string, unknown>)
                      : {}
                  const res = typeof battle.result === 'string' ? battle.result : '—'
                  const mode = typeof ev.mode === 'string' ? ev.mode : '—'
                  const mapId = ev.mapId != null ? String(ev.mapId) : ''
                  const mapName =
                    typeof ev.map === 'string' ? ev.map : typeof ev.mapName === 'string' ? ev.mapName : mapId
                  const dt = typeof it.battleTime === 'string' ? it.battleTime : ''
                  return (
                    <li
                      key={`${dt}-${i}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-brand-surface px-3 py-2"
                    >
                      <span className="text-white/80">
                        {mapName}{' '}
                        <span className="text-white/35">· {mode}</span>
                      </span>
                      <span
                        className={
                          res === 'victory'
                            ? 'text-emerald-400/90'
                            : res === 'defeat'
                              ? 'text-red-400/80'
                              : 'text-white/40'
                        }
                      >
                        {res}
                      </span>
                      {mapId && (
                        <span className="flex gap-2 w-full sm:w-auto justify-end">
                          <Link
                            href={`/maps?mapId=${encodeURIComponent(mapId)}`}
                            className="text-brand-yellow/80 hover:text-brand-yellow"
                          >
                            Map
                          </Link>
                          <Link
                            href={`/strats/new?mapId=${encodeURIComponent(mapId)}&mode=${encodeURIComponent(String(mode))}`}
                            className="text-brand-yellow/80 hover:text-brand-yellow"
                          >
                            Strat
                          </Link>
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {club && typeof club === 'object' && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold text-white/70 mb-2">Club</h2>
              <p className="text-lg text-white font-medium">
                {String((club as Record<string, unknown>).name ?? 'Club')}
              </p>
              <p className="text-xs text-white/35 font-mono mb-4">
                {String((club as Record<string, unknown>).tag ?? '')}
              </p>
              {memberList.length > 0 && (
                <ul className="rounded-xl border border-white/[0.08] divide-y divide-white/[0.06] text-[12px]">
                  {memberList.map((mem) => (
                    <li key={String(mem.tag)} className="px-3 py-2 flex justify-between gap-2 text-white/70">
                      <span className="text-white/90">{String(mem.name ?? '')}</span>
                      <span className="text-white/40">{String(mem.role ?? '')}</span>
                      <span className="font-mono text-[11px]">{String(mem.trophies ?? '')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      <section className="mb-10">
        <h2 className="text-sm font-semibold text-white/70 mb-3">Live rotation</h2>
        {rotation == null && <p className="text-white/35 text-sm">No rotation data (endpoint or key).</p>}
        {rotation != null && (
          <ul className="space-y-2">
            {rotationSlots(rotation).slice(0, 12).map((slot, idx) => {
              const { mapId, mode, mapName } = slotMeta(slot)
              return (
                <li
                  key={idx}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-brand-surface px-3 py-2 text-[13px] text-white/75"
                >
                  <span>
                    {mapName ?? mapId ?? 'Event'}{' '}
                    <span className="text-white/35">· {mode ?? '—'}</span>
                  </span>
                  {mapId && (
                    <span className="flex gap-2">
                      <Link
                        href={`/maps?mapId=${encodeURIComponent(mapId)}`}
                        className="text-brand-yellow/80 hover:text-brand-yellow text-[12px]"
                      >
                        Maps
                      </Link>
                      <Link
                        href={`/strats/new?mapId=${encodeURIComponent(mapId)}&mode=${encodeURIComponent(mode ?? '')}`}
                        className="text-brand-yellow/80 hover:text-brand-yellow text-[12px]"
                      >
                        Strat
                      </Link>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-brand-surface px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-white/35">{label}</p>
      <p className="text-lg font-semibold text-white mt-0.5">{value}</p>
    </div>
  )
}

function SliceTable({
  title,
  rows,
  mapLink,
}: {
  title: string
  rows: BattleSliceStats[]
  mapLink?: boolean
}) {
  if (rows.length === 0) return null
  return (
    <div className="mb-4">
      <h3 className="text-[11px] uppercase tracking-wide text-white/35 mb-2">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
        <table className="w-full text-left text-[11px] text-white/65">
          <thead className="bg-brand-black/80 text-white/35">
            <tr>
              <th className="px-2 py-1.5">Key</th>
              <th className="px-2 py-1.5">n</th>
              <th className="px-2 py-1.5">WR</th>
              <th className="px-2 py-1.5">Avg Δ</th>
              {mapLink && <th className="px-2 py-1.5"> </th>}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((r) => (
              <tr key={r.key} className="border-t border-white/[0.05]">
                <td className="px-2 py-1.5 text-white/85">{r.label}</td>
                <td className="px-2 py-1.5">{r.battles}</td>
                <td className="px-2 py-1.5">{pct(r.winRate)}</td>
                <td className="px-2 py-1.5">
                  {r.avgTrophyDelta == null ? '—' : r.avgTrophyDelta.toFixed(1)}
                </td>
                {mapLink && (
                  <td className="px-2 py-1.5">
                    <Link
                      href={`/maps?mapId=${encodeURIComponent(r.key)}`}
                      className="text-brand-yellow/70 hover:text-brand-yellow"
                    >
                      →
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
