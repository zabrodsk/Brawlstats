import SwiftUI

// MARK: - Canvas Tool

enum CanvasTool: Equatable {
    case select
    case arrow
    case brawler
    case zone
}

// MARK: - StrategyCanvasView

struct StrategyCanvasView: View {
    let mapId: String
    @Binding var elements: [StrategyElement]
    @Binding var selectedElementId: UUID?
    @Binding var activeTool: CanvasTool
    @Binding var activeColor: String
    var cornerRadius: CGFloat = 24

    @State private var zoomScale: CGFloat = 1.0
    @State private var offset: CGSize = .zero
    @State private var lastScale: CGFloat = 1.0
    @State private var lastOffset: CGSize = .zero
    @State private var dragStart: CGPoint?
    @State private var dragCurrent: CGPoint?
    @State private var draggingBrawlerId: UUID?
    @State private var lastFitFrameKey: String = ""

    var onAddElement: (StrategyElement) -> Void

    private var mapURL: URL? {
        URL(string: "https://cdn.brawlify.com/maps/regular/\(mapId).png")
    }

    private static let minZoomScale: CGFloat = 0.5
    private static let maxZoomScale: CGFloat = 4.0

    var body: some View {
        GeometryReader { geometry in
            let viewport = fittedViewport(in: geometry.size)
            let baseScale = containBaseScale(viewport: viewport)
            let contentScale = baseScale * zoomScale
            let translatedOffset = clampedOffset(viewport: viewport, contentScale: contentScale)
            let frameKey = "\(mapId)|\(Int(viewport.width))|\(Int(viewport.height))"

            ZStack {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(Color.black)

                if let url = mapURL {
                    CachedAsyncImage(url: url, contentMode: .fit)
                        .frame(
                            width: StrategyCanvasMetrics.referenceSize.width,
                            height: StrategyCanvasMetrics.referenceSize.height
                        )
                        .scaleEffect(contentScale, anchor: .topLeading)
                        .offset(
                            x: viewport.minX + translatedOffset.width,
                            y: viewport.minY + translatedOffset.height
                        )
                }

                Canvas { context, _ in
                    context.translateBy(
                        x: viewport.minX + translatedOffset.width,
                        y: viewport.minY + translatedOffset.height
                    )
                    context.scaleBy(x: contentScale, y: contentScale)

                    for element in elements {
                        switch element.payload {
                        case .arrow(let payload):
                            drawArrow(context: &context, payload: payload, selected: element.id == selectedElementId)
                        case .zone(let payload):
                            drawZone(context: &context, payload: payload, selected: element.id == selectedElementId)
                        default:
                            break
                        }
                    }
                }

                ForEach(elements) { element in
                    if case .brawler(let payload) = element.payload {
                        brawlerNode(
                            element: element,
                            payload: payload,
                            viewport: viewport,
                            contentScale: contentScale
                        )
                    }
                }

                if let dragStart, let dragCurrent {
                    ghostLayer(
                        start: dragStart,
                        current: dragCurrent,
                        viewport: viewport,
                        contentScale: contentScale,
                        translatedOffset: translatedOffset
                    )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .contentShape(Rectangle())
            .gesture(canvasGesture(viewport: viewport, contentScale: contentScale))
            .simultaneousGesture(magnifyGesture(viewport: viewport, baseScale: baseScale))
            .onAppear {
                reframeCanvasToFit(viewport: viewport, baseScale: baseScale)
                lastFitFrameKey = frameKey
            }
            .onChange(of: frameKey) { _, newKey in
                guard newKey != lastFitFrameKey else { return }
                lastFitFrameKey = newKey
                reframeCanvasToFit(viewport: viewport, baseScale: baseScale)
            }
        }
    }

    private func reframeCanvasToFit(viewport: CGRect, baseScale: CGFloat) {
        guard viewport.width > 1, viewport.height > 1 else { return }
        zoomScale = 1.0
        lastScale = 1.0
        let contentScale = baseScale * zoomScale
        let sw = StrategyCanvasMetrics.referenceSize.width * contentScale
        let sh = StrategyCanvasMetrics.referenceSize.height * contentScale
        offset = CGSize(
            width: (viewport.width - sw) / 2,
            height: (viewport.height - sh) / 2
        )
    }

    private func containBaseScale(viewport: CGRect) -> CGFloat {
        let rw = StrategyCanvasMetrics.referenceSize.width
        let rh = StrategyCanvasMetrics.referenceSize.height
        guard rw > 0, rh > 0, viewport.width > 0, viewport.height > 0 else { return 1 }
        return min(viewport.width / rw, viewport.height / rh)
    }

    @ViewBuilder
    private func brawlerNode(
        element: StrategyElement,
        payload: BrawlerPayload,
        viewport: CGRect,
        contentScale: CGFloat
    ) -> some View {
        let point = canvasToScreen(payload.position, viewport: viewport, contentScale: contentScale)
        let isSelected = element.id == selectedElementId
        let teamColor = payload.team == .friendly ? Color(hex: "#1E90FF") : Color(hex: "#FF4444")
        let iconSize = max(30, min(44, 44 * contentScale))
        let haloSize = iconSize + 10

        ZStack {
            Circle()
                .fill(teamColor.opacity(0.24))
                .frame(width: haloSize, height: haloSize)

            if let url = URL(string: "https://cdn.brawlify.com/brawlers/borderless/\(payload.brawlerId).png") {
                CachedAsyncImage(url: url, contentMode: .fit)
                    .frame(width: iconSize, height: iconSize)
            }

            if isSelected {
                Circle()
                    .strokeBorder(Color.white, lineWidth: 2)
                    .frame(width: haloSize + 4, height: haloSize + 4)
            }
        }
        .position(point)
        .gesture(
            DragGesture()
                .onChanged { value in
                    draggingBrawlerId = element.id
                    let newPosition = screenToCanvas(value.location, viewport: viewport, contentScale: contentScale)
                    moveBrawler(id: element.id, to: newPosition)
                }
                .onEnded { _ in
                    draggingBrawlerId = nil
                }
        )
        .onTapGesture {
            selectedElementId = element.id
        }
        .zIndex(isSelected ? 10 : 1)
    }

    @ViewBuilder
    private func ghostLayer(
        start: CGPoint,
        current: CGPoint,
        viewport: CGRect,
        contentScale: CGFloat,
        translatedOffset: CGSize
    ) -> some View {
        Canvas { context, _ in
            let color = Color(hex: activeColor)
            let canvasStart = screenToCanvas(start, viewport: viewport, contentScale: contentScale)
            let canvasCurrent = screenToCanvas(current, viewport: viewport, contentScale: contentScale)

            context.translateBy(
                x: viewport.minX + translatedOffset.width,
                y: viewport.minY + translatedOffset.height
            )
            context.scaleBy(x: contentScale, y: contentScale)

            switch activeTool {
            case .arrow:
                drawArrowPath(
                    context: &context,
                    from: CGPoint(x: canvasStart.x, y: canvasStart.y),
                    to: CGPoint(x: canvasCurrent.x, y: canvasCurrent.y),
                    color: color,
                    alpha: 0.6
                )
            case .zone:
                let radius = hypot(canvasCurrent.x - canvasStart.x, canvasCurrent.y - canvasStart.y)
                guard radius >= 15 else { return }
                let rect = CGRect(
                    x: canvasStart.x - radius,
                    y: canvasStart.y - radius,
                    width: radius * 2,
                    height: radius * 2
                )
                let path = Path(ellipseIn: rect)
                context.fill(path, with: .color(color.opacity(0.28)))
                context.stroke(path, with: .color(color.opacity(0.8)), lineWidth: 2)
            default:
                break
            }
        }
        .allowsHitTesting(false)
    }

    private func drawArrow(context: inout GraphicsContext, payload: ArrowPayload, selected: Bool) {
        guard payload.points.count >= 2 else { return }

        let color = Color(hex: payload.color)
        let from = CGPoint(x: payload.points[0].x, y: payload.points[0].y)
        let to = CGPoint(x: payload.points[1].x, y: payload.points[1].y)

        if selected {
            drawArrowPath(context: &context, from: from, to: to, color: .white, alpha: 1, lineWidth: 5)
        }
        drawArrowPath(context: &context, from: from, to: to, color: color, alpha: 1)
    }

    private func drawArrowPath(
        context: inout GraphicsContext,
        from: CGPoint,
        to: CGPoint,
        color: Color,
        alpha: Double,
        lineWidth: CGFloat = 3
    ) {
        let dx = to.x - from.x
        let dy = to.y - from.y
        let angle = atan2(dy, dx)
        let headLength: CGFloat = 20
        let headAngle: CGFloat = .pi / 6

        var line = Path()
        line.move(to: from)
        line.addLine(to: to)
        context.stroke(line, with: .color(color.opacity(alpha)), lineWidth: lineWidth)

        var head = Path()
        head.move(to: to)
        head.addLine(to: CGPoint(
            x: to.x - headLength * cos(angle - headAngle),
            y: to.y - headLength * sin(angle - headAngle)
        ))
        head.move(to: to)
        head.addLine(to: CGPoint(
            x: to.x - headLength * cos(angle + headAngle),
            y: to.y - headLength * sin(angle + headAngle)
        ))
        context.stroke(head, with: .color(color.opacity(alpha)), lineWidth: lineWidth)
    }

    private func drawZone(context: inout GraphicsContext, payload: ZonePayload, selected: Bool) {
        let color = Color(hex: payload.color)

        switch payload.shape {
        case .circle:
            guard let radius = payload.radius else { return }
            let rect = CGRect(
                x: payload.center.x - radius,
                y: payload.center.y - radius,
                width: radius * 2,
                height: radius * 2
            )
            let path = Path(ellipseIn: rect)
            context.fill(path, with: .color(color.opacity(0.28)))
            context.stroke(path, with: .color(selected ? .white : color.opacity(0.9)), lineWidth: selected ? 3 : 2)

        case .rect:
            guard let size = payload.size else { return }
            let rect = CGRect(
                x: payload.center.x - (size.x / 2),
                y: payload.center.y - (size.y / 2),
                width: size.x,
                height: size.y
            )
            let path = Path(rect)
            context.fill(path, with: .color(color.opacity(0.28)))
            context.stroke(path, with: .color(selected ? .white : color.opacity(0.9)), lineWidth: selected ? 3 : 2)
        }
    }

    private func canvasGesture(viewport: CGRect, contentScale: CGFloat) -> some Gesture {
        SimultaneousGesture(
            DragGesture(minimumDistance: 0, coordinateSpace: .local)
                .onChanged { value in
                    if activeTool == .select {
                        let delta = CGSize(
                            width: value.translation.width - lastOffset.width,
                            height: value.translation.height - lastOffset.height
                        )
                        offset = CGSize(
                            width: offset.width + delta.width,
                            height: offset.height + delta.height
                        )
                        lastOffset = value.translation
                        return
                    }

                    if dragStart == nil {
                        dragStart = value.startLocation
                    }
                    dragCurrent = value.location
                }
                .onEnded { value in
                    if activeTool == .select {
                        lastOffset = .zero
                        let point = screenToCanvas(value.location, viewport: viewport, contentScale: contentScale)
                        hitTestElement(at: point)
                        let cs = contentScale
                        offset = clampingOffset(offset, viewport: viewport, contentScale: cs)
                        return
                    }

                    defer {
                        dragStart = nil
                        dragCurrent = nil
                    }

                    guard let dragStart else { return }
                    let startPoint = screenToCanvas(dragStart, viewport: viewport, contentScale: contentScale)
                    let endPoint = screenToCanvas(value.location, viewport: viewport, contentScale: contentScale)

                    switch activeTool {
                    case .arrow:
                        let distance = hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y)
                        guard distance >= 20 else { return }
                        onAddElement(
                            StrategyElement(
                                kind: .arrow,
                                payload: .arrow(
                                    ArrowPayload(
                                        color: activeColor,
                                        points: [startPoint, endPoint]
                                    )
                                )
                            )
                        )

                    case .zone:
                        let radius = hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y)
                        guard radius >= 15 else { return }
                        onAddElement(
                            StrategyElement(
                                kind: .zone,
                                payload: .zone(
                                    ZonePayload(
                                        shape: .circle,
                                        color: activeColor,
                                        center: startPoint,
                                        radius: radius,
                                        size: nil
                                    )
                                )
                            )
                        )
                    default:
                        break
                    }
                },
            TapGesture()
                .onEnded {
                    if activeTool == .select {
                        selectedElementId = nil
                    }
                }
        )
    }

