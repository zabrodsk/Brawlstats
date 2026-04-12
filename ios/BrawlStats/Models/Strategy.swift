import Foundation
import SwiftData

@Model
final class Strategy {
    var id: UUID
    var title: String
    var mapId: String
    var gameMode: String
    var createdAt: Date
    var modifiedAt: Date
    var canvasWidth: Int
    var canvasHeight: Int
    var elementsData: Data
    var version: Int

    init(
        id: UUID = UUID(),
        title: String,
        mapId: String = "",
        gameMode: String = "",
        createdAt: Date = Date(),
        modifiedAt: Date = Date(),
        canvasWidth: Int = 1080,
        canvasHeight: Int = 1920,
        elementsData: Data = Data(),
        version: Int = 1
    ) {
        self.id = id
        self.title = title
        self.mapId = mapId
        self.gameMode = gameMode
        self.createdAt = createdAt
        self.modifiedAt = modifiedAt
        self.canvasWidth = canvasWidth
        self.canvasHeight = canvasHeight
        self.elementsData = elementsData
        self.version = version
    }

    var elements: [StrategyElement] {
        get {
            guard !elementsData.isEmpty else { return [] }
            do {
                return try JSONDecoder().decode([StrategyElement].self, from: elementsData)
            } catch {
                return []
            }
        }
        set {
            do {
                elementsData = try JSONEncoder().encode(newValue)
                modifiedAt = Date()
            } catch {
                elementsData = Data()
            }
        }
    }
}
