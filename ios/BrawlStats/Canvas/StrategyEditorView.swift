import SwiftData
import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

// MARK: - StrategyEditorView

struct StrategyEditorView: View {
    var existingStrategy: Strategy? = nil
    var initialMapId: String = ""
    var initialGameMode: String = ""

    @Environment(\.dismiss) private var dismiss
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.modelContext) private var modelContext

    /// Wide editor chrome only on iPad with a regular width; large iPhones in landscape are still phones.
    private var useRegularEditorLayout: Bool {
        #if canImport(UIKit)
        guard UIDevice.current.userInterfaceIdiom == .pad else { return false }
        #endif
        return horizontalSizeClass == .regular
    }

    @State private var title: String = ""
    @State private var elements: [StrategyElement] = []
    @State private var selectedElementId: UUID?
    @State private var activeTool: CanvasTool = .select
    @State private var activeColor: String = "#F5CC00"
    @State private var showBrawlerPicker = false
    @State private var showShareSheet = false
    @State private var exportImage: UIImage?
    @State private var undoStack: [[StrategyElement]] = []
    @State private var compactHeaderExpanded = true
    @State private var compactToolbarExpanded = true

    private var mapId: String { existingStrategy?.mapId ?? initialMapId }
    private var gameMode: String { existingStrategy?.gameMode ?? initialGameMode }

    private var placedBrawlerIds: Set<String> {
        Set(elements.compactMap {
            guard case .brawler(let payload) = $0.payload else { return nil }
            return payload.brawlerId
        })
    }

    var body: some View {
        Group {
            if useRegularEditorLayout {
                regularLayout
            } else {
                compactLayout
            }
        }
        .onAppear {
            if let existingStrategy {
                title = existingStrategy.title
                elements = existingStrategy.elements
            } else {
                title = "New Strategy"
            }
        }
        .sheet(isPresented: $showBrawlerPicker) {
            BrawlerPickerView(
                isPresented: $showBrawlerPicker,
                placedBrawlerIds: placedBrawlerIds
            ) { brawler, team in
                addBrawler(brawler, team: team)
            }
            .presentationDetents([.medium, .large])
        }
        .sheet(isPresented: $showShareSheet) {
            if let exportImage {
                ShareSheet(image: exportImage)
            }
        }
    }

    private var compactLayout: some View {
        NavigationStack {
            VStack(spacing: 0) {
                compactHeaderChrome

                StrategyCanvasView(
                    mapId: mapId,
                    elements: $elements,
                    selectedElementId: $selectedElementId,
                    activeTool: $activeTool,
                    activeColor: $activeColor,
                    cornerRadius: 0,
                    onAddElement: addElement(_:)
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.black)

                compactToolbarChrome
            }
            .background(Color.black.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var compactHeaderChrome: some View {
        Group {
            if compactHeaderExpanded {
                compactHeaderExpandedContent
            } else {
                compactHeaderCollapsedRow
            }
        }
        .padding(.horizontal, 12)
        .padding(.top, 8)
        .padding(.bottom, 6)
        .background(Color.black.opacity(0.35))
    }

    private var compactHeaderExpandedContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Button("Close") { dismiss() }
                    .fontWeight(.semibold)

                Spacer(minLength: 8)

                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        compactHeaderExpanded = false
                    }
                } label: {
                    Image(systemName: "chevron.compact.up")
                        .font(.body.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
                .accessibilityLabel("Collapse header")

                if selectedElementId != nil {
                    Button(role: .destructive, action: deleteSelected) {
                        Image(systemName: "trash")
                    }
                }

                Button {
                    exportCanvas()
                } label: {
                    Image(systemName: "square.and.arrow.up")
                }

                Button("Save", action: save)
                    .fontWeight(.semibold)
            }

            TextField("Strategy title", text: $title)
                .font(.headline)
                .textFieldStyle(.roundedBorder)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    if !gameMode.isEmpty {
                        summaryChip(systemImage: "flag.fill", text: gameMode)
                    }
                    if !mapId.isEmpty {
                        summaryChip(systemImage: "map.fill", text: mapId)
                    }
                }
            }
        }
        .padding(14)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 22))
    }

    private var compactHeaderCollapsedRow: some View {
        HStack(spacing: 10) {
            Button("Close") { dismiss() }
                .fontWeight(.semibold)

            Text(title.isEmpty ? "Strategy" : title)
                .font(.subheadline.weight(.semibold))
                .lineLimit(1)
                .foregroundStyle(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)

            if selectedElementId != nil {
                Button(role: .destructive, action: deleteSelected) {
                    Image(systemName: "trash")
                }
            }

            Button {
                exportCanvas()
            } label: {
                Image(systemName: "square.and.arrow.up")
            }

            Button("Save", action: save)
                .fontWeight(.semibold)

            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    compactHeaderExpanded = true
                }
            } label: {
                Image(systemName: "chevron.compact.down")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .accessibilityLabel("Expand header")
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var compactToolbarChrome: some View {
        Group {
            if compactToolbarExpanded {
                CanvasToolbar(
                    activeTool: $activeTool,
                    activeColor: $activeColor,
                    showBrawlerPicker: $showBrawlerPicker,
                    onUndo: undo
                )
                .padding(.top, 6)
                .padding(.bottom, 10)
                .overlay(alignment: .topTrailing) {
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            compactToolbarExpanded = false
                        }
                    } label: {
                        Image(systemName: "chevron.compact.down")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)
                            .padding(10)
                    }
                    .accessibilityLabel("Collapse tools")
                }
            } else {
                compactToolbarCollapsedRow
            }
        }
        .padding(.bottom, 8)
        .background(Color.black.opacity(0.35))
    }

    private var compactToolbarCollapsedRow: some View {
        HStack(spacing: 12) {
            Image(systemName: activeToolSymbol)
                .font(.body.weight(.medium))
                .foregroundStyle(Color(hex: activeColor))
                .frame(width: 36, height: 36)
                .background(Color(.tertiarySystemFill))
                .clipShape(RoundedRectangle(cornerRadius: 10))

            Text("Tools hidden — expand to draw")
                .font(.caption.weight(.medium))
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)

            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    compactToolbarExpanded = true
                }
            } label: {
                Label("Show tools", systemImage: "chevron.compact.up")
                    .font(.caption.weight(.semibold))
                    .labelStyle(.titleAndIcon)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .padding(.horizontal, 16)
    }

    private var activeToolSymbol: String {
        switch activeTool {
        case .select: return "arrow.up.left.and.arrow.down.right"
        case .arrow: return "arrow.up.right"
        case .brawler: return "person.fill"
        case .zone: return "circle.dashed"
        }
    }

    private var regularLayout: some View {
        NavigationStack {
            HStack(spacing: 20) {
                VStack {
                    CanvasToolbar(
                        activeTool: $activeTool,
                        activeColor: $activeColor,
                        showBrawlerPicker: $showBrawlerPicker,
                        onUndo: undo
                    )
                    Spacer()
                }
                .padding(.top, 12)

                VStack(spacing: 16) {
                    editorSummaryCard

                    StrategyCanvasView(
                        mapId: mapId,
                        elements: $elements,
                        selectedElementId: $selectedElementId,
                        activeTool: $activeTool,
                        activeColor: $activeColor,
                        cornerRadius: 28,
                        onAddElement: addElement(_:)
                    )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.black)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
                }
            }
            .padding(20)
            .background(Color(.systemGroupedBackground))
            .navigationTitle(gameMode.isEmpty ? "Strategy Editor" : gameMode)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { toolbarContent }
        }
    }

    private var editorSummaryCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            TextField("Strategy title", text: $title)
                .font(.headline)
                .textFieldStyle(.roundedBorder)

            HStack(spacing: 8) {
                if !gameMode.isEmpty {
                    summaryChip(systemImage: "flag.fill", text: gameMode)
                }
                if !mapId.isEmpty {
                    summaryChip(systemImage: "map.fill", text: mapId)
                }
                Spacer()
            }
        }
        .padding(14)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private func summaryChip(systemImage: String, text: String) -> some View {
        Label(text, systemImage: systemImage)
            .font(.caption.weight(.medium))
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color(.tertiarySystemBackground))
            .clipShape(Capsule())
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        if horizontalSizeClass == .regular {
            if selectedElementId != nil {
                ToolbarItem(placement: .topBarLeading) {
                    Button(role: .destructive, action: deleteSelected) {
                        Image(systemName: "trash")
                    }
                }
            }

            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 16) {
                    Button {
                        exportCanvas()
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                    }

                    Button("Save", action: save)
                        .fontWeight(.semibold)
                }
            }

            ToolbarItem(placement: .cancellationAction) {
                Button("Close") { dismiss() }
            }
        }
    }

    private func addElement(_ element: StrategyElement) {
        pushUndo()
        elements.append(element)
        selectedElementId = element.id
    }

    private func addBrawler(_ brawler: Brawler, team: Team) {
        pushUndo()
        let center = Position(
            x: StrategyCanvasMetrics.referenceSize.width / 2,
            y: StrategyCanvasMetrics.referenceSize.height / 2
        )

        let element = StrategyElement(
            kind: .brawler,
            payload: .brawler(
                BrawlerPayload(
                    brawlerId: brawler.id,
                    team: team,
                    position: center
                )
            )
        )

        elements.append(element)
        selectedElementId = element.id
        activeTool = .select
    }

    private func deleteSelected() {
        guard let selectedElementId else { return }
        pushUndo()
        elements.removeAll { $0.id == selectedElementId }
        self.selectedElementId = nil
    }

    private func pushUndo() {
        undoStack.append(elements)
        if undoStack.count > 50 {
            undoStack.removeFirst()
        }
    }

    private func undo() {
        guard let previous = undoStack.popLast() else { return }
        elements = previous
        selectedElementId = nil
    }

    private func save() {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)

        if let existingStrategy {
            existingStrategy.title = trimmedTitle.isEmpty ? existingStrategy.title : trimmedTitle
            existingStrategy.elements = elements
            existingStrategy.modifiedAt = Date()
        } else {
            let strategy = Strategy(
                title: trimmedTitle.isEmpty ? "Untitled" : trimmedTitle,
                mapId: initialMapId,
                gameMode: initialGameMode
            )
            strategy.elements = elements
            modelContext.insert(strategy)
        }

        dismiss()
    }

    private func exportCanvas() {
        let renderer = ImageRenderer(content: exportableView)
        renderer.scale = StrategyCanvasMetrics.exportScale

        if let image = renderer.uiImage {
            exportImage = image
            showShareSheet = true
        }
    }

    @ViewBuilder
    private var exportableView: some View {
        ZStack {
            if let url = URL(string: "https://cdn.brawlify.com/maps/regular/\(mapId).png") {
                CachedAsyncImage(url: url, contentMode: .fill)
                    .frame(
                        width: StrategyCanvasMetrics.referenceSize.width,
                        height: StrategyCanvasMetrics.referenceSize.height
                    )
            } else {
                Color.black
                    .frame(
                        width: StrategyCanvasMetrics.referenceSize.width,
                        height: StrategyCanvasMetrics.referenceSize.height
                    )
            }

            Canvas { context, _ in
                for element in elements {
                    switch element.payload {
                    case .arrow(let payload):
                        drawExportArrow(context: &context, payload: payload)
                    case .zone(let payload):
                        drawExportZone(context: &context, payload: payload)
                    case .text(let payload):
                        drawExportText(context: &context, payload: payload)
                    default:
                        break
                    }
                }
            }
            .frame(
                width: StrategyCanvasMetrics.referenceSize.width,
                height: StrategyCanvasMetrics.referenceSize.height
            )

            ForEach(elements) { element in
                if case .brawler(let payload) = element.payload {
                    let teamColor = payload.team == .friendly ? Color(hex: "#1E90FF") : Color(hex: "#FF4444")

                    ZStack {
                        Circle()
                            .fill(teamColor.opacity(0.3))
                            .frame(width: 124, height: 124)

                        if let url = URL(string: "https://cdn.brawlify.com/brawlers/borderless/\(payload.brawlerId).png") {
                            CachedAsyncImage(url: url, contentMode: .fit)
                                .frame(width: 96, height: 96)
                        }
                    }
                    .position(x: payload.position.x, y: payload.position.y)
                }
            }
        }
        .frame(
            width: StrategyCanvasMetrics.referenceSize.width,
            height: StrategyCanvasMetrics.referenceSize.height
        )
        .clipped()
    }

    private func drawExportArrow(context: inout GraphicsContext, payload: ArrowPayload) {
        guard payload.points.count >= 2 else { return }

        let color = Color(hex: payload.color)
        let from = CGPoint(x: payload.points[0].x, y: payload.points[0].y)
        let to = CGPoint(x: payload.points[1].x, y: payload.points[1].y)
        let dx = to.x - from.x
        let dy = to.y - from.y
        let angle = atan2(dy, dx)
        let headLength: CGFloat = 20
        let headAngle: CGFloat = .pi / 6

        var line = Path()
        line.move(to: from)
        line.addLine(to: to)
        context.stroke(line, with: .color(color), lineWidth: 6)

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
        context.stroke(head, with: .color(color), lineWidth: 6)
    }

    private func drawExportZone(context: inout GraphicsContext, payload: ZonePayload) {
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
            context.stroke(path, with: .color(color.opacity(0.9)), lineWidth: 4)

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
            context.stroke(path, with: .color(color.opacity(0.9)), lineWidth: 4)
        }
    }

    private func drawExportText(context: inout GraphicsContext, payload: TextPayload) {
        let text = Text(payload.content)
            .font(.system(size: payload.fontSize, weight: .semibold))
            .foregroundStyle(Color(hex: payload.color))

        context.draw(
            text,
            at: CGPoint(x: payload.position.x, y: payload.position.y),
            anchor: .center
        )
    }
}

// MARK: - ShareSheet

struct ShareSheet: UIViewControllerRepresentable {
    let image: UIImage

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [image], applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
