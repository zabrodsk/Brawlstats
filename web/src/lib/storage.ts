import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION, STORE_STRATEGIES, STORE_TIER_BOARDS } from './constants'
import type { Strategy, StrategyElement } from '@/types/strategy'
import type { TierBoardState } from '@/types/tier'

// --- Schema ---

interface BrawlStrategyDB extends DBSchema {
  [STORE_STRATEGIES]: {
    key: string
    value: Strategy
    indexes: {
      'by-mapId': string
      'by-modifiedAt': string
    }
  }
  [STORE_TIER_BOARDS]: {
    key: string
    value: TierBoardState
  }
}

// --- DB singleton ---

let dbPromise: Promise<IDBPDatabase<BrawlStrategyDB>> | null = null

function getDB(): Promise<IDBPDatabase<BrawlStrategyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BrawlStrategyDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore(STORE_STRATEGIES, {
            keyPath: 'id',
          })
          store.createIndex('by-mapId', 'mapId')
          store.createIndex('by-modifiedAt', 'modifiedAt')
        }
        if (oldVersion < 2) {
          db.createObjectStore(STORE_TIER_BOARDS)
        }
      },
    })
  }
  return dbPromise
}

function newElementId(el: StrategyElement): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return `${el.type}-${suffix}`
}

function cloneElements(elements: StrategyElement[]): StrategyElement[] {
  return elements.map((el) => {
    const id = newElementId(el)
    if (el.type === 'brawler') {
      return { ...el, id }
    }
    if (el.type === 'arrow') {
      return { ...el, id }
    }
    return { ...el, id }
  })
}

// --- Strategies ---

export async function saveStrategy(strategy: Strategy): Promise<void> {
  const db = await getDB()
  await db.put(STORE_STRATEGIES, strategy)
}

export async function getStrategy(id: string): Promise<Strategy | undefined> {
  const db = await getDB()
  return db.get(STORE_STRATEGIES, id)
}

export async function getAllStrategies(): Promise<Strategy[]> {
  const db = await getDB()
  return db.getAllFromIndex(STORE_STRATEGIES, 'by-modifiedAt')
}

export async function deleteStrategy(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_STRATEGIES, id)
}

export async function duplicateStrategy(id: string): Promise<Strategy> {
  const orig = await getStrategy(id)
  if (!orig) {
    throw new Error('Strategy not found')
  }
  const now = new Date().toISOString()
  const copy: Strategy = {
    ...orig,
    id: `strat-${Date.now()}`,
    title: `${orig.title} (copy)`,
    createdAt: now,
    modifiedAt: now,
    elements: cloneElements(orig.elements),
  }
  await saveStrategy(copy)
  return copy
}

// --- Tier boards ---

export async function getTierBoard(context: string): Promise<TierBoardState | undefined> {
  const db = await getDB()
  return db.get(STORE_TIER_BOARDS, context)
}

export async function saveTierBoard(context: string, state: TierBoardState): Promise<void> {
  const db = await getDB()
  await db.put(STORE_TIER_BOARDS, state, context)
}
