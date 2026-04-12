import Foundation
import SwiftData

@Model
final class TierList {
    var id: UUID
    var gameModeId: String
    var gameModeName: String
    var modifiedAt: Date
    var assignmentsData: Data

    init(
        id: UUID = UUID(),
        gameModeId: String,
        gameModeName: String,
        modifiedAt: Date = Date(),
        assignmentsData: Data = Data()
    ) {
        self.id = id
        self.gameModeId = gameModeId
        self.gameModeName = gameModeName
        self.modifiedAt = modifiedAt
        self.assignmentsData = assignmentsData
    }

    var assignments: [String: [String]] {
        get {
            guard !assignmentsData.isEmpty else { return [:] }
            return (try? JSONDecoder().decode([String: [String]].self, from: assignmentsData)) ?? [:]
        }
        set {
            assignmentsData = (try? JSONEncoder().encode(newValue)) ?? Data()
            modifiedAt = Date()
        }
    }
}
