import { API_ENDPOINTS, CACHE_TTL_MS } from './constants'
import type { Brawler } from '@/types/brawler'
import type { GameMap, GameMode } from '@/types/map'

// --- In-memory cache ---

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

// --- API response shapes from brawlify ---

interface BrawlifyBrawlerResponse {
  list: Array<{
    id: number
    name: string
    rarity: { name: string }
    class: { name: string }
    description: string
  }>
}

interface BrawlifyMapResponse {
  list: Array<{
    id: number
    name: string
    gameMode: {
      id: number
      name: string
    }
  }>
}

interface BrawlifyGameModeResponse {
  list: Array<{
    id: number
    name: string
    color: string
    hash: string
  }>
}

// --- Fetch helpers ---

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Brawlify API error: ${res.status} ${res.statusText} (${url})`)
  }

  return res.json() as Promise<T>
}

// --- Public API ---

export async function fetchBrawlers(): Promise<Brawler[]> {
  const cacheKey = 'brawlers'
  const cached = getCached<Brawler[]>(cacheKey)
  if (cached) return cached

  const data = await fetchJSON<BrawlifyBrawlerResponse>(API_ENDPOINTS.brawlers)

  const brawlers: Brawler[] = data.list.map((b) => ({
    id: b.id,
    name: b.name,
    rarity: b.rarity.name as Brawler['rarity'],
    role: b.class.name as Brawler['role'],
    description: b.description,
  }))

  setCached(cacheKey, brawlers)
  return brawlers
}

export async function fetchMaps(): Promise<GameMap[]> {
  const cacheKey = 'maps'
  const cached = getCached<GameMap[]>(cacheKey)
  if (cached) return cached

  const data = await fetchJSON<BrawlifyMapResponse>(API_ENDPOINTS.maps)

  const maps: GameMap[] = data.list.map((m) => ({
    id: m.id,
    name: m.name,
    gameModeId: m.gameMode.id,
    gameModeName: m.gameMode.name,
  }))

  setCached(cacheKey, maps)
  return maps
}

export async function fetchGameModes(): Promise<GameMode[]> {
  const cacheKey = 'gameModes'
  const cached = getCached<GameMode[]>(cacheKey)
  if (cached) return cached

  const data = await fetchJSON<BrawlifyGameModeResponse>(API_ENDPOINTS.gameModes)

  const modes: GameMode[] = data.list.map((m) => ({
    id: m.id,
    name: m.name,
    color: m.color,
    hash: m.hash,
  }))

  setCached(cacheKey, modes)
  return modes
}
