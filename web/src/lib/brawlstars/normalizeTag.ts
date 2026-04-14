/**
 * Normalize a player or club tag to Supercell form: `#` + uppercase alphanumeric.
 * Accepts raw `#ABC`, URL-encoded `%23ABC`, or `ABC`.
 */
export function normalizeTag(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  let s = trimmed
  try {
    s = decodeURIComponent(s)
  } catch {
    /* keep s */
  }
  s = s.replace(/^#/, '').toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (s.length < 3) return null
  return `#${s}`
}

/** Path segment for Next dynamic routes: encode # as %23 */
export function tagToPathSegment(tag: string): string {
  const n = normalizeTag(tag)
  if (!n) return ''
  return encodeURIComponent(n)
}
