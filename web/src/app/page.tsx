import { fetchMaps, fetchGameModes } from '@/lib/brawlify'
import { resolveShortcutModes } from '@/lib/modeShortcuts'
import { HomeView } from './HomeView'

export default async function Home() {
  let shortcuts: { label: string; gameModeId: number }[] = []
  try {
    const [maps, gameModes] = await Promise.all([fetchMaps(), fetchGameModes()])
    shortcuts = resolveShortcutModes(gameModes, maps)
  } catch {
    /* shortcuts stay empty; home still renders */
  }

  return <HomeView shortcuts={shortcuts} />
}
