import { NextResponse } from 'next/server'
import { BrawlStarsUpstreamError, brawlStarsGet } from '@/lib/brawlstars/upstream'
import { normalizeTag, tagToPathSegment } from '@/lib/brawlstars/normalizeTag'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

type PlayerRow = {
  tag: string
  brawlerTrophies: number | null
}

type DerivedMatchRow = {
  player_tag: string
  battle_time: string
  mode: string
  map_id: string
  team_size: number
  metric_name: string
  player_metric: number | null
  team_min_metric: number | null
  is_worst_on_team: boolean
  raw_result: Record<string, unknown>
}

function readModeAndMap(item: Record<string, unknown>): { mode: string; mapId: string } {
  const event =
    item.event && typeof item.event === 'object'
      ? (item.event as Record<string, unknown>)
      : {}
  const mode = typeof event.mode === 'string' ? event.mode : 'unknown'
  const mapId =
    event.mapId != null ? String(event.mapId) : event.id != null ? String(event.id) : 'unknown'
  return { mode, mapId }
}

function normTag(t: unknown): string {
  if (typeof t !== 'string') return ''
  return normalizeTag(t) ?? ''
}

function extractTeamRows(team: unknown): PlayerRow[] {
  if (!Array.isArray(team)) return []
  const rows: PlayerRow[] = []
  for (const player of team) {
    if (!player || typeof player !== 'object') continue
    const rec = player as Record<string, unknown>
    const brawler =
      rec.brawler && typeof rec.brawler === 'object'
        ? (rec.brawler as Record<string, unknown>)
        : {}
    rows.push({
      tag: normTag(rec.tag),
      brawlerTrophies:
        typeof brawler.trophies === 'number' && Number.isFinite(brawler.trophies)
          ? brawler.trophies
          : null,
    })
  }
  return rows
}

function deriveRow(item: unknown, playerTag: string): DerivedMatchRow | null {
  if (!item || typeof item !== 'object') return null
  const rec = item as Record<string, unknown>
  const battleTime = typeof rec.battleTime === 'string' ? rec.battleTime : null
  if (!battleTime) return null

  const { mode, mapId } = readModeAndMap(rec)
  const battle =
    rec.battle && typeof rec.battle === 'object'
      ? (rec.battle as Record<string, unknown>)
      : {}

  const teams = Array.isArray(battle.teams) ? battle.teams : []
  let myTeam: PlayerRow[] | null = null

  for (const team of teams) {
    const rows = extractTeamRows(team)
    if (rows.some((r) => r.tag === playerTag)) {
      myTeam = rows
      break
    }
  }

  if (!myTeam || myTeam.length === 0) return null
  const self = myTeam.find((p) => p.tag === playerTag)
  if (!self) return null

  const metricCandidates = myTeam
    .map((p) => p.brawlerTrophies)
    .filter((n): n is number => typeof n === 'number')
  const teamMinMetric = metricCandidates.length > 0 ? Math.min(...metricCandidates) : null
  const isWorstOnTeam =
    self.brawlerTrophies != null && teamMinMetric != null ? self.brawlerTrophies === teamMinMetric : false

  return {
    player_tag: playerTag,
    battle_time: battleTime,
    mode,
    map_id: mapId,
    team_size: myTeam.length,
    metric_name: 'brawler_trophies',
    player_metric: self.brawlerTrophies,
    team_min_metric: teamMinMetric,
    is_worst_on_team: isWorstOnTeam,
    raw_result: {
      battleResult: typeof battle.result === 'string' ? battle.result : 'unknown',
      rank: typeof battle.rank === 'number' ? battle.rank : null,
    },
  }
}

export async function GET(
  _: Request,
  context: { params: { playerTag: string } }
) {
  try {
    const normalized = normalizeTag(context.params.playerTag)
    if (!normalized) {
      return NextResponse.json(
        { error: 'Invalid player tag.' },
        { status: 400 }
      )
    }

    const encoded = tagToPathSegment(normalized)
    let items: unknown[] = []
    try {
      const payload = await brawlStarsGet(`/players/${encoded}/battlelog`)
      const rec = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}
      items = Array.isArray(rec.items) ? rec.items : []
    } catch (error) {
      if (!(error instanceof BrawlStarsUpstreamError && error.code === 'not_found')) {
        throw error
      }
      items = []
    }

    const rows = items
      .map((item) => deriveRow(item, normalized))
      .filter((row): row is DerivedMatchRow => row != null)

    const supabase = getSupabaseAdminClient()
    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from('player_worst_stat_matches')
        .upsert(rows, { onConflict: 'player_tag,battle_time,mode,map_id' })
      if (upsertError) {
        return NextResponse.json(
          {
            error: 'Supabase upsert failed.',
            reason: upsertError.message,
          },
          { status: 500 }
        )
      }
    }

    const { data: trackedRows, error: selectError } = await supabase
      .from('player_worst_stat_matches')
      .select('battle_time,is_worst_on_team')
      .eq('player_tag', normalized)
      .order('battle_time', { ascending: false })

    if (selectError) {
      return NextResponse.json(
        { error: 'Supabase select failed.', reason: selectError.message },
        { status: 500 }
      )
    }

    const tracked = trackedRows ?? []
    const matchesTracked = tracked.length
    const worstOnTeamCount = tracked.reduce(
      (acc, row) => (row.is_worst_on_team ? acc + 1 : acc),
      0
    )
    const latestBattleTime =
      matchesTracked > 0 ? String(tracked[0].battle_time) : null

    return NextResponse.json({
      playerTag: normalized,
      matchesTracked,
      worstOnTeamCount,
      worstRate: matchesTracked > 0 ? worstOnTeamCount / matchesTracked : null,
      latestBattleTime,
      metric: 'brawler_trophies',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to compute worst counter.',
        reason: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
