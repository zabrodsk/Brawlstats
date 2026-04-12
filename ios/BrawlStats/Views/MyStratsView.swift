import SwiftUI
import SwiftData

struct MyStratsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Strategy.modifiedAt, order: .reverse) private var strategies: [Strategy]

    @State private var showingNewStrat = false
    @State private var newTitle = ""
    @State private var editingStrategy: Strategy? = nil

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("My Strategies")
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            showingNewStrat = true
                        } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
                .alert("New Strategy", isPresented: $showingNewStrat) {
                    TextField("Title", text: $newTitle)
                    Button("Create") {
                        createStrategy()
                    }
                    Button("Cancel", role: .cancel) {
                        newTitle = ""
                    }
                } message: {
                    Text("Enter a name for your strategy.")
                }
                .fullScreenCover(item: $editingStrategy) { strategy in
                    StrategyEditorView(existingStrategy: strategy)
                }
        }
    }

    @ViewBuilder
    private var content: some View {
        if strategies.isEmpty {
            ContentUnavailableView(
                "No Strategies Yet",
                systemImage: "folder.fill",
                description: Text("Tap + to create your first strategy.")
            )
        } else {
            List {
                ForEach(strategies) { strategy in
                    Button {
                        editingStrategy = strategy
                    } label: {
                        StrategyRow(strategy: strategy)
                    }
                    .buttonStyle(.plain)
                }
                .onDelete(perform: deleteStrategies)
            }
            .listStyle(.plain)
        }
    }

    private func createStrategy() {
        let title = newTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }
        let strategy = Strategy(title: title)
        modelContext.insert(strategy)
        newTitle = ""
        // Open editor immediately
        editingStrategy = strategy
    }

    private func deleteStrategies(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(strategies[index])
        }
    }
}

// MARK: - StrategyRow

private struct StrategyRow: View {
    let strategy: Strategy

    private var subtitle: String {
        if !strategy.gameMode.isEmpty {
            return strategy.gameMode
        }
        return "No game mode"
    }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(strategy.title)
                    .font(.headline)
                HStack {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text(strategy.modifiedAt.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    MyStratsView()
        .modelContainer(for: Strategy.self, inMemory: true)
}
