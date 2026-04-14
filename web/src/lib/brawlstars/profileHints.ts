import { normalizeTag } from './normalizeTag'

export interface KnownProfileHint {
  tag: string
  name: string
  updatedAt: number
}

const STORAGE_KEY = 'brawlstars_known_profiles'
const MAX_HINTS = 50

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window
}

export function readKnownProfileHints(): KnownProfileHint[] {
  const win = safeWindow()
  if (!win) return []
  try {
    const raw = win.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const rec = item as Record<string, unknown>
        return {
          tag: typeof rec.tag === 'string' ? rec.tag : '',
          name: typeof rec.name === 'string' ? rec.name : 'Unknown',
          updatedAt: typeof rec.updatedAt === 'number' ? rec.updatedAt : 0,
        }
      })
      .filter((item) => Boolean(normalizeTag(item.tag)))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function rememberKnownProfile(tagRaw: string, nameRaw: string | null | undefined) {
  const win = safeWindow()
  if (!win) return
  const tag = normalizeTag(tagRaw)
  if (!tag) return
  const name = (nameRaw ?? '').trim() || tag

  const current = readKnownProfileHints()
  const withoutDup = current.filter((item) => item.tag !== tag)
  const next: KnownProfileHint[] = [{ tag, name, updatedAt: Date.now() }, ...withoutDup].slice(0, MAX_HINTS)

  try {
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore storage failures
  }
}

export function resolveTagFromInput(inputRaw: string, hints: KnownProfileHint[]): string | null {
  const directTag = normalizeTag(inputRaw)
  if (directTag) return directTag
  const q = inputRaw.trim().toLowerCase()
  if (!q) return null
  const byName = hints.find((item) => item.name.toLowerCase() === q)
  if (byName) return byName.tag
  const partial = hints.find((item) => item.name.toLowerCase().includes(q))
  return partial ? partial.tag : null
}
