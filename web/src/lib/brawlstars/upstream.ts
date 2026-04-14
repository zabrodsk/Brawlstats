import 'server-only'

import { BRAWL_STARS_API_BASE } from './constants'

export type BrawlStarsUpstreamErrorCode =
  | 'missing_token'
  | 'not_found'
  | 'rate_limited'
  | 'bad_request'
  | 'upstream_error'
  | 'invalid_json'

export class BrawlStarsUpstreamError extends Error {
  constructor(
    message: string,
    public readonly code: BrawlStarsUpstreamErrorCode,
    public readonly status: number,
    public readonly reason?: string
  ) {
    super(message)
    this.name = 'BrawlStarsUpstreamError'
  }
}

function getToken(): string | null {
  const envToken = process.env.BRAWL_STARS_API_TOKEN?.trim()
  if (envToken && envToken.length > 0) return envToken

  // Cloudflare Pages edge runtime via next-on-pages.
  try {
    const key = Symbol.for('__cloudflare-request-context__')
    const ctx = (globalThis as Record<PropertyKey, unknown>)[key] as
      | { env?: Record<string, unknown> }
      | undefined
    const raw = ctx?.env?.BRAWL_STARS_API_TOKEN
    if (typeof raw === 'string') {
      const t = raw.trim()
      if (t.length > 0) return t
    }
  } catch {
    // non-Cloudflare runtime
  }

  return null
}

/**
 * GET a path under `/v1/...` (path should start with `/players`, `/clubs`, etc.).
 */
export async function brawlStarsGet(pathUnderV1: string): Promise<unknown> {
  const token = getToken()
  if (!token) {
    throw new BrawlStarsUpstreamError(
      'Brawl Stars API token is not configured on the server.',
      'missing_token',
      503
    )
  }

  const url = `${BRAWL_STARS_API_BASE}${pathUnderV1.startsWith('/') ? pathUnderV1 : `/${pathUnderV1}`}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      next: { revalidate: 0 },
    })
  } catch (e) {
    const hint = e instanceof Error ? e.message : String(e)
    throw new BrawlStarsUpstreamError(
      'Could not reach Supercell API (network/TLS).',
      'upstream_error',
      503,
      hint
    )
  }

  if (res.status === 404) {
    throw new BrawlStarsUpstreamError('Resource not found.', 'not_found', 404)
  }
  if (res.status === 429) {
    throw new BrawlStarsUpstreamError('Rate limited by Supercell API.', 'rate_limited', 429)
  }
  if (res.status === 400) {
    const text = await res.text().catch(() => '')
    throw new BrawlStarsUpstreamError('Bad request.', 'bad_request', 400, text.slice(0, 200))
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new BrawlStarsUpstreamError(
      'Supercell API error.',
      'upstream_error',
      res.status >= 500 ? 503 : 502,
      text.slice(0, 200)
    )
  }

  try {
    return await res.json()
  } catch {
    throw new BrawlStarsUpstreamError('Invalid JSON from Supercell API.', 'invalid_json', 502)
  }
}

export function hasBrawlStarsToken(): boolean {
  return Boolean(getToken())
}
