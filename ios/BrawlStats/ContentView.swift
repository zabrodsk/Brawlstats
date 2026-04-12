import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct ContentView: View {
    /// `horizontalSizeClass == .regular` is true for large iPhones in landscape, which incorrectly
    /// selects `NavigationSplitView` and can look letterboxed or “card-like”. Tablet chrome is iPad-only.
    private var isPad: Bool {
        #if canImport(UIKit)
        UIDevice.current.userInterfaceIdiom == .pad
        #else
        false
        #endif
    }

    var body: some View {
        Group {
            if isPad {
                iPadLayout()
            } else {
                iPhoneLayout()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - iPhone Layout (TabView)

private struct iPhoneLayout: View {
    @State private var selectedTab = 0
    @State private var mapsQuickRequest: MapsQuickMode?

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeHubView(
                onOpenMaps: {
                    mapsQuickRequest = nil
                    selectedTab = 1
                },
                onOpenBrawlers: { selectedTab = 2 },
                onOpenTiers: { selectedTab = 3 },
                onOpenStrats: { selectedTab = 4 },
                onJumpToMapsMode: { mode in
                    mapsQuickRequest = mode
                    selectedTab = 1
                }
            )
            .tabItem {
                Label("Home", systemImage: "house.fill")
            }
            .tag(0)

            MapsView(quickRequest: $mapsQuickRequest)
                .tabItem {
                    Label("Maps", systemImage: "map.fill")
                }
                .tag(1)

            BrawlersView()
                .tabItem {
                    Label("Brawlers", systemImage: "person.3.fill")
                }
                .tag(2)

            TierListsView()
                .tabItem {
                    Label("Tiers", systemImage: "list.star")
                }
                .tag(3)

            MyStratsView()
                .tabItem {
                    Label("My Strats", systemImage: "folder.fill")
                }
                .tag(4)
        }
    }
}

// MARK: - iPad Layout (NavigationSplitView sidebar)

private struct iPadLayout: View {
    @State private var selectedTab: AppTab? = .home
    @State private var mapsQuickRequest: MapsQuickMode?

    var body: some View {
        NavigationSplitView {
            List(AppTab.allCases, id: \.self, selection: $selectedTab) { tab in
                Label(tab.title, systemImage: tab.icon)
            }
            .navigationTitle("Brawl Strategy")
        } detail: {
            switch selectedTab ?? .home {
            case .home:
                HomeHubView(
                    onOpenMaps: {
                        mapsQuickRequest = nil
                        selectedTab = .maps
                    },
                    onOpenBrawlers: { selectedTab = .brawlers },
                    onOpenTiers: { selectedTab = .tiers },
                    onOpenStrats: { selectedTab = .myStrats },
                    onJumpToMapsMode: { mode in
                        mapsQuickRequest = mode
                        selectedTab = .maps
                    }
                )
            case .maps:
                MapsView(quickRequest: $mapsQuickRequest)
            case .brawlers:
                BrawlersView()
            case .tiers:
                TierListsView()
            case .myStrats:
                MyStratsView()
            }
        }
    }
}

// MARK: - AppTab

enum AppTab: String, CaseIterable {
    case home
    case maps
    case brawlers
    case tiers
    case myStrats

    var title: String {
        switch self {
        case .home: return "Home"
        case .maps: return "Maps"
        case .brawlers: return "Brawlers"
        case .tiers: return "Tiers"
        case .myStrats: return "My Strats"
        }
    }

    var icon: String {
        switch self {
        case .home: return "house.fill"
        case .maps: return "map.fill"
        case .brawlers: return "person.3.fill"
        case .tiers: return "list.star"
        case .myStrats: return "folder.fill"
        }
    }
}

#Preview {
    ContentView()
}
