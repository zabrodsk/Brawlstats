import SwiftUI
import SwiftData

struct TierListsView: View {
    private static let tiers = ["S", "A", "B", "C", "D", "Unranked"]

    @Environment(\.modelContext) private var modelContext
    @Query(sort: \TierList.modifiedAt, order: .reverse) private var savedLists: [TierList]

    @State private var brawlers: [Brawler] = []
    @State private var gameModes: [GameMode] = []
    @State private var selectedGameModeId: String?
    @State private var tierAssignments: [String: [String]] = [:]
    @State private var isLoading = false
    @State private var errorMessage: String?

    private var selectedGameMode: GameMode? {
        gameModes.first(where: { $0.id == selectedGameModeId })
    }

    private var brawlerLookup: [String: Brawler] {
        Dictionary(uniqueKeysWithValues: brawlers.map { ($0.id, $0) })
    }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Tier Lists")
                .task {
                    await loadDataIfNeeded()
                }
                .onChange(of: selectedGameModeId) { _, _ in
                    syncAssignmentsForSelectedMode()
                }
        }
    }

    @ViewBuilder
    private var content: some View {
        if isLoading && (brawlers.isEmpty || gameModes.isEmpty) {
            ProgressView("Loading tier list data…")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let errorMessage {
            ContentUnavailableView(
                "Couldn’t Load Tier Lists",
                systemImage: "exclamationmark.triangle",
                description: Text(errorMessage)
            )
            .overlay(alignment: .bottom) {
                Button("Retry") {
                    Task { await reloadData() }
                }
                .buttonStyle(.bordered)
                .padding()
            }
        } else if brawlers.isEmpty || gameModes.isEmpty {
            ContentUnavailableView(
                "No Tier Data",
                systemImage: "list.star",
                description: Text("Try again once the Brawlify data is available.")
            )
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    modePicker
                    if let selectedGameMode {
                        modeHeader(selectedGameMode)
                    }
                    ForEach(Self.tiers, id: \.self) { tier in
                        tierSection(tier)
                    }
                }
                .padding()
            }
        }
    }

    private var modePicker: some View {
        Picker("Game Mode", selection: Binding(
            get: { selectedGameModeId ?? "" },
            set: { selectedGameModeId = $0 }
        )) {
            ForEach(gameModes) { mode in
                Text(mode.name).tag(mode.id)
            }
        }
        .pickerStyle(.menu)
    }

    private func modeHeader(_ mode: GameMode) -> some View {
        HStack(spacing: 12) {
            if let url = mode.iconURL {
                CachedAsyncImage(url: url)
                    .frame(width: 44, height: 44)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(mode.name)
                    .font(.headline)
                Text("Drag brawlers between tiers. Changes save automatically on this device.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func tierSection(_ tier: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(tier)
                    .font(.headline)
                Spacer()
                Text("\(tierAssignments[tier, default: []].count)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 76, maximum: 96), spacing: 10)], spacing: 10) {
                ForEach(tierAssignments[tier, default: []], id: \.self) { brawlerId in
                    if let brawler = brawlerLookup[brawlerId] {
                        TierBrawlerChip(brawler: brawler)
                            .draggable(brawler.id)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(tierBackgroundColor(for: tier))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .dropDestination(for: String.self) { items, _ in
                guard let brawlerId = items.first else { return false }
                moveBrawler(brawlerId, to: tier)
                return true
            }
        }
    }

    private func tierBackgroundColor(for tier: String) -> Color {
        switch tier {
        case "S": return Color.orange.opacity(0.20)
        case "A": return Color.yellow.opacity(0.20)
        case "B": return Color.green.opacity(0.18)
        case "C": return Color.blue.opacity(0.18)
        case "D": return Color.purple.opacity(0.16)
        default: return Color(.secondarySystemBackground)
        }
    }

    private func loadDataIfNeeded() async {
        guard brawlers.isEmpty || gameModes.isEmpty else { return }
        await reloadData()
    }

    private func reloadData() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            async let fetchedBrawlers = BrawlifyService.shared.fetchBrawlers()
            async let fetchedGameModes = BrawlifyService.shared.fetchGameModes()

            let (loadedBrawlers, loadedGameModes) = try await (fetchedBrawlers, fetchedGameModes)
            brawlers = loadedBrawlers.sorted { $0.name < $1.name }
            gameModes = loadedGameModes.sorted { $0.name < $1.name }

            if selectedGameModeId == nil {
                selectedGameModeId = gameModes.first?.id
            }
            syncAssignmentsForSelectedMode()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func syncAssignmentsForSelectedMode() {
        guard let selectedGameMode else { return }
        let existingList = savedLists.first(where: { $0.gameModeId == selectedGameMode.id })
        tierAssignments = normalizedAssignments(existingList?.assignments ?? [:])
    }

    private func normalizedAssignments(_ rawAssignments: [String: [String]]) -> [String: [String]] {
        var normalized = Dictionary(uniqueKeysWithValues: Self.tiers.map { ($0, [String]()) })
        let validBrawlerIds = Set(brawlers.map(\.id))
        var seen = Set<String>()

        for tier in Self.tiers {
            for brawlerId in rawAssignments[tier, default: []] where validBrawlerIds.contains(brawlerId) && !seen.contains(brawlerId) {
                normalized[tier, default: []].append(brawlerId)
                seen.insert(brawlerId)
            }
        }

        for brawler in brawlers where !seen.contains(brawler.id) {
            normalized["Unranked", default: []].append(brawler.id)
        }

        return normalized
    }

    private func moveBrawler(_ brawlerId: String, to destinationTier: String) {
        guard Self.tiers.contains(destinationTier) else { return }

        var updatedAssignments = tierAssignments
        for tier in Self.tiers {
            updatedAssignments[tier, default: []].removeAll { $0 == brawlerId }
        }
        updatedAssignments[destinationTier, default: []].append(brawlerId)
        tierAssignments = updatedAssignments
        saveCurrentAssignments(updatedAssignments)
    }

    private func saveCurrentAssignments(_ assignments: [String: [String]]) {
        guard let selectedGameMode else { return }

        if let existingList = savedLists.first(where: { $0.gameModeId == selectedGameMode.id }) {
            existingList.gameModeName = selectedGameMode.name
            existingList.assignments = assignments
        } else {
            let list = TierList(
                gameModeId: selectedGameMode.id,
                gameModeName: selectedGameMode.name
            )
            list.assignments = assignments
            modelContext.insert(list)
        }
    }
}

private struct TierBrawlerChip: View {
    let brawler: Brawler

    var body: some View {
        VStack(spacing: 6) {
            if let url = brawler.iconURL {
                CachedAsyncImage(url: url)
                    .frame(width: 50, height: 50)
                    .clipShape(Circle())
            }
            Text(brawler.name)
                .font(.caption2)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .padding(.horizontal, 6)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    TierListsView()
        .modelContainer(for: TierList.self, inMemory: true)
}
