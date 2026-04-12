## Learned User Preferences

- When iOS shows boxed or wrong-sized UI, verify launch screen wiring in Info.plist and what actually ships in the app bundle before attributing the issue only to feature views such as the strategy canvas.

## Learned Workspace Facts

- Brawlstats ships multiple surfaces: the main Next.js product under `web/`, SwiftUI under `ios/BrawlStrategy/` (open `ios/BrawlStrategy.xcodeproj`), a standalone Next.js marketing site under `marketing-site/`, and `remotion/` for exported marketing video assets.
- The iOS Xcode project is maintained with XcodeGen using `ios/project.yml`; regenerated `project.pbxproj` must keep a Copy Bundle Resources phase so `LaunchScreen.storyboard` and `Assets.xcassets` are included when those files exist on disk.
- iOS targets should declare `UILaunchStoryboardName` and bundle a launch storyboard; omitting launch screen configuration can produce legacy-style window framing or sizing symptoms in the simulator.
- Use iPad idiom (for example `UIDevice.current.userInterfaceIdiom == .pad`) rather than `horizontalSizeClass == .regular` alone to choose tablet split chrome versus phone `TabView`, including in `ContentView` and strategy editor layouts, because large iPhones in landscape often report a regular horizontal size class.
- Web product chrome and brand colors are centralized in Tailwind via `web/tailwind.config.ts` with yellow and black brand tokens; iOS drawing chrome uses `#F5CC00` as the default active tool color and should stay visually aligned with those tokens.
- Brawlify static map art is served at `https://cdn.brawlify.com/maps/regular/{mapId}.png` (not `/maps/{mapId}.png`). Game mode icons use numeric ids at `https://cdn.brawlify.com/game-modes/regular/{modeId}.png`; building URLs from the string `hash` slug 404s.
- On web strategy editor routes (`/strats/new`, `/strats/[id]`), avoid mounting duplicate desktop `BrawlerPicker` panels; a second instance collapsed the main canvas and made the map appear blank even when the map image request succeeded.
