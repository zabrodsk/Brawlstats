/**
 * Pure helpers over Supercell battle log `items` entries.
 * @see https://developer.brawlstars.com
 */

export interface BattleSliceStats {
  key: string
  label: string
  battles: number
  wins: number
  winRate: number | null
  trophyDeltaSum: number
  avgTrophyDelta: number | null
}

export interface BattleLogInsights {
  sampleSize: number
  overallWinRate: number | null
  currentStreak: { type: 'win' | 'loss' | 'none'; length: number }
  trophyDeltaSum: number
  avgTrophyDelta: number | null
  starPlayerBattles: number
  starPlayerRate: number | null
  byMode: BattleSliceStats[]
  byMapId: BattleSliceStats[]
  byBrawlerName: BattleSliceStats[]
  highVarianceMaps: { mapId: string; label: string; absAvgTrophyDelta: number }[]
}

function normTag(t: string | undefined | null): string {
  if (!t) return ''
  let s = String(t).trim().toUpperCase()
  try {
    s = decodeURIComponent(s)
  } catch {
    /* ignore */
  }
  s = s.replace(/^#/, '')
  return `#${s.replace(/[^0-9A-Z]/g, '')}`
}

function tagsEqual(a: string, b: string): boolean {
  return normTag(a) === normTag(b)
}

type ParsedBattle = {
  result: 'victory' | 'defeat' | 'draw' | 'unknown'
  mode: string
  mapId: string
  mapLabel: string
  trophyChange: number | null
  isStarPlayer: boolean
  myBrawlerName: string | null
}

function parseItem(item: unknown, playerTag: string): ParsedBattle | null {
  if (!item || typeof item !== 'object') return null
  const rec = item as Record<string, unknown>
  const event = rec.event && typeof rec.event === 'object' ? (rec.event as Record<string, unknown>) : {}
  const battle = rec.battle && typeof rec.battle === 'object' ? (rec.battle as Record<string, unknown>) : {}

  const mode = typeof event.mode === 'string' ? event.mode : 'unknown'
  const mapId =
    event.mapId != null ? String(event.mapId) : event.id != null ? String(event.id) : 'unknown'
  const mapLabel =
    typeof event.map === 'string'
      ? event.map
      : typeof event.mapName === 'string'
        ? event.mapName
        : mapId

  let result: ParsedBattle['result'] = 'unknown'
  const br = battle.result
  if (br === 'victory' || br === 'defeat' || br === 'draw') result = br

  let trophyChange: number | null = null
  if (typeof battle.trophyChange === 'number' && Number.isFinite(battle.trophyChange)) {
    trophyChange = battle.trophyChange
  }

  let isStarPlayer = false
  const sp = battle.starPlayer
  if (sp && typeof sp === 'object' && 'tag' in sp) {
    isStarPlayer = tagsEqual(String((sp as { tag?: string }).tag), playerTag)
  }

  let myBrawlerName: string | null = null
  const teams = battle.teams
  if (Array.isArray(teams)) {
    for (const team of teams) {
      if (!Array.isArray(team)) continue
      for (const p of team) {
        if (!p || typeof p !== 'object') continue
        const pr = p as Record<string, unknown>
        if (tagsEqual(String(pr.tag), playerTag)) {
          const b = pr.brawler && typeof pr.brawler === 'object' ? (pr.brawler as Record<string, unknown>) : {}
          myBrawlerName = typeof b.name === 'string' ? b.name : null
          break
        }
      }
      if (myBrawlerName) break
    }
  }

  const players = battle.players
  if (!myBrawlerName && Array.isArray(players)) {
    for (const p of players) {
      if (!p || typeof p !== 'object') continue
      const pr = p as Record<string, unknown>
      if (tagsEqual(String(pr.tag), playerTag)) {
        const b = pr.brawler && typeof pr.brawler === 'object' ? (pr.brawler as Record<string, unknown>) : {}
        myBrawlerName = typeof b.name === 'string' ? b.name : null
        break
      }
    }
  }

  return { result, mode, mapId, mapLabel, trophyChange, isStarPlayer, myBrawlerName }
}

function emptySlice(key: string, label: string): BattleSliceStats {
  return {
    key,
    label,
    battles: 0,
    wins: 0,
    winRate: null,
    trophyDeltaSum: 0,
    avgTrophyDelta: null,
  }
}

function finalizeSlice(s: BattleSliceStats): BattleSliceStats {
  if (s.battles === 0) return s
  return {
    ...s,
    winRate: s.wins / s.battles,
    avgTrophyDelta: s.trophyDeltaSum / s.battles,
  }
}

export function computeBattleLogInsights(items: unknown[], playerTag: string): BattleLogInsights {
  const tag = normTag(playerTag)
  const parsed: ParsedBattle[] = []
  for (const it of items) {
    const p = parseItem(it, tag)
    if (p) parsed.push(p)
  }

  const n = parsed.length
  let wins = 0
  let trophyDeltaSum = 0
  let trophySamples = 0
  let starPlayerBattles = 0

  const modeMap = new Map<string, BattleSliceStats>()
  const mapMap = new Map<string, BattleSliceStats>()
  const brawlerMap = new Map<string, BattleSliceStats>()

  for (const b of parsed) {
    if (b.result === 'victory') wins++
    if (b.trophyChange != null) {
      trophyDeltaSum += b.trophyChange
      trophySamples++
    }
    if (b.isStarPlayer) starPlayerBattles++

    const mkMode = (key: string, label: string) => modeMap.get(key) ?? emptySlice(key, label)
    const ms = mkMode(b.mode, b.mode)
    ms.battles++
    if (b.result === 'victory') ms.wins++
    if (b.trophyChange != null) ms.trophyDeltaSum += b.trophyChange
    modeMap.set(b.mode, ms)

    const mkMap = () => mapMap.get(b.mapId) ?? emptySlice(b.mapId, b.mapLabel)
    const mp = mkMap()
    mp.battles++
    if (b.result === 'victory') mp.wins++
    if (b.trophyChange != null) mp.trophyDeltaSum += b.trophyChange
    mapMap.set(b.mapId, mp)

    const brName = b.myBrawlerName ?? 'Unknown'
    const mb = brawlerMap.get(brName) ?? emptySlice(brName, brName)
    mb.battles++
    if (b.result === 'victory') mb.wins++
    if (b.trophyChange != null) mb.trophyDeltaSum += b.trophyChange
    brawlerMap.set(brName, mb)
  }

  // Streak: items are typically newest-first
  let currentStreak: BattleLogInsights['currentStreak'] = { type: 'none', length: 0 }
  if (parsed.length > 0) {
    const first = parsed[0].result
    if (first === 'victory' || first === 'defeat') {
      const type = first === 'victory' ? 'win' : 'loss'
      let len = 0
      for (const b of parsed) {
        if (b.result !== first) break
        len++
      }
      currentStreak = { type, length: len }
    }
  }

  const byMode = Array.from(modeMap.values())
    .map(finalizeSlice)
    .filter((s) => s.battles > 0)
    .sort((a, b) => b.battles - a.battles)

  const byMapId = Array.from(mapMap.values())
    .map(finalizeSlice)
    .filter((s) => s.battles > 0)
    .sort((a, b) => b.battles - a.battles)

  const byBrawlerName = Array.from(brawlerMap.values())
    .map(finalizeSlice)
    .filter((s) => s.battles > 0)
    .sort((a, b) => b.battles - a.battles)

  const highVarianceMaps = byMapId
    .filter((s) => s.battles >= 2 && s.avgTrophyDelta != null)
    .map((s) => ({
      mapId: s.key,
      label: s.label,
      absAvgTrophyDelta: Math.abs(s.avgTrophyDelta ?? 0),
    }))
    .sort((a, b) => b.absAvgTrophyDelta - a.absAvgTrophyDelta)
    .slice(0, 5)

  return {
    sampleSize: n,
    overallWinRate: n ? wins / n : null,
    currentStreak,
    trophyDeltaSum,
    avgTrophyDelta: trophySamples ? trophyDeltaSum / trophySamples : null,
    starPlayerBattles,
    starPlayerRate: n ? starPlayerBattles / n : null,
    byMode,
    byMapId,
    byBrawlerName,
    highVarianceMaps,
  }
}
