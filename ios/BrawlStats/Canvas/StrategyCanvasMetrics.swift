import CoreGraphics
import Foundation

enum StrategyCanvasMetrics {
    static let referenceSize = CGSize(width: 1080, height: 1920)
    static let aspectRatio = referenceSize.width / referenceSize.height
    static let exportScale: CGFloat = 2.0
}
