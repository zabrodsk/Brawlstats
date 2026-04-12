import Foundation

// MARK: - Position

struct Position: Codable, Equatable {
    var x: Double
    var y: Double

    init(x: Double, y: Double) {
        self.x = x
        self.y = y
    }
}

// MARK: - Team

enum Team: String, Codable {
    case friendly
    case enemy
}

// MARK: - Zone Shape

enum ZoneShape: String, Codable {
    case circle
    case rect
}

// MARK: - Element Kind

enum StrategyElementKind: String, Codable {
    case brawler
    case arrow
    case zone
    case text
}

// MARK: - StrategyElement

struct StrategyElement: Codable, Identifiable {
    let id: UUID
    let kind: StrategyElementKind
    let payload: ElementPayload

    init(id: UUID = UUID(), kind: StrategyElementKind, payload: ElementPayload) {
        self.id = id
        self.kind = kind
        self.payload = payload
    }

    // MARK: - Codable

    enum CodingKeys: String, CodingKey {
        case id, kind, payload
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        kind = try container.decode(StrategyElementKind.self, forKey: .kind)

        switch kind {
        case .brawler:
            payload = .brawler(try container.decode(BrawlerPayload.self, forKey: .payload))
        case .arrow:
            payload = .arrow(try container.decode(ArrowPayload.self, forKey: .payload))
        case .zone:
            payload = .zone(try container.decode(ZonePayload.self, forKey: .payload))
        case .text:
            payload = .text(try container.decode(TextPayload.self, forKey: .payload))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(kind, forKey: .kind)
        switch payload {
        case .brawler(let p):
            try container.encode(p, forKey: .payload)
        case .arrow(let p):
            try container.encode(p, forKey: .payload)
        case .zone(let p):
            try container.encode(p, forKey: .payload)
        case .text(let p):
            try container.encode(p, forKey: .payload)
        }
    }
}

// MARK: - ElementPayload

enum ElementPayload {
    case brawler(BrawlerPayload)
    case arrow(ArrowPayload)
    case zone(ZonePayload)
    case text(TextPayload)
}

// MARK: - Brawler Payload

struct BrawlerPayload: Codable {
    var brawlerId: String
    var team: Team
    var position: Position
}

// MARK: - Arrow Payload

struct ArrowPayload: Codable {
    var color: String
    var points: [Position]
}

// MARK: - Zone Payload

struct ZonePayload: Codable {
    var shape: ZoneShape
    var color: String
    var center: Position
    /// Used when shape == .circle
    var radius: Double?
    /// Used when shape == .rect (width, height encoded as Position)
    var size: Position?
}

// MARK: - Text Payload

struct TextPayload: Codable {
    var content: String
    var color: String
    var position: Position
    var fontSize: Double
}