    private func magnifyGesture(viewport: CGRect, baseScale: CGFloat) -> some Gesture {
        MagnifyGesture()
            .onChanged { value in
                let oldZoom = zoomScale
                let newZoom = min(
                    max(lastScale * value.magnification, Self.minZoomScale),
                    Self.maxZoomScale
                )
                let oldContentScale = baseScale * oldZoom
                let newContentScale = baseScale * newZoom
                guard oldContentScale > 0.0001 else { return }

                let ax = viewport.midX
                let ay = viewport.midY
                let mx = (ax - viewport.minX - offset.width) / oldContentScale
                let my = (ay - viewport.minY - offset.height) / oldContentScale

                offset = CGSize(
                    width: ax - viewport.minX - mx * newContentScale,
                    height: ay - viewport.minY - my * newContentScale
                )
                zoomScale = newZoom
                offset = clampingOffset(offset, viewport: viewport, contentScale: newContentScale)
            }
            .onEnded { _ in
                lastScale = zoomScale
                let cs = baseScale * zoomScale
                offset = clampingOffset(offset, viewport: viewport, contentScale: cs)
            }
    }

    private func fittedViewport(in availableSize: CGSize) -> CGRect {
        guard availableSize.width > 0, availableSize.height > 0 else { return .zero }

        let widthBasedHeight = availableSize.width / StrategyCanvasMetrics.aspectRatio
        let heightBasedWidth = availableSize.height * StrategyCanvasMetrics.aspectRatio

        let viewportSize: CGSize
        if widthBasedHeight <= availableSize.height {
            viewportSize = CGSize(width: availableSize.width, height: widthBasedHeight)
        } else {
            viewportSize = CGSize(width: heightBasedWidth, height: availableSize.height)
        }

        return CGRect(
            x: (availableSize.width - viewportSize.width) / 2,
            y: (availableSize.height - viewportSize.height) / 2,
            width: viewportSize.width,
            height: viewportSize.height
        )
    }

