/** Deterministic daily spotlight brawlers for home (UTC YYYY-MM-DD seed, SSR-stable). */

function hashStringToUint32(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function next() {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Pick 6–8 distinct brawler ids, stable for the given UTC calendar day.
 */
export function pickSpotlightBrawlerIds(
  allIds: readonly number[],
  utcDateKey: string,
  count = 7
): number[] {
  const n = Math.min(8, Math.max(6, count))
  const ids = [...allIds].sort((a, b) => a - b)
  if (ids.length === 0) return []
  const rng = mulberry32(hashStringToUint32(`bs-home-spotlight|${utcDateKey}`))
  const deck = [...ids]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = deck[i]!
    deck[i] = deck[j]!
    deck[j] = tmp
  }
  return deck.slice(0, Math.min(n, deck.length))
}
