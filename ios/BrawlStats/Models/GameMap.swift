import Foundation

struct GameMap: Codable, Identifiable {
    let id: String
    let name: String
    let gameModeId: String
    let gameModeName: String

    var imageURL: URL? {
        URL(string: "https://cdn.brawlify.com/maps/regular/\(id).png")
    }
}

// MARK: - API Response Wrapper

struct MapsResponse: Codable {
    let list: [MapAPI]
}

struct MapAPI: Codable {
    let id: Int
    let name: String
    let gameMode: GameModeRef

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case gameMode
    }

    func toGameMap() -> GameMap {
        GameMap(
            id: String(id),
            name: name,
            gameModeId: String(gameMode.id),
            gameModeName: gameMode.name
        )
    }
}

struct GameModeRef: Codable {
    let id: Int
    let name: String
}
