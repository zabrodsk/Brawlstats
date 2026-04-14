import { brawlStarsGet, BrawlStarsUpstreamError } from '@/lib/brawlstars/upstream'
import { upstreamErrorResponse } from '@/lib/brawlstars/jsonError'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    const data = await brawlStarsGet('/events/rotation')
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (e) {
    if (e instanceof BrawlStarsUpstreamError && e.code === 'not_found') {
      return NextResponse.json(
        {
          error: 'Event rotation is not available for this API key or endpoint.',
          code: 'rotation_unavailable',
        },
        { status: 404 }
      )
    }
    return upstreamErrorResponse(e)
  }
}
