import type { GameMap, GameMode } from '@/types/map'

/** Preferred order for homepage quick links (research-informed; see plan). */
const SHORTCUT_ORDER: readonly string[] = [
  'Gem Grab',
  'Brawl Ball',
  'Solo Showdown',
  'Duo Showdown',
  'Hot Zone',
  'Knockout',
  'Heist',
  'Bounty',
  'Wipeout',
  'Duels',
] as const

function norm(s: string): string {
  return s.trim().toLowerCase()
}

function findModeByName(gameModes: GameMode[], wanted: string): GameMode | undefined {
  const w = norm(wanted)
  return gameModes.find((m) => norm(m.name) === w)
}

/**
 * Build homepage shortcuts: only modes that have at least one map, in plan order.
 */
export function resolveShortcutModes(
  gameModes: GameMode[],
  maps: GameMap[]
): { label: string; gameModeId: number }[] {
  const modeIdsWithMaps = new Set(maps.map((m) => m.gameModeId))
  const out: { label: string; gameModeId: number }[] = []
  const seen = new Set<number>()

  for (const label of SHORTCUT_ORDER) {
    const gm = findModeByName(gameModes, label)
    if (!gm || !modeIdsWithMaps.has(gm.id) || seen.has(gm.id)) continue
    seen.add(gm.id)
    out.push({ label: gm.name, gameModeId: gm.id })
  }

  return out
}
