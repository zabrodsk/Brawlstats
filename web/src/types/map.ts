import { CDN_BASE_URL } from '@/lib/constants'

export interface GameMode {
  id: number
  name: string
  color: string
  hash: string
}

export interface GameMap {
  id: number
  name: string
  gameModeId: number
  gameModeName: string
}

export function getMapImageURL(id: string | number): string {
  return `${CDN_BASE_URL}/maps/regular/${id}.png`
}
