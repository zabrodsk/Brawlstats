import SwiftUI

struct HomeHubView: View {
    var onOpenMaps: () -> Void
    var onOpenBrawlers: () -> Void
    var onOpenTiers: () -> Void
    var onOpenStrats: () -> Void
    var onOpenAccount: () -> Void
    var onJumpToMapsMode: (MapsQuickMode) -> Void

    @AppStorage("brawlStarsApiBaseURL") private var apiBaseURL: String = ""
    @AppStorage("brawlStarsPlayerTag") private var savedPlayerTag: String = ""

    @State private var mapsForCounts: [GameMap] = []
    @State private var countsLoading = false
    @State private var rotationSlots: [RotationSlot] = []
    @State private var rotationError: String?
    @State private var finderTagDraft: String = ""
    @State private var selectedRotationSlot: RotationSlot?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    hero

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Current rotation")
                            .font(.title3.weight(.semibold))
                        currentRotation
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Find profile")
                            .font(.title3.weight(.semibold))
                        profileFinder
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Jump in")
                            .font(.title3.weight(.semibold))
                        jumpInRow
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Explore")
                            .font(.title3.weight(.semibold))
                        exploreGrid
                    }
                }
                .padding(20)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Home")
            .navigationBarTitleDisplayMode(.large)
            .task {
                finderTagDraft = savedPlayerTag
                await loadHomeData()
            }
            .refreshable {
                await loadHomeData()
            }
            .fullScreenCover(item: $selectedRotationSlot) { slot in
                StrategyEditorView(
                    initialMapId: slot.mapId ?? "",
                    initialGameMode: slot.mode
                )
            }
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Title scale sits under the nav "Home" large title without duplicating another huge headline.
            VStack(alignment: .leading, spacing: 8) {
                Text("Brawl Strategy")
                    .font(.title.weight(.bold))
                    .foregroundStyle(.primary)
                    .accessibilityAddTraits(.isHeader)
                Text("Maps, strats, and tiers in one native hub.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            // Thin rule + short brand accent reads calmer than a vertical bar beside the wordmark.
            VStack(alignment: .leading, spacing: 0) {
                Rectangle()
                    .fill(Color.primary.opacity(0.1))
                    .frame(height: 1)
                HStack(spacing: 0) {
                    RoundedRectangle(cornerRadius: 1.5)
                        .fill(Color(red: 1, green: 0.84, blue: 0.2))
                        .frame(width: 48, height: 3)
                    Spacer(minLength: 0)
                }
                .padding(.top, 2)
            }
            .padding(.top, 14)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var jumpInRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(MapsQuickMode.allCases, id: \.self) { mode in
                    jumpChip(mode: mode)
                }
            }
            .padding(.vertical, 2)
        }
    }

    private func jumpChip(mode: MapsQuickMode) -> some View {
        Button {
            onJumpToMapsMode(mode)
        } label: {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: mode.systemImage)
                        .font(.title2)
                        .foregroundStyle(.primary)
                    Spacer()
                    Text(countLabel(for: mode))
                        .font(.caption.weight(.semibold))
                        .monospacedDigit()
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(.tertiarySystemFill))
                        .clipShape(Capsule())
                }
                Text(mode.title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                Text("Open in Maps")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(16)
            .frame(width: 168, alignment: .leading)
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .strokeBorder(Color.primary.opacity(0.06), lineWidth: 1)
            )
        }
        .buttonStyle(PressScaleButtonStyle())
    }

    private func countLabel(for mode: MapsQuickMode) -> String {
        if countsLoading && mapsForCounts.isEmpty { return "—" }
        let n = mapsForCounts.filter { mode.matches(gameModeName: $0.gameModeName) }.count
        return "\(n)"
    }

    private var exploreGrid: some View {
        let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
        return LazyVGrid(columns: columns, spacing: 12) {
            exploreCard(
                title: "Maps",
                subtitle: "Modes & map pool",
                systemImage: "map.fill",
                action: onOpenMaps
            )
            exploreCard(
                title: "Brawlers",
                subtitle: "Roster reference",
                systemImage: "person.3.fill",
                action: onOpenBrawlers
            )
            exploreCard(
                title: "Tier lists",
                subtitle: "Rankings in-app",
                systemImage: "list.star",
                action: onOpenTiers
            )
            exploreCard(
                title: "My strategies",
                subtitle: "Saved boards",
                systemImage: "folder.fill",
                action: onOpenStrats
            )
        }
    }

    private func exploreCard(title: String, subtitle: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: systemImage)
                    .font(.title3)
                    .foregroundStyle(.secondary)
                    .frame(width: 28, alignment: .center)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .strokeBorder(Color.primary.opacity(0.06), lineWidth: 1)
            )
        }
        .buttonStyle(PressScaleButtonStyle())
    }

    private var profileFinder: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Jump directly to Account dashboard with player + club data.")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("Supercell API does not support global player-name search yet, so use player tag.")
                .font(.caption2)
                .foregroundStyle(.secondary)

            HStack(spacing: 8) {
                TextField("#PLAYER…", text: $finderTagDraft)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                Button("Open") {
                    if let normalized = normalizedTag(finderTagDraft) {
                        savedPlayerTag = normalized
                    }
                    onOpenAccount()
                }
                .buttonStyle(.borderedProminent)
                .tint(Color(red: 1, green: 0.84, blue: 0.2))
                .foregroundStyle(.black)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(Color.primary.opacity(0.06), lineWidth: 1)
        )
    }

    private var currentRotation: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let rotationError {
                Text(rotationError)
                    .font(.caption)
                    .foregroundStyle(.orange)
            }

            if rotationSlots.isEmpty {
                Text("No live rotation yet. Set your API base URL in Account to enable this feed.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(rotationSlots.prefix(6)) { slot in
                    HStack(alignment: .top, spacing: 12) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(slot.mapName)
                                .font(.subheadline.weight(.semibold))
                            Text(slot.mode)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer(minLength: 0)
                        if slot.mapId != nil {
                            Button("Open") {
                                selectedRotationSlot = slot
                            }
                            .font(.caption.weight(.semibold))
                            .buttonStyle(.bordered)
                        }
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
        }
    }

    private func normalizedTag(_ raw: String) -> String? {
        var s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.isEmpty { return nil }
        s = s.replacingOccurrences(of: "#", with: "")
        let filtered = String(s.uppercased().filter { $0.isLetter || $0.isNumber })
        guard filtered.count >= 3 else { return nil }
        return "#" + filtered
    }

    private func loadHomeData() async {
        async let mapsTask: Void = loadMapCounts()
        async let rotationTask: Void = loadRotation()
        _ = await (mapsTask, rotationTask)
    }

    private func loadMapCounts() async {
        countsLoading = true
        defer { countsLoading = false }
        do {
            mapsForCounts = try await BrawlifyService.shared.fetchMaps()
        } catch {
            if mapsForCounts.isEmpty {
                mapsForCounts = []
            }
        }
    }

    private func loadRotation() async {
        rotationError = nil

        let trimmed = apiBaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let url = URL(string: trimmed), let scheme = url.scheme, (scheme == "https" || scheme == "http") else {
            rotationSlots = []
            if !trimmed.isEmpty {
                rotationError = "API base URL is invalid. Open Account to fix it."
            }
            return
        }

        do {
            let client = BrawlStarsAPIClient(baseURL: url)
            let any = try await client.getJSONObject(path: "/api/brawlstars/events/rotation")
            rotationSlots = parseRotation(any).prefix(12).map { $0 }
        } catch {
            rotationSlots = []
            rotationError = "Could not load live rotation from API."
        }
    }

    private func parseRotation(_ any: Any) -> [RotationSlot] {
        let items: [Any]
        if let arr = any as? [Any] {
            items = arr
        } else if let d = any as? [String: Any], let cur = d["current"] as? [Any] {
            items = cur
        } else if let d = any as? [String: Any], let arr = d["items"] as? [Any] {
            items = arr
        } else {
            return []
        }

        return items.compactMap { item in
            guard let rec = item as? [String: Any] else { return nil }
            let ev = (rec["event"] as? [String: Any]) ?? rec
            let mapName = (ev["map"] as? String) ?? (ev["mapName"] as? String) ?? "Unknown map"
            let mode = (ev["mode"] as? String) ?? "Unknown mode"
            let mapId: String?
            if let id = ev["mapId"] {
                mapId = String(describing: id)
            } else {
                mapId = nil
            }
            return RotationSlot(mapId: mapId, mapName: mapName, mode: mode)
        }
    }
}

private struct RotationSlot: Identifiable {
    let id = UUID()
    let mapId: String?
    let mapName: String
    let mode: String
}

private struct PressScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.easeOut(duration: 0.14), value: configuration.isPressed)
    }
}
