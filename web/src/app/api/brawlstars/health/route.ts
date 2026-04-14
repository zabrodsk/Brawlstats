import { NextResponse } from 'next/server'
import { hasBrawlStarsToken } from '@/lib/brawlstars/upstream'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasToken: hasBrawlStarsToken(),
  })
}
