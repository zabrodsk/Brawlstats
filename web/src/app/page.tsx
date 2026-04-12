'use client'

import { useState, useEffect } from 'react'
import { fetchMaps, fetchGameModes } from '@/lib/brawlify'
import { resolveShortcutModes } from '@/lib/modeShortcuts'
import { HomeView } from './HomeView'

export default function Home() {
  const [shortcuts, setShortcuts] = useState<{ label: string; gameModeId: number }[]>([])

  useEffect(() => {
    Promise.all([fetchMaps(), fetchGameModes()])
      .then(([maps, gameModes]) => {
        setShortcuts(resolveShortcutModes(gameModes, maps))
      })
      .catch(() => {})
  }, [])

  return <HomeView shortcuts={shortcuts} />
}
