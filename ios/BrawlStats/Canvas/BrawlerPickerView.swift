import SwiftUI

// MARK: - BrawlerPickerView

struct BrawlerPickerView: View {
    @Binding var isPresented: Bool
    let placedBrawlerIds: Set<String>
    var onSelect: (Brawler, Team) -> Void

    @State private var brawlers: [Brawler] = []
    @State private var searchText = ""
    @State private var selectedTeam: Team = .friendly
    @State private var isLoading = false
    @State private var errorMessage: String?

    @Environment(\.horizontalSizeClass) private var hSizeClass

    private var filteredBrawlers: [Brawler] {
        if searchText.isEmpty {
            return brawlers
        }
        return brawlers.filter {
            $0.name.localizedCaseInsensitiveContains(searchText)
        }
    }

    // 3-column grid
    private let columns = [
        GridItem(.adaptive(minimum: 72, maximum: 88), spacing: 8)
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Team toggle
                Picker("Team", selection: $selectedTeam) {
                    Text("Blue Team").tag(Team.friendly)
                    Text("Red Team").tag(Team.enemy)
                }
                .pickerStyle(.segmented)
                .padding()

                // Content
                if isLoading && brawlers.isEmpty {
                    Spacer()
                    ProgressView("Loading brawlers…")
                    Spacer()
                } else if let error = errorMessage, brawlers.isEmpty {
                    Spacer()
                    ContentUnavailableView(
                        "Failed to Load",
                        systemImage: "exclamationmark.triangle",
                        description: Text(error)
                    )
                    .overlay(alignment: .bottom) {
                        Button("Retry") { Task { await loadBrawlers() } }
                            .buttonStyle(.bordered)
                            .padding()
                    }
                    Spacer()
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 10) {
                            ForEach(filteredBrawlers) { brawler in
                                BrawlerCell(
                                    brawler: brawler,
                                    team: selectedTeam,
                                    isPlaced: placedBrawlerIds.contains(brawler.id)
                                ) {
                                    onSelect(brawler, selectedTeam)
                                    isPresented = false
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search brawlers")
            .navigationTitle("Add Brawler")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { isPresented = false }
                }
            }
        }
        .task {
            await loadBrawlers()
        }
    }

    // MARK: - Load

    private func loadBrawlers() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            brawlers = try await BrawlifyService.shared.fetchBrawlers()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - BrawlerCell

private struct BrawlerCell: View {
    let brawler: Brawler
    let team: Team
    let isPlaced: Bool
    let onTap: () -> Void

    private var teamColor: Color {
        team == .friendly ? Color(hex: "#1E90FF") : Color(hex: "#FF4444")
    }

    var body: some View {
        Button(action: onTap) {
            ZStack(alignment: .bottomTrailing) {
                VStack(spacing: 4) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(teamColor.opacity(0.12))
                            .frame(width: 64, height: 64)
                        if let url = brawler.iconURL {
                            CachedAsyncImage(url: url, contentMode: .fit)
                                .frame(width: 52, height: 52)
                        }
                    }
                    Text(brawler.name)
                        .font(.caption2)
                        .lineLimit(1)
                        .foregroundStyle(.primary)
                }

                // Indicator if already placed
                if isPlaced {
                    Circle()
                        .fill(teamColor)
                        .frame(width: 12, height: 12)
                        .overlay(
                            Image(systemName: "checkmark")
                                .font(.system(size: 7, weight: .bold))
                                .foregroundStyle(.white)
                        )
                        .offset(x: 4, y: -20)
                }
            }
        }
        .buttonStyle(.plain)
    }
}
