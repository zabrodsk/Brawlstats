import { CDN_BASE_URL } from '@/lib/constants'

export type BrawlerRarity =
  | 'Trophy Road'
  | 'Rare'
  | 'Super Rare'
  | 'Epic'
  | 'Mythic'
  | 'Legendary'
  | 'Chromatic'

export type BrawlerRole =
  | 'Tank'
  | 'Sharpshooter'
  | 'Thrower'
  | 'Assassin'
  | 'Support'
  | 'Controller'
  | 'Fighter'
  | 'Hybrid'

export interface Brawler {
  id: number
  name: string
  rarity: BrawlerRarity
  role: BrawlerRole
  description: string
}

export function getBrawlerIconURL(id: string | number): string {
  return `${CDN_BASE_URL}/brawlers/icons/${id}.png`
}
