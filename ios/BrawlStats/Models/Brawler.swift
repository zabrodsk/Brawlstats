import Foundation

struct Brawler: Codable, Identifiable {
    let id: String
    let name: String
    let rarity: String
    let role: String
    let description: String

    var iconURL: URL? {
        URL(string: "https://cdn.brawlify.com/brawlers/borderless/\(id).png")
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case rarity
        case role
        case description
    }
}

// MARK: - API Response Wrapper

struct BrawlersResponse: Codable {
    let list: [BrawlerAPI]
}

struct BrawlerAPI: Codable {
    let id: Int
    let name: String
    let rarity: RarityInfo
    let class_: ClassInfo
    let description: String

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case rarity
        case class_ = "class"
        case description
    }

    func toBrawler() -> Brawler {
        Brawler(
            id: String(id),
            name: name,
            rarity: rarity.name,
            role: class_.name,
            description: description
        )
    }
}

struct RarityInfo: Codable {
    let id: Int
    let name: String
    let color: String
}

struct ClassInfo: Codable {
    let id: Int
    let name: String
}
