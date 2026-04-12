// CDN and API endpoints
export const CDN_BASE_URL = 'https://cdn.brawlify.com'
export const API_BASE_URL = 'https://api.brawlify.com/v1'

// API endpoint paths
export const API_ENDPOINTS = {
  brawlers: `${API_BASE_URL}/brawlers`,
  maps: `${API_BASE_URL}/maps`,
  gameModes: `${API_BASE_URL}/gamemodes`,
} as const

// Team colors
export const TEAM_COLORS = {
  blue: '#1E90FF',
  red: '#FF4444',
} as const

// Accent colors
export const ACCENT_COLORS = {
  yellow: '#FFD700',
  green: '#6BCB77',
  purple: '#9B5DE5',
} as const

// Strategy canvas defaults
export const DEFAULT_CANVAS_SIZE = {
  width: 800,
  height: 800,
} as const

// Cache TTL in milliseconds (5 minutes)
export const CACHE_TTL_MS = 5 * 60 * 1000

// IndexedDB config
export const DB_NAME = 'brawl-strategy'
export const DB_VERSION = 2
export const STORE_STRATEGIES = 'strategies'
export const STORE_TIER_BOARDS = 'tier_boards'
