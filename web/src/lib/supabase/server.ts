import 'server-only'

import { createClient } from '@supabase/supabase-js'

function readRuntimeEnv(name: string): string | null {
  const direct = process.env[name]?.trim()
  if (direct) return direct

  try {
    const key = Symbol.for('__cloudflare-request-context__')
    const ctx = (globalThis as Record<PropertyKey, unknown>)[key] as
      | { env?: Record<string, unknown> }
      | undefined
    const raw = ctx?.env?.[name]
    if (typeof raw === 'string') {
      const value = raw.trim()
      if (value.length > 0) return value
    }
  } catch {
    // non-cloudflare runtime
  }

  return null
}

export function getSupabaseAdminClient() {
  const url = readRuntimeEnv('SUPABASE_URL') ?? readRuntimeEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = readRuntimeEnv('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
