import SwiftUI

struct MyClubView: View {
    @AppStorage("brawlStarsApiBaseURL") private var apiBaseURL: String = ""
    @AppStorage("brawlStarsMyProfileTag") private var myProfileTag: String = ""
    @AppStorage("brawlStarsPlayerTag") private var playerTag: String = ""

    @State private var tagDraft: String = ""
    @State private var loading = false
    @State private var errorMessage: String?
    @State private var clubData: [String: Any]?
    @State private var members: [[String: Any]] = []

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    searchPanel

                    if let errorMessage {
                        card {
                            Text(errorMessage)
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                    }

                    if let clubData {
                        clubOverviewPanel(clubData)
                    }

                    if !members.isEmpty {
                        membersPanel
                    }
                }
                .padding(16)
            }
            .navigationTitle("My Club")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                let seed = normalizedTag(myProfileTag) ?? normalizedTag(playerTag) ?? ""
                tagDraft = seed
                Task { await loadClub(for: seed, persistAsMyProfile: false) }
            }
            .refreshable {
                await loadClub(for: tagDraft, persistAsMyProfile: false)
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

    private var searchPanel: some View {
        card {
            VStack(alignment: .leading, spacing: 10) {
                Text("Load club by player tag")
                    .font(.headline)

                TextField("#PLAYER…", text: $tagDraft)
                    .textInputAutocapitalization(.characters)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                HStack(spacing: 10) {
                    Button("Load club") {
                        Task { await loadClub(for: tagDraft, persistAsMyProfile: false) }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color(red: 1, green: 0.84, blue: 0.2))
                    .foregroundStyle(.black)

                    Button("Save as My profile") {
                        Task { await loadClub(for: tagDraft, persistAsMyProfile: true) }
                    }
                    .buttonStyle(.bordered)
                }

                if let myTag = normalizedTag(myProfileTag) {
                    Text("My profile on device: \(myTag)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    @MainActor
    private func loadClub(for sourceTag: String, persistAsMyProfile: Bool) async {
        errorMessage = nil
        clubData = nil
        members = []

        guard let c = try? client() else {
            errorMessage = "Set API base URL in Account first."
            return
        }
        guard let normalized = normalizedTag(sourceTag), let encoded = pathEncodedTag(sourceTag) else {
            errorMessage = "Enter a valid player tag first."
            return
        }

        loading = true
        defer { loading = false }

        do {
            let playerAny = try await c.getJSONObject(path: "/api/brawlstars/players/\(encoded)")
            let player = playerAny as? [String: Any]
            let club = (player?["club"] as? [String: Any]) ?? [:]
            guard let clubTagRaw = club["tag"] as? String, let clubEncoded = pathEncodedTag(clubTagRaw) else {
                errorMessage = "This player is currently not in a club."
                return
            }

            clubData = try await c.getJSONObject(path: "/api/brawlstars/clubs/\(clubEncoded)") as? [String: Any]
            if let membersAny = try? await c.getJSONObject(path: "/api/brawlstars/clubs/\(clubEncoded)/members") as? [String: Any] {
                members = (membersAny["items"] as? [[String: Any]]) ?? []
            }

            if persistAsMyProfile {
                myProfileTag = normalized
                playerTag = normalized
            }
        } catch {
            errorMessage = error.localizedDescription
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
        return n.replacingOccurrences(of: "#", with: "%23")
    }

    private func client() throws -> BrawlStarsAPIClient {
        let trimmed = apiBaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let url = URL(string: trimmed), let scheme = url.scheme, (scheme == "https" || scheme == "http") else {
            throw BrawlStarsAPIError.invalidBaseURL
        }
        return BrawlStarsAPIClient(baseURL: url)
    }

    private func clubOverviewPanel(_ d: [String: Any]) -> some View {
        let memberCount = members.count
        let totalTrophies = members.reduce(0) { partial, member in
            partial + ((member["trophies"] as? Int) ?? 0)
        }
        let average = memberCount > 0 ? totalTrophies / memberCount : 0

        let roleCounts = members.reduce(into: [String: Int]()) { partial, member in
            let role = (member["role"] as? String) ?? "member"
            partial[role, default: 0] += 1
        }

        return card {
            VStack(alignment: .leading, spacing: 10) {
                Text(d["name"] as? String ?? "Club")
                    .font(.title3.weight(.semibold))
                Text(d["tag"] as? String ?? "—")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                HStack {
                    metricCell("Members", "\(memberCount)")
                    metricCell("Avg trophies", "\(average)")
                    metricCell("Required", "\((d["requiredTrophies"] as? Int) ?? 0)")
                    metricCell("Type", (d["type"] as? String ?? "—").replacingOccurrences(of: "_", with: " "))
                }

                if !roleCounts.isEmpty {
                    HStack {
                        metricCell("Presidents", "\(roleCounts["president"] ?? 0)")
                        metricCell("Vice presidents", "\(roleCounts["vicePresident"] ?? 0)")
                        metricCell("Seniors", "\(roleCounts["senior"] ?? 0)")
                        metricCell("Members", "\(roleCounts["member"] ?? 0)")
                    }
                }

                if let description = d["description"] as? String, !description.isEmpty {
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var membersPanel: some View {
        card {
            VStack(alignment: .leading, spacing: 8) {
                Text("Members")
                    .font(.headline)

                ForEach(Array(members.sorted(by: {
                    (($0["trophies"] as? Int) ?? 0) > (($1["trophies"] as? Int) ?? 0)
                }).enumerated()), id: \.offset) { _, member in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(member["name"] as? String ?? "Member")
                            Text(member["role"] as? String ?? "member")
                                .foregroundStyle(.secondary)
                        }
                        .font(.caption)

                        Spacer()

                        Text("\((member["trophies"] as? Int) ?? 0)")
                            .font(.caption.weight(.semibold))
                            .monospacedDigit()
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
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
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
    MyClubView()
}
