import SwiftUI
import UIKit

/// A SwiftUI view that loads and caches remote images using `ImageCache`.
/// Shows a placeholder while loading and an error icon on failure.
struct CachedAsyncImage: View {
    let url: URL
    var contentMode: ContentMode = .fit
    /// When true, skips a per-view `ProgressView` (many instances hurt scroll performance in grids).
    var compactPlaceholder: Bool = false

    @State private var phase: LoadPhase = .idle

    private enum LoadPhase {
        case idle
        case loading
        case success(Image)
        case failure
    }

    var body: some View {
        ZStack {
            switch phase {
            case .idle, .loading:
                placeholder
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            case .failure:
                errorView
            }
        }
        .task(id: url) {
            await loadImage()
        }
    }

    // MARK: - Subviews

    private var placeholder: some View {
        ZStack {
            Color(.systemGray5)
            if !compactPlaceholder {
                ProgressView()
                    .scaleEffect(0.7)
            }
        }
    }

    private var errorView: some View {
        ZStack {
            Color(.systemGray5)
            Image(systemName: "photo.slash")
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Loading

    private func loadImage() async {
        // Return immediately if already cached
        if let cached = await ImageCache.shared.cachedImage(for: url) {
            phase = .success(Image(uiImage: cached))
            return
        }

        phase = .loading
        do {
            let uiImage = try await ImageCache.shared.loadImage(from: url)
            phase = .success(Image(uiImage: uiImage))
        } catch {
            phase = .failure
        }
    }
}

#Preview {
    CachedAsyncImage(url: URL(string: "https://cdn.brawlify.com/brawlers/borderless/16000000.png")!)
        .frame(width: 80, height: 80)
}
