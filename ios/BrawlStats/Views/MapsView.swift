import SwiftUI

enum MapsQuickMode: String, Equatable, CaseIterable {
    case brawlBall
    case bounty
    case showdown

    var title: String {
        switch self {
        case .brawlBall: return "Brawl Ball"
        case .bounty: return "Bounty"
        case .showdown: return "Showdown"
        }
    }

    var systemImage: String {
        switch self {
        case .brawlBall: return "sportscourt.fill"
        case .bounty: return "scope"
        case .showdown: return "flame.fill"
        }
    }

    func matches(gameModeName: String) -> Bool {
        switch self {
        case .brawlBall:
            if gameModeName.localizedCaseInsensitiveCompare("Brawl Ball") == .orderedSame { return true }
            return gameModeName.localizedCaseInsensitiveContains("Brawl Ball")
        case .bounty:
            return gameModeName.localizedCaseInsensitiveContains("Bounty")
        case .showdown:
            return gameModeName.localizedCaseInsensitiveContains("Showdown")
        }
    }
}

struct MapsView: View {
    @Binding var quickRequest: MapsQuickMode?

    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @State private var maps: [GameMap] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var searchText = ""
    @State private var selectedMap: GameMap?
    @State private var quickModeFilter: MapsQuickMode?

    init(quickRequest: Binding<MapsQuickMode?> = .constant(nil)) {
        _quickRequest = quickRequest
    }

    private var filteredMaps: [GameMap] {
        var result = maps
        if let q = quickModeFilter {
            result = result.filter { q.matches(gameModeName: $0.gameModeName) }
        }
        if !searchText.isEmpty {
            result = result.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                    $0.gameModeName.localizedCaseInsensitiveContains(searchText)
            }
        }
        return result
    }

    private var groupedMaps: [(mode: String, maps: [GameMap])] {
        Dictionary(grouping: filteredMaps, by: \.gameModeName)
            .map { ($0.key, $0.value.sorted { $0.name < $1.name }) }
            .sorted { $0.mode < $1.mode }
    }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Maps")
                .searchable(text: $searchText, prompt: "Search maps or modes")
                .toolbar {
                    if quickModeFilter != nil {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Clear filter") {
                                quickModeFilter = nil
                            }
                        }
                    }
                }
                .task {
                    await loadMaps()
                }
                .fullScreenCover(item: $selectedMap) { map in
                    StrategyEditorView(
                        initialMapId: map.id,
                        initialGameMode: map.gameModeName
                    )
                }
        }
    }

    @ViewBuilder
    private var content: some View {
        if isLoading && maps.isEmpty {
            ProgressView("Loading maps…")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let errorMessage, maps.isEmpty {
            ContentUnavailableView(
                "Failed to Load",
                systemImage: "exclamationmark.triangle",
                description: Text(errorMessage)
            )
            .overlay(alignment: .bottom) {
                Button("Retry") {
                    Task { await loadMaps() }
                }
                .buttonStyle(.bordered)
                .padding()
            }
        } else {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 24) {
                        ForEach(groupedMaps, id: \.mode) { section in
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Text(section.mode)
                                        .font(.title3.weight(.semibold))
                                    Spacer()
                                    Text("\(section.maps.count) maps")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }

                                if horizontalSizeClass == .regular {
                                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 180, maximum: 220), spacing: 12)], spacing: 12) {
                                        ForEach(section.maps) { map in
                                            MapCard(map: map) {
                                                selectedMap = map
                                            }
                                        }
                                    }
                                } else {
                                    ScrollView(.horizontal, showsIndicators: false) {
                                        LazyHStack(spacing: 12) {
                                            ForEach(section.maps) { map in
                                                MapCard(map: map) {
                                                    selectedMap = map
                                                }
                                                .frame(width: 170)
                                            }
                                        }
                                        .padding(.trailing, 16)
                                    }
                                }
                            }
                            .id(section.mode)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .padding(.bottom, horizontalSizeClass == .regular ? 24 : 108)
                }
                .refreshable {
                    await loadMaps()
                }
                .onAppear {
                    applyQuickRequestIfNeeded(proxy: proxy)
                }
                .onChange(of: quickRequest) { _, newValue in
                    if newValue != nil {
                        applyQuickRequestIfNeeded(proxy: proxy)
                    }
                }
            }
        }
    }

    private func applyQuickRequestIfNeeded(proxy: ScrollViewProxy) {
        guard let mode = quickRequest else { return }
        quickModeFilter = mode
        searchText = ""
        quickRequest = nil
        scrollToFirstSection(proxy: proxy)
    }

    private func scrollToFirstSection(proxy: ScrollViewProxy) {
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(120))
            guard let first = groupedMaps.first?.mode else { return }
            withAnimation(.easeOut(duration: 0.2)) {
                proxy.scrollTo(first, anchor: .top)
            }
        }
    }

    private func loadMaps() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            maps = try await BrawlifyService.shared.fetchMaps()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct MapCard: View {
    let map: GameMap
    let onStrategize: () -> Void

    var body: some View {
        Button(action: onStrategize) {
            VStack(alignment: .leading, spacing: 10) {
                if let url = map.imageURL {
                    CachedAsyncImage(url: url, compactPlaceholder: true)
                        .frame(maxWidth: .infinity)
                        .aspectRatio(0.94, contentMode: .fit)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }

                Text(map.name)
                    .font(.headline)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)

                Text(map.gameModeName)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                HStack(spacing: 6) {
                    Text("Strategize")
                        .font(.subheadline.weight(.semibold))
                    Image(systemName: "arrow.up.right.square")
                        .font(.caption.weight(.bold))
                }
                .foregroundStyle(Color.accentColor)
                .padding(.top, 2)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 18))
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    MapsView()
}
