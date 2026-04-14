import { brawlStarsGet } from '@/lib/brawlstars/upstream'
import { upstreamErrorResponse } from '@/lib/brawlstars/jsonError'
import { normalizeTag } from '@/lib/brawlstars/normalizeTag'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(
  _request: Request,
  context: { params: { playerTag: string } }
) {
  const { playerTag: raw } = context.params
  const tag = normalizeTag(raw)
  if (!tag) {
    return NextResponse.json({ error: 'Invalid player tag.', code: 'invalid_tag' }, { status: 400 })
  }

  try {
    const data = await brawlStarsGet(`/players/${encodeURIComponent(tag)}`)
    return NextResponse.json(data)
  } catch (e) {
    return upstreamErrorResponse(e)
  }
}
