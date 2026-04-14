import { brawlStarsGet } from '@/lib/brawlstars/upstream'
import { upstreamErrorResponse } from '@/lib/brawlstars/jsonError'
import { normalizeTag } from '@/lib/brawlstars/normalizeTag'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(
  _request: Request,
  context: { params: { clubTag: string } }
) {
  const { clubTag: raw } = context.params
  const tag = normalizeTag(raw)
  if (!tag) {
    return NextResponse.json({ error: 'Invalid club tag.', code: 'invalid_tag' }, { status: 400 })
  }

  try {
    const data = await brawlStarsGet(`/clubs/${encodeURIComponent(tag)}/members`)
    return NextResponse.json(data)
  } catch (e) {
    return upstreamErrorResponse(e)
  }
}
