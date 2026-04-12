import SwiftUI

// MARK: - Preset Colors

struct ToolbarPresetColor: Identifiable {
    let id = UUID()
    let hex: String
    let label: String
}

let presetColors: [ToolbarPresetColor] = [
    ToolbarPresetColor(hex: "#F5CC00", label: "Yellow"),
    ToolbarPresetColor(hex: "#1E90FF", label: "Blue"),
    ToolbarPresetColor(hex: "#FF4444", label: "Red"),
    ToolbarPresetColor(hex: "#22C55E", label: "Green"),
    ToolbarPresetColor(hex: "#FFFFFF", label: "White"),
]

// MARK: - CanvasToolbar

struct CanvasToolbar: View {
    @Binding var activeTool: CanvasTool
    @Binding var activeColor: String
    @Binding var showBrawlerPicker: Bool
    var onUndo: () -> Void

    @Environment(\.horizontalSizeClass) private var hSizeClass

    var body: some View {
        if hSizeClass == .regular {
            iPadSidebar
        } else {
            iPhoneBar
        }
    }

    private var iPhoneBar: some View {
        VStack(spacing: 10) {
            HStack(spacing: 8) {
                toolButton(.select, icon: "arrow.up.left.and.arrow.down.right")
                toolButton(.arrow, icon: "arrow.up.right")
                brawlerToolButton
                toolButton(.zone, icon: "circle.dashed")
            }

            HStack(spacing: 12) {
                colorPicker
                Spacer(minLength: 0)
                undoButton
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .shadow(color: .black.opacity(0.18), radius: 10, y: 2)
        .padding(.horizontal, 16)
    }

    private var iPadSidebar: some View {
        VStack(spacing: 0) {
            toolButton(.select, icon: "arrow.up.left.and.arrow.down.right")
            toolButton(.arrow, icon: "arrow.up.right")
            brawlerToolButton
            toolButton(.zone, icon: "circle.dashed")
            Divider()
                .padding(.vertical, 8)
            colorPicker
            Divider()
                .padding(.vertical, 8)
            undoButton
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 8)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .shadow(color: .black.opacity(0.18), radius: 10)
        .frame(width: 72)
    }

    private func toolButton(_ tool: CanvasTool, icon: String) -> some View {
        let isActive = activeTool == tool

        return Button {
            activeTool = tool
        } label: {
            Image(systemName: icon)
                .font(.system(size: 18, weight: isActive ? .bold : .regular))
                .foregroundStyle(isActive ? Color(hex: activeColor) : .primary)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(isActive ? Color(hex: activeColor).opacity(0.15) : Color.clear)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }

    private var brawlerToolButton: some View {
        let isActive = activeTool == .brawler

        return Button {
            activeTool = .brawler
            showBrawlerPicker = true
        } label: {
            Image(systemName: "person.fill")
                .font(.system(size: 18, weight: isActive ? .bold : .regular))
                .foregroundStyle(isActive ? Color(hex: activeColor) : .primary)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(isActive ? Color(hex: activeColor).opacity(0.15) : Color.clear)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }

    private var colorPicker: some View {
        Group {
            if hSizeClass == .regular {
                VStack(spacing: 8) { colorDots }
            } else {
                HStack(spacing: 8) { colorDots }
            }
        }
    }

    @ViewBuilder
    private var colorDots: some View {
        ForEach(presetColors) { preset in
            Button {
                activeColor = preset.hex
            } label: {
                Circle()
                    .fill(Color(hex: preset.hex))
                    .frame(width: 22, height: 22)
                    .overlay(
                        Circle()
                            .strokeBorder(
                                activeColor.lowercased() == preset.hex.lowercased() ? Color.primary : Color.clear,
                                lineWidth: 2
                            )
                    )
            }
            .buttonStyle(.plain)
        }
    }

    private var undoButton: some View {
        Button(action: onUndo) {
            Image(systemName: "arrow.uturn.backward")
                .font(.system(size: 18))
                .foregroundStyle(.primary)
                .frame(width: 44, height: 44)
                .background(Color(.tertiarySystemFill))
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}
