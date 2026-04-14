import SwiftUI

/// Player tag stored on-device; API calls go to your `brawlStarsApiBaseURL` (Next BFF).
struct AccountView: View {
    @AppStorage("brawlStarsApiBaseURL") private var apiBaseURL: String = ""
    @AppStorage("brawlStarsPlayerTag") private var playerTag: String = ""
    @AppStorage("brawlStarsMyProfileTag") private var myProfileTag: String = ""
    @AppStorage("brawlStarsClubTagOverride") private var clubTagOverride: String = ""

    @State private var baseDraft: String = ""
    @State private var tagDraft: String = ""
    @State private var clubDraft: String = ""
    @State private var hasToken: Bool?
    @State private var profileData: [String: Any]?
    @State private var battleItems: [[String: Any]] = []
    @State private var battleInsights: [String: Any]?
    @State private var clubData: [String: Any]?
    @State private var clubMembers: [[String: Any]] = []
    @State private var rotationRows: [[String: Any]] = []
    @State private var worstCounter: [String: Any]?
    @State private var errorMessage: String?
    @State private var loading = false
    @State private var activeLookupTag: String = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    settingsPanel

                    if let errorMessage {
                        card {
                            Text(errorMessage)
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                    }

                    if let profileData {
                        profilePanel(profileData)
                    }

                    if let battleInsights {
                        battleInsightsPanel(battleInsights)
                    }

                    if let clubData {
                        clubPanel(clubData)
                    }

                    if !rotationRows.isEmpty {
                        rotationPanel
                    }

                    if !battleItems.isEmpty {
                        recentBattlesPanel
                    }
                }
                .padding(16)
            }
            .navigationTitle("Account")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                baseDraft = apiBaseURL
                tagDraft = playerTag
                clubDraft = clubTagOverride
                let savedMyTag = normalizedTag(myProfileTag)
                if normalizedTag(playerTag) == nil, let savedMyTag {
                    playerTag = savedMyTag
                    tagDraft = savedMyTag
                }
                Task { await reload(usingTag: nil) }
            }
            .refreshable {
                await reload(usingTag: nil)
            }
            .overlay {
                if loading {
                    ProgressView()
                        .padding()
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                }
            }
        }
    }

    private func normalizedTag(_ raw: String) -> String? {
        var s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.isEmpty { return nil }
        if s.hasPrefix("%23") {
            s = s.removingPercentEncoding ?? s
        }
        s = s.replacingOccurrences(of: "#", with: "")
        let filtered = String(s.uppercased().filter { $0.isLetter || $0.isNumber })
        guard filtered.count >= 3 else { return nil }
        return "#" + filtered
    }

    private func pathEncodedTag(_ tag: String) -> String? {
        guard let n = normalizedTag(tag) else { return nil }
        // Supercell path expects `#` as `%23` in the URL segment.
        return n.replacingOccurrences(of: "#", with: "%23")
    }

    private func client() throws -> BrawlStarsAPIClient {
        let trimmed = apiBaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let url = URL(string: trimmed), let scheme = url.scheme, (scheme == "https" || scheme == "http") else {
            throw BrawlStarsAPIError.invalidBaseURL
        }
        return BrawlStarsAPIClient(baseURL: url)
    }

    @MainActor
    private func reload(usingTag overrideTag: String?) async {
        errorMessage = nil
        profileData = nil
        battleItems = []
        battleInsights = nil
        clubData = nil
        clubMembers = []
        rotationRows = []
        worstCounter = nil

        guard !apiBaseURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "Set API base URL to your deployed web origin (where Next `/api/brawlstars` lives)."
            return
        }

        loading = true
        defer { loading = false }

        do {
            let c = try client()
            let healthAny = try await c.getJSONObject(path: "/api/brawlstars/health")
            if let h = healthAny as? [String: Any], let ht = h["hasToken"] as? Bool {
                hasToken = ht
            } else {
                hasToken = nil
            }

            let lookupTag = normalizedTag(overrideTag ?? "") ?? normalizedTag(playerTag)
            guard let lookupTag, let enc = pathEncodedTag(lookupTag) else {
                return
            }
            activeLookupTag = lookupTag

            let profileAny = try await c.getJSONObject(path: "/api/brawlstars/players/\(enc)") as? [String: Any]
            profileData = profileAny

            let battleAny = try await c.getJSONObject(path: "/api/brawlstars/players/\(enc)/battlelog")
            if let b = battleAny as? [String: Any] {
                battleInsights = b["insights"] as? [String: Any]
                battleItems = (b["items"] as? [[String: Any]]) ?? []
            }

            if let worstAny = try? await c.getJSONObject(path: "/api/brawlstars/players/\(enc)/worst-counter") as? [String: Any] {
                worstCounter = worstAny
            }

            let clubTag: String? = {
                if let o = normalizedTag(clubTagOverride) { return o }
                if let dict = profileAny,
                   let club = dict["club"] as? [String: Any],
                   let t = club["tag"] as? String
                {
                    return normalizedTag(t)
                }
                return nil
            }()

            if let ct = clubTag, let cenc = pathEncodedTag(ct) {
                clubData = try await c.getJSONObject(path: "/api/brawlstars/clubs/\(cenc)") as? [String: Any]
                if let membersAny = try? await c.getJSONObject(path: "/api/brawlstars/clubs/\(cenc)/members") as? [String: Any] {
                    clubMembers = (membersAny["items"] as? [[String: Any]]) ?? []
                } else {
                    clubMembers = []
                }
            }

            do {
                let rot = try await c.getJSONObject(path: "/api/brawlstars/events/rotation")
                rotationRows = parseRotationRows(rot)
            } catch {
                rotationRows = []
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func parseRotationRows(_ any: Any) -> [[String: Any]] {
        if let arr = any as? [[String: Any]] { return arr }
        if let d = any as? [String: Any], let cur = d["current"] as? [[String: Any]] { return cur }
        if let d = any as? [String: Any], let items = d["items"] as? [[String: Any]] { return items }
        return []
    }

    private var settingsPanel: some View {
        card {
            VStack(alignment: .leading, spacing: 10) {
                Text("API settings")
                    .font(.headline)
                TextField("https://your-app.pages.dev", text: $baseDraft)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    #if os(iOS)
                    .keyboardType(.URL)
                    #endif
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                HStack(spacing: 8) {
                    TextField("#PLAYER…", text: $tagDraft)
                        .textInputAutocapitalization(.characters)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 9)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                    TextField("Club override", text: $clubDraft)
                        .textInputAutocapitalization(.characters)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 9)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }

                HStack(spacing: 10) {
                    Button("Save & reload") {
                        apiBaseURL = baseDraft.trimmingCharacters(in: .whitespacesAndNewlines)
                        playerTag = tagDraft.trimmingCharacters(in: .whitespacesAndNewlines)
                        clubTagOverride = clubDraft.trimmingCharacters(in: .whitespacesAndNewlines)
                        Task { await reload(usingTag: nil) }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color(red: 1, green: 0.84, blue: 0.2))
                    .foregroundStyle(.black)

                    Button("Search other") {
                        clubTagOverride = clubDraft.trimmingCharacters(in: .whitespacesAndNewlines)
                        Task { await reload(usingTag: tagDraft) }
                    }
                    .buttonStyle(.bordered)

                    Button("Set My profile") {
                        if let normalized = normalizedTag(tagDraft) {
                            myProfileTag = normalized
                            playerTag = normalized
                            tagDraft = normalized
                        }
                    }
                    .buttonStyle(.bordered)

                    if let hasToken {
                        Label(
                            hasToken ? "Server token ready" : "Server token missing",
                            systemImage: hasToken ? "checkmark.circle.fill" : "exclamationmark.triangle.fill"
                        )
                        .font(.caption)
                        .foregroundColor(hasToken ? .secondary : .orange)
                    }
                }

                if let saved = normalizedTag(myProfileTag) {
                    HStack(spacing: 8) {
                        Text("My profile: \(saved)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Button("Open My profile") {
                            tagDraft = saved
                            playerTag = saved
                            Task { await reload(usingTag: nil) }
                        }
                        .buttonStyle(.bordered)
                        .font(.caption)
                    }
                }
            }
        }
    }

    private func profilePanel(_ d: [String: Any]) -> some View {
        let name = d["name"] as? String ?? "?"
        let tag = d["tag"] as? String ?? "?"
        let trophies = d["trophies"] as? Int
        let best = d["highestTrophies"] as? Int
        let level = d["expLevel"] as? Int
        let brawlers = (d["brawlers"] as? [[String: Any]]) ?? []
        return card {
            VStack(alignment: .leading, spacing: 8) {
                Text(name)
                    .font(.title3.weight(.semibold))
                Text(tag)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if !activeLookupTag.isEmpty {
                    Text("Viewing: \(activeLookupTag)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                HStack {
                    metricCell("Trophies", trophies.map(String.init) ?? "—")
                    metricCell("Best", best.map(String.init) ?? "—")
                    metricCell("Level", level.map(String.init) ?? "—")
                    metricCell("Brawlers", "\(brawlers.count)")
                }

                if let worstCounter {
                    let worstCount = worstCounter["worstOnTeamCount"] as? Int ?? 0
                    let tracked = worstCounter["matchesTracked"] as? Int ?? 0
                    let rate = worstCounter["worstRate"] as? Double
                    Text("Worst-on-team: \(worstCount)/\(tracked) (\(percent(rate)))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private func battleInsightsPanel(_ d: [String: Any]) -> some View {
        let winRate = d["overallWinRate"] as? Double
        let starRate = d["starPlayerRate"] as? Double
        let avgDelta = d["avgTrophyDelta"] as? Double
        let sample = d["sampleSize"] as? Int ?? 0
        let streakText: String = {
            guard let s = d["currentStreak"] as? [String: Any],
                  let t = s["type"] as? String,
                  let len = s["length"] as? Int else { return "—" }
            if t == "none" { return "—" }
            return "\(t) ×\(len)"
        }()
        return card {
            VStack(alignment: .leading, spacing: 8) {
                Text("Battle insights")
                    .font(.headline)
                HStack {
                    metricCell("Sample", "\(sample)")
                    metricCell("Win rate", percent(winRate))
                    metricCell("Star rate", percent(starRate))
                    metricCell("Avg Δ", avgDelta == nil ? "—" : String(format: "%.1f", avgDelta!))
                }
                Text("Current streak: \(streakText)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func clubPanel(_ d: [String: Any]) -> some View {
        let name = d["name"] as? String ?? "Club"
        let tag = d["tag"] as? String ?? "—"
        return card {
            VStack(alignment: .leading, spacing: 8) {
                Text("Club")
                    .font(.headline)
                Text(name)
                    .font(.subheadline.weight(.semibold))
                Text(tag)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if !clubMembers.isEmpty {
                    ForEach(Array(clubMembers.prefix(12).enumerated()), id: \.offset) { _, member in
                        HStack {
                            Text(member["name"] as? String ?? "Member")
                            Spacer()
                            Text(member["role"] as? String ?? "")
                                .foregroundStyle(.secondary)
                            Text(member["trophies"].map { String(describing: $0) } ?? "—")
                                .monospacedDigit()
                        }
                        .font(.caption)
                    }
                }
            }
        }
    }

    private var rotationPanel: some View {
        card {
            VStack(alignment: .leading, spacing: 8) {
                Text("Current rotation")
                    .font(.headline)
                ForEach(Array(rotationRows.prefix(10).enumerated()), id: \.offset) { _, row in
                    let event = (row["event"] as? [String: Any]) ?? row
                    let mode = event["mode"] as? String ?? "Unknown mode"
                    let map = (event["map"] as? String) ?? (event["mapName"] as? String) ?? "Unknown map"
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(map)
                            Text(mode).foregroundStyle(.secondary)
                        }
                        .font(.caption)
                        Spacer()
                    }
                }
            }
        }
    }

    private var recentBattlesPanel: some View {
        card {
            VStack(alignment: .leading, spacing: 8) {
                Text("Recent battles")
                    .font(.headline)
                ForEach(Array(battleItems.prefix(15).enumerated()), id: \.offset) { _, item in
                    let event = (item["event"] as? [String: Any]) ?? [:]
                    let battle = (item["battle"] as? [String: Any]) ?? [:]
                    let map = (event["map"] as? String) ?? (event["mapName"] as? String) ?? "Unknown map"
                    let mode = event["mode"] as? String ?? "Unknown mode"
                    let result = battle["result"] as? String ?? "unknown"
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(map)
                            Text(mode).foregroundStyle(.secondary)
                        }
                        .font(.caption)
                        Spacer()
                        Text(result)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(result == "victory" ? .green : (result == "defeat" ? .red : .secondary))
                    }
                }
            }
        }
    }

    private func metricCell(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.caption.weight(.semibold))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func percent(_ n: Double?) -> String {
        guard let n else { return "—" }
        return String(format: "%.0f%%", n * 100)
    }

    private func card<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .strokeBorder(Color.primary.opacity(0.06), lineWidth: 1)
            )
    }
}

#Preview {
    AccountView()
}
