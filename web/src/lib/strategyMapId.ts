/**
 * Brawlify map thumbnails use /maps/regular/{id}.png. Id "0" and other invalid
 * values 404 — use a stable real map so the editor always has a background.
 */
export const FALLBACK_STRATEGY_MAP_ID = '15000000'

export function normalizeStrategyMapId(mapId: string | null | undefined): string {
  const s = mapId?.trim() ?? ''
  if (!s || s === '0' || !/^\d+$/.test(s)) return FALLBACK_STRATEGY_MAP_ID
  return s
}