    private func clampedOffset(viewport: CGRect, contentScale: CGFloat) -> CGSize {
        clampingOffset(offset, viewport: viewport, contentScale: contentScale)
    }

    private func clampingOffset(_ raw: CGSize, viewport: CGRect, contentScale: CGFloat) -> CGSize {
        let scaledWidth = StrategyCanvasMetrics.referenceSize.width * contentScale
        let scaledHeight = StrategyCanvasMetrics.referenceSize.height * contentScale
        let vw = viewport.width
        let vh = viewport.height

        let minPanX = min(0, vw - scaledWidth)
        let maxPanX = max(0, vw - scaledWidth)
        let minPanY = min(0, vh - scaledHeight)
        let maxPanY = max(0, vh - scaledHeight)

        return CGSize(
            width: min(max(raw.width, minPanX), maxPanX),
            height: min(max(raw.height, minPanY), maxPanY)
        )
    }

    private func screenToCanvas(_ point: CGPoint, viewport: CGRect, contentScale: CGFloat) -> Position {
        let translatedOffset = clampedOffset(viewport: viewport, contentScale: contentScale)
        let x = (point.x - viewport.minX - translatedOffset.width) / contentScale
        let y = (point.y - viewport.minY - translatedOffset.height) / contentScale
        return Position(x: x, y: y)
    }

