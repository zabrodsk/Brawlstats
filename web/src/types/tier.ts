export type TierLetter = 'S' | 'A' | 'B' | 'C' | 'D'

export const TIER_ORDER: TierLetter[] = ['S', 'A', 'B', 'C', 'D']

export interface TierBoardState {
  /** Unassigned brawler ids */
  pool: string[]
  tiers: Record<TierLetter, string[]>
  updatedAt: string
}

export function emptyTierBoard(): TierBoardState {
  return {
    pool: [],
    tiers: { S: [], A: [], B: [], C: [], D: [] },
    updatedAt: new Date().toISOString(),
  }
}

export function mergeTierBoard(
  saved: TierBoardState | undefined,
  allBrawlerIds: string[]
): TierBoardState {
  const base = saved ?? emptyTierBoard()
  const poolSource = Array.isArray(base.pool) ? base.pool : []
  const tiersSafe: Record<TierLetter, string[]> = {
    S: [...(base.tiers?.S ?? [])],
    A: [...(base.tiers?.A ?? [])],
    B: [...(base.tiers?.B ?? [])],
    C: [...(base.tiers?.C ?? [])],
    D: [...(base.tiers?.D ?? [])],
  }
  const known = new Set<string>([...poolSource, ...TIER_ORDER.flatMap((t) => tiersSafe[t])])
  const pool = [...poolSource]
  for (const id of allBrawlerIds) {
    if (!known.has(id)) pool.push(id)
  }
  pool.sort((a, b) => Number(a) - Number(b))
  return {
    pool,
    tiers: tiersSafe,
    updatedAt: base.updatedAt || new Date().toISOString(),
  }
}

/** Accept persisted v2 shape or legacy `{ assignments }` only. */
export function parseTierBoardState(raw: unknown): TierBoardState | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  if ('tiers' in o && typeof o.tiers === 'object' && o.tiers !== null) {
    return raw as TierBoardState
  }
  if ('assignments' in o && typeof o.assignments === 'object' && o.assignments !== null) {
    const assignments = o.assignments as Record<string, string>
    const tiers: Record<TierLetter, string[]> = { S: [], A: [], B: [], C: [], D: [] }
    for (const [bid, t] of Object.entries(assignments)) {
      if (TIER_ORDER.includes(t as TierLetter)) {
        tiers[t as TierLetter].push(bid)
      }
    }
    return {
      pool: [],
      tiers,
      updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
    }
  }
  return undefined
}
