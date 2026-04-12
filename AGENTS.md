## Learned User Preferences

- When iOS shows boxed or wrong-sized UI, verify launch screen wiring in Info.plist and what actually ships in the app bundle before attributing the issue only to feature views such as the strategy canvas.

## Learned Workspace Facts

- Brawlstats is a split codebase: Next.js under `web/` and SwiftUI under `ios/BrawlStrategy/`, opened via `ios/BrawlStrategy.xcodeproj`.
- The iOS Xcode project is maintained with XcodeGen using `ios/project.yml`; regenerated `project.pbxproj` must keep a Copy Bundle Resources phase so `LaunchScreen.storyboard` and `Assets.xcassets` are included when those files exist on disk.
- iOS targets should declare `UILaunchStoryboardName` and bundle a launch storyboard; omitting launch screen configuration can produce legacy-style window framing or sizing symptoms in the simulator.
- Use iPad idiom (for example `UIDevice.current.userInterfaceIdiom == .pad`) rather than `horizontalSizeClass == .regular` alone to choose tablet split chrome versus phone `TabView`, including in `ContentView` and strategy editor layouts, because large iPhones in landscape often report a regular horizontal size class.
- Web product chrome and brand colors are centralized in Tailwind via `web/tailwind.config.ts` with yellow and black brand tokens that are intended to stay visually aligned with iOS accents.

## Cursor Cloud specific instructions

Three JS projects share this repo; all use `npm` (matching their `package-lock.json` files):

| Service | Directory | Dev command | Default port | Notes |
|---|---|---|---|---|
| **Web app** (main product) | `web/` | `npm run dev` | 3000 | Next.js 14, lint via `npm run lint`, build via `npm run build` |
| **Marketing site** | `marketing-site/` | `npm run dev` | 3000 | Next.js 16, static export (`output: "export"`). Dev server may 500 on image routes due to Image Optimization incompatibility with export mode; the production build (`npm run build`) works fine. |
| **Remotion studio** | `remotion/` | `npm start` | 3000 | Video asset generator; optional for most development work. |

- No backend, no database, no secrets, no `.env` files. Both web and iOS apps consume the public Brawlify API (`https://api.brawlify.com/v1`).
- iOS app (`ios/`) requires macOS + Xcode and cannot be built/tested on Linux VMs.
- When running multiple JS services simultaneously, pass `-p <port>` to avoid port conflicts (e.g. `npm run dev -- -p 3001`).
