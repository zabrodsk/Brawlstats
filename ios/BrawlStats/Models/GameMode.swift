import Foundation

struct GameMode: Codable, Identifiable {
    let id: String
    let name: String
    let color: String
    let hash: String

    var iconURL: URL? {
        URL(string: "https://cdn.brawlify.com/game-modes/regular/\(id).png")
    }
}

// MARK: - API Response Wrapper

struct GameModesResponse: Codable {
    let list: [GameModeAPI]
}

struct GameModeAPI: Codable {
    let id: Int
    let name: String
    let color: String
    let hash: String

    func toGameMode() -> GameMode {
        GameMode(
            id: String(id),
            name: name,
            color: color,
            hash: hash
        )
    }
}