    private func canvasToScreen(_ position: Position, viewport: CGRect, contentScale: CGFloat) -> CGPoint {
        let translatedOffset = clampedOffset(viewport: viewport, contentScale: contentScale)
        return CGPoint(
            x: viewport.minX + translatedOffset.width + (position.x * contentScale),
            y: viewport.minY + translatedOffset.height + (position.y * contentScale)
        )
    }

    private func hitTestElement(at point: Position) {
        for element in elements.reversed() {
            switch element.payload {
            case .arrow(let payload):
                guard payload.points.count >= 2 else { continue }
                if distanceFromSegment(point, a: payload.points[0], b: payload.points[1]) < 40 {
                    selectedElementId = element.id
                    return
                }
            case .zone(let payload):
                if let radius = payload.radius {
                    if hypot(point.x - payload.center.x, point.y - payload.center.y) <= radius + 40 {
                        selectedElementId = element.id
                        return
                    }
                }
            default:
                break
            }
        }

        selectedElementId = nil
    }

    private func distanceFromSegment(_ point: Position, a: Position, b: Position) -> Double {
        let dx = b.x - a.x
        let dy = b.y - a.y
        let lengthSquared = dx * dx + dy * dy

        guard lengthSquared > 0 else {
            return hypot(point.x - a.x, point.y - a.y)
        }

        let projection = max(0, min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared))
        let projectedX = a.x + projection * dx
        let projectedY = a.y + projection * dy
        return hypot(point.x - projectedX, point.y - projectedY)
    }

    private func moveBrawler(id: UUID, to position: Position) {
        guard let index = elements.firstIndex(where: { $0.id == id }),
              case .brawler(var payload) = elements[index].payload else { return }

        payload.position = Position(
            x: min(max(0, position.x), StrategyCanvasMetrics.referenceSize.width),
            y: min(max(0, position.y), StrategyCanvasMetrics.referenceSize.height)
        )
        elements[index] = StrategyElement(id: id, kind: .brawler, payload: .brawler(payload))
    }
}

// MARK: - Color(hex:) extension

extension Color {
    init(hex: String) {
        var trimmed = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.hasPrefix("#") {
            trimmed.removeFirst()
        }

        var rgb: UInt64 = 0
        Scanner(string: trimmed).scanHexInt64(&rgb)
        let r = Double((rgb >> 16) & 0xFF) / 255
        let g = Double((rgb >> 8) & 0xFF) / 255
        let b = Double(rgb & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
