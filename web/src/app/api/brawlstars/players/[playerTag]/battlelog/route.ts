import { brawlStarsGet } from '@/lib/brawlstars/upstream'
import { upstreamErrorResponse } from '@/lib/brawlstars/jsonError'
import { normalizeTag } from '@/lib/brawlstars/normalizeTag'
import { computeBattleLogInsights } from '@/lib/brawlstars/battleInsights'
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
    const data = (await brawlStarsGet(
      `/players/${encodeURIComponent(tag)}/battlelog`
    )) as { items?: unknown[] }
    const items = Array.isArray(data.items) ? data.items : []
    const insights = computeBattleLogInsights(items, tag)
    return NextResponse.json({ items, insights })
  } catch (e) {
    return upstreamErrorResponse(e)
  }
}
