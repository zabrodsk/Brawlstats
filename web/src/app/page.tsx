import { fetchMaps, fetchGameModes, fetchBrawlers } from '@/lib/brawlify'
import { pickSpotlightBrawlerIds } from '@/lib/homeSpotlight'
import { resolveShortcutModes } from '@/lib/modeShortcuts'
import { HomeView } from './HomeView'

export default async function Home() {
  const utcDateKey = new Date().toISOString().slice(0, 10)

  let shortcuts: { label: string; gameModeId: number }[] = []
  let mapCount = 0
  let modeCount = 0
  let brawlerCount = 0
  let spotlightBrawlerIds: number[] = []
  let gameModes: { id: number; name: string }[] = []

  try {
    const [maps, modes, brawlers] = await Promise.all([
      fetchMaps(),
      fetchGameModes(),
      fetchBrawlers(),
    ])
    mapCount = maps.length
    modeCount = modes.length
    brawlerCount = brawlers.length
    gameModes = modes.map((m) => ({ id: m.id, name: m.name }))
    shortcuts = resolveShortcutModes(modes, maps)
    spotlightBrawlerIds = pickSpotlightBrawlerIds(
      brawlers.map((b) => b.id),
      utcDateKey,
      7
    )
  } catch {
    /* keep safe defaults; home still renders */
  }

  return (
    <HomeView
      shortcuts={shortcuts}
      mapCount={mapCount}
      modeCount={modeCount}
      brawlerCount={brawlerCount}
      spotlightBrawlerIds={spotlightBrawlerIds}
      gameModes={gameModes}
    />
  )
}
