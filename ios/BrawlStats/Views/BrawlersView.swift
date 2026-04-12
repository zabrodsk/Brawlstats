import SwiftUI

struct BrawlersView: View {
    @State private var brawlers: [Brawler] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var searchText = ""

    private var filteredBrawlers: [Brawler] {
        guard !searchText.isEmpty else { return brawlers }
        return brawlers.filter {
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            $0.role.localizedCaseInsensitiveContains(searchText) ||
            $0.rarity.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Brawlers")
                .searchable(text: $searchText, prompt: "Search brawlers")
                .task {
                    await loadBrawlers()
                }
        }
    }

    @ViewBuilder
    private var content: some View {
        if isLoading && brawlers.isEmpty {
            ProgressView("Loading brawlers…")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let error = errorMessage, brawlers.isEmpty {
            ContentUnavailableView(
                "Failed to Load",
                systemImage: "exclamationmark.triangle",
                description: Text(error)
            )
            .overlay(alignment: .bottom) {
                Button("Retry") {
                    Task { await loadBrawlers() }
                }
                .buttonStyle(.bordered)
                .padding()
            }
        } else {
            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 100, maximum: 140))], spacing: 16) {
                    ForEach(filteredBrawlers) { brawler in
                        NavigationLink {
                            BrawlerDetailView(brawler: brawler)
                        } label: {
                            BrawlerCard(brawler: brawler)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
            }
            .refreshable {
                await loadBrawlers()
            }
        }
    }

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

// MARK: - BrawlerCard

private struct BrawlerCard: View {
    let brawler: Brawler

    var body: some View {
        VStack(spacing: 6) {
            if let url = brawler.iconURL {
                CachedAsyncImage(url: url)
                    .frame(width: 70, height: 70)
                    .clipShape(Circle())
                    .background(Circle().fill(Color(.systemGray6)))
            }
            Text(brawler.name)
                .font(.caption)
                .fontWeight(.semibold)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(brawler.role)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding(8)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    BrawlersView()
}

private struct BrawlerDetailView: View {
    let brawler: Brawler

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                heroCard
                detailCard(title: "Role", value: brawler.role)
                detailCard(title: "Rarity", value: brawler.rarity)
                VStack(alignment: .leading, spacing: 10) {
                    Text("Overview")
                        .font(.headline)
                    Text(brawler.description)
                        .font(.body)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(18)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 18))
            }
            .padding()
        }
        .navigationTitle(brawler.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var heroCard: some View {
        HStack(spacing: 16) {
            if let url = brawler.iconURL {
                CachedAsyncImage(url: url)
                    .frame(width: 96, height: 96)
                    .clipShape(RoundedRectangle(cornerRadius: 24))
                    .background(
                        RoundedRectangle(cornerRadius: 24)
                            .fill(Color(.systemGray6))
                    )
            }
            VStack(alignment: .leading, spacing: 6) {
                Text(brawler.name)
                    .font(.title2.weight(.bold))
                Text(brawler.role)
                    .font(.headline)
                    .foregroundStyle(.secondary)
                Text(brawler.rarity)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(20)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private func detailCard(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.headline)
            Text(value)
                .font(.body)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }
}
