'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { fetchClub, fetchClubMembers, fetchPlayer } from '@/lib/brawlstars/client'
import { normalizeTag, tagToPathSegment } from '@/lib/brawlstars/normalizeTag'

const STORAGE_MY_PROFILE_TAG = 'brawlstars_my_profile_tag'

type ClubMember = {
  tag?: string
  name?: string
  role?: string
  trophies?: number
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function formatNumber(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return value.toLocaleString()
}

export default function MyClubPage() {
  const [profileTag, setProfileTag] = useState('')
  const [inputTag, setInputTag] = useState('')
  const [clubInfo, setClubInfo] = useState<Record<string, unknown> | null>(null)
  const [members, setMembers] = useState<ClubMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedTag = normalizeTag(window.localStorage.getItem(STORAGE_MY_PROFILE_TAG) ?? '')
    if (savedTag) {
      setProfileTag(savedTag)
      setInputTag(savedTag)
    }
  }, [])

  const roleCounts = useMemo(() => {
    return members.reduce<Record<string, number>>((acc, member) => {
      const role = typeof member.role === 'string' ? member.role : 'member'
      acc[role] = (acc[role] ?? 0) + 1
      return acc
    }, {})
  }, [members])

  const avgTrophies = useMemo(() => {
    const trophyValues = members
      .map((member) => member.trophies)
      .filter((value): value is number => typeof value === 'number')
    if (trophyValues.length === 0) return null
    return Math.round(trophyValues.reduce((sum, value) => sum + value, 0) / trophyValues.length)
  }, [members])

  const loadClub = async (tag: string) => {
    const normalized = normalizeTag(tag)
    if (!normalized) {
      setError('Enter a valid player tag (example: #8Q8J0R).')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const player = asRecord(await fetchPlayer(tagToPathSegment(normalized)))
      const playerClub = asRecord(player.club)
      const clubTag = normalizeTag(
        typeof playerClub.tag === 'string' ? playerClub.tag : ''
      )
      if (!clubTag) {
        setClubInfo(null)
        setMembers([])
        setError('This player is currently not in a club.')
        return
      }

      const [club, memberPayload] = await Promise.all([
        fetchClub(tagToPathSegment(clubTag)),
        fetchClubMembers(tagToPathSegment(clubTag)),
      ])

      const clubRecord = asRecord(club)
      const memberItems = asRecord(memberPayload).items
      const parsedMembers = Array.isArray(memberItems)
        ? memberItems.map((row) => asRecord(row) as ClubMember)
        : []

      setClubInfo(clubRecord)
      setMembers(parsedMembers)
      setProfileTag(normalized)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_MY_PROFILE_TAG, normalized)
      }
    } catch (loadError) {
      setClubInfo(null)
      setMembers([])
      setError(loadError instanceof Error ? loadError.message : 'Failed to load club details.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void loadClub(inputTag)
  }

  return (
    <main className="min-h-screen bg-brand-black text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">My Club</h1>
          <p className="text-sm text-white/65">
            Saved to this device. You can still search another player tag anytime.
          </p>
        </header>

        <section className="rounded-xl border border-white/[0.08] bg-brand-surface p-4 md:p-5">
          <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-3 md:items-end">
            <label className="flex-1">
              <div className="text-xs uppercase tracking-wide text-white/55 mb-1.5">
                Player tag
              </div>
              <input
                value={inputTag}
                onChange={(event) => setInputTag(event.target.value)}
                placeholder="#PLAYER"
                className="w-full rounded-lg border border-white/[0.15] bg-brand-black px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-brand-yellow/70"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-yellow px-4 py-2 text-sm font-semibold text-brand-black hover:brightness-95 disabled:opacity-60"
            >
              {loading ? 'Loading...' : 'Load My Club'}
            </button>
          </form>
          {profileTag && (
            <p className="mt-2 text-xs text-white/60">Saved profile on this device: {profileTag}</p>
          )}
        </section>

        {error && (
          <section className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </section>
        )}

        {clubInfo && (
          <>
            <section className="grid gap-3 md:grid-cols-4">
              <StatCard
                title="Club"
                value={typeof clubInfo.name === 'string' ? clubInfo.name : '—'}
                subvalue={typeof clubInfo.tag === 'string' ? clubInfo.tag : null}
              />
              <StatCard title="Members" value={formatNumber(members.length)} />
              <StatCard title="Avg Trophies" value={formatNumber(avgTrophies)} />
              <StatCard
                title="Required"
                value={formatNumber(
                  typeof clubInfo.requiredTrophies === 'number' ? clubInfo.requiredTrophies : null
                )}
                subvalue={
                  typeof clubInfo.type === 'string'
                    ? clubInfo.type.replace('_', ' ')
                    : null
                }
              />
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              {Object.entries(roleCounts).map(([role, count]) => (
                <StatCard key={role} title={role} value={formatNumber(count)} />
              ))}
            </section>

            <section className="rounded-xl border border-white/[0.08] bg-brand-surface p-4 md:p-5">
              <h2 className="text-lg font-semibold mb-3">Members</h2>
              <div className="space-y-2">
                {members
                  .slice()
                  .sort((a, b) => (b.trophies ?? 0) - (a.trophies ?? 0))
                  .map((member) => (
                    <div
                      key={`${member.tag ?? member.name ?? 'member'}`}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-brand-black/55 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{member.name ?? 'Unknown member'}</p>
                        <p className="text-xs text-white/55">{member.role ?? 'member'}</p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">
                        {formatNumber(member.trophies)}
                      </p>
                    </div>
                  ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function StatCard({
  title,
  value,
  subvalue,
}: {
  title: string
  value: string
  subvalue?: string | null
}) {
  return (
    <article className="rounded-xl border border-white/[0.08] bg-brand-surface p-4">
      <p className="text-xs uppercase tracking-wide text-white/55">{title}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {subvalue ? <p className="mt-1 text-xs text-white/55">{subvalue}</p> : null}
    </article>
  )
}
