export interface Position {
  x: number
  y: number
}

export interface BrawlerElement {
  type: 'brawler'
  id: string
  brawlerId: string
  brawlerName: string
  team: 'blue' | 'red'
  position: Position
  rotation: number
}

export interface ArrowElement {
  type: 'arrow'
  id: string
  from: Position
  to: Position
  color: string
  strokeWidth: number
}

export interface ZoneElement {
  type: 'zone'
  id: string
  position: Position
  width: number
  height: number
  color: string
  opacity: number
  label?: string
}

export interface TextElement {
  type: 'text'
  id: string
  position: Position
  text: string
  fontSize: number
  color: string
}

export type StrategyElement =
  | BrawlerElement
  | ArrowElement
  | ZoneElement
  | TextElement

export interface Strategy {
  id: string
  version: number
  mapId: string
  gameMode: string
  title: string
  createdAt: string
  modifiedAt: string
  canvasSize: {
    width: number
    height: number
  }
  elements: StrategyElement[]
}
