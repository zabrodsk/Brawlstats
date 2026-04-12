import { appendFileSync } from 'node:fs'

type DebugPayload = {
  hypothesisId?: string
  location?: string
  message?: string
  data?: Record<string, unknown>
  timestamp?: number
}

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DebugPayload
    appendFileSync(
      '/opt/cursor/logs/debug.log',
      JSON.stringify({
        hypothesisId: body.hypothesisId ?? 'unknown',
        location: body.location ?? 'unknown',
        message: body.message ?? 'unknown',
        data: body.data ?? {},
        timestamp: body.timestamp ?? Date.now(),
      }) + '\n'
    )
    return new Response(null, { status: 204 })
  } catch {
    return new Response(null, { status: 204 })
  }
}
