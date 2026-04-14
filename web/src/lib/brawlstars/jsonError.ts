import { NextResponse } from 'next/server'
import { BrawlStarsUpstreamError } from './upstream'

export function upstreamErrorResponse(err: unknown): NextResponse {
  if (err instanceof BrawlStarsUpstreamError) {
    return NextResponse.json(
      { error: err.message, code: err.code, reason: err.reason },
      { status: err.status }
    )
  }
  const message = err instanceof Error ? err.message : 'Unexpected error.'
  return NextResponse.json({ error: message, code: 'internal' }, { status: 500 })
}
