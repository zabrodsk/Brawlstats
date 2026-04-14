## Learned User Preferences

- When iOS shows boxed or wrong-sized UI, verify launch screen wiring in Info.plist and what actually ships in the app bundle before attributing the issue only to feature views such as the strategy canvas.
- When capturing marketing screenshots from the live web dashboard, wait for async sections to finish loading (maps, tier lists, brawler portraits) so images are not empty or stuck in loading states.

## Learned Workspace Facts

- Brawlstats ships multiple surfaces: the main Next.js product under `web/`, SwiftUI under `ios/BrawlStrategy/` (open `ios/BrawlStrategy.xcodeproj`), a standalone Next.js marketing site under `marketing-site/`, and `remotion/` for exported marketing video assets.
- The iOS Xcode project is maintained with XcodeGen using `ios/project.yml`; regenerated `project.pbxproj` must keep a Copy Bundle Resources phase so `LaunchScreen.storyboard` and `Assets.xcassets` are included when those files exist on disk.
- iOS targets should declare `UILaunchStoryboardName` and bundle a launch storyboard; omitting launch screen configuration can produce legacy-style window framing or sizing symptoms in the simulator.
- Use iPad idiom (for example `UIDevice.current.userInterfaceIdiom == .pad`) rather than `horizontalSizeClass == .regular` alone to choose tablet split chrome versus phone `TabView`, including in `ContentView` and strategy editor layouts, because large iPhones in landscape often report a regular horizontal size class.
- Web product chrome and brand colors are centralized in Tailwind via `web/tailwind.config.ts` with yellow and black brand tokens; iOS drawing chrome uses `#F5CC00` as the default active tool color and should stay visually aligned with those tokens.
- Brawlify static map art is served at `https://cdn.brawlify.com/maps/regular/{mapId}.png` (not `/maps/{mapId}.png`). Game mode icons use numeric ids at `https://cdn.brawlify.com/game-modes/regular/{modeId}.png`; building URLs from the string `hash` slug 404s.
- On web strategy editor routes (`/strats/new`, `/strats/[id]`), avoid mounting duplicate desktop `BrawlerPicker` panels; a second instance collapsed the main canvas and made the map appear blank even when the map image request succeeded.
- The standalone `marketing-site` Next.js app uses static export (`output: "export"`); the default `next/image` optimization path is incompatible with that mode, so `images.unoptimized: true` must stay configured in `marketing-site/next.config` (otherwise export fails with the export image API error).
- iOS App Store validation (including iPad multitasking) expects `UISupportedInterfaceOrientations` in `Info.plist` to list the orientations the bundle supports; an incomplete or missing declaration can surface as an invalid bundle or multitasking rejection even for portrait-first apps.
- The Brawl Stars API server proxy lives under `web/src/lib/brawlstars/` (`upstream.ts` with `server-only` guard, `normalizeTag.ts`, `jsonError.ts`, `constants.ts`) with routes at `web/src/app/api/brawlstars/` (health, players/[playerTag], players/[playerTag]/battlelog). The token is read from `BRAWL_STARS_API_TOKEN` in `web/.env.local` and must never be committed or exposed client-side.
- `StrategyCanvas.tsx` renders map images with centered letterbox aspect-fit math (not stretched to full frame); this is the correct sizing approach and should be preserved when editing the canvas component.
- The iOS main home view is `ios/BrawlStats/Views/HomeHubView.swift`: a `NavigationStack` + `ScrollView` with hero, "Jump in" horizontal mode chips, and an "Explore" grid (Maps, Brawlers, Tier lists, My strategies); map counts are loaded via `BrawlifyService.shared.fetchMaps()`.
