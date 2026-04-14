/** Browser-safe helpers: call same-origin `/api/brawlstars/*` only. */

export async function fetchBrawlStarsHealth(): Promise<{ ok: boolean; hasToken: boolean }> {
  const res = await fetch('/api/brawlstars/health', { cache: 'no-store' })
  if (!res.ok) throw new Error('Health check failed')
  return res.json()
}

export async function fetchPlayer(playerTagEncoded: string): Promise<unknown> {
  const res = await fetch(`/api/brawlstars/players/${playerTagEncoded}`, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Player request failed (${res.status})`)
  }
  return data
}

export async function fetchBattleLog(playerTagEncoded: string): Promise<{
  items: unknown[]
  insights: import('./battleInsights').BattleLogInsights
}> {
  const res = await fetch(`/api/brawlstars/players/${playerTagEncoded}/battlelog`, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Battle log failed (${res.status})`)
  }
  return data as { items: unknown[]; insights: import('./battleInsights').BattleLogInsights }
}

export async function fetchClub(clubTagEncoded: string): Promise<unknown> {
  const res = await fetch(`/api/brawlstars/clubs/${clubTagEncoded}`, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Club request failed (${res.status})`)
  }
  return data
}

export async function fetchClubMembers(clubTagEncoded: string): Promise<unknown> {
  const res = await fetch(`/api/brawlstars/clubs/${clubTagEncoded}/members`, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Club members failed (${res.status})`)
  }
  return data
}

export async function fetchEventRotation(): Promise<unknown> {
  const res = await fetch('/api/brawlstars/events/rotation')
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Rotation failed (${res.status})`)
  }
  return data
}

export async function fetchWorstCounter(playerTagEncoded: string): Promise<{
  playerTag: string
  matchesTracked: number
  worstOnTeamCount: number
  worstRate: number | null
  latestBattleTime: string | null
  metric: string
}> {
  const res = await fetch(`/api/brawlstars/players/${playerTagEncoded}/worst-counter`, {
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : `Worst-counter failed (${res.status})`
    )
  }
  return data as {
    playerTag: string
    matchesTracked: number
    worstOnTeamCount: number
    worstRate: number | null
    latestBattleTime: string | null
    metric: string
  }
}
