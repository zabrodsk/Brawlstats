import UIKit

// MARK: - ImageCacheError

enum ImageCacheError: LocalizedError {
    case invalidURL
    case invalidData
    case networkError(underlying: Error)
    case badStatusCode(Int)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid image URL."
        case .invalidData: return "Response data could not be decoded as an image."
        case .networkError(let e): return "Network error: \(e.localizedDescription)"
        case .badStatusCode(let c): return "HTTP \(c) while fetching image."
        }
    }
}

// MARK: - ImageCache

actor ImageCache {
    static let shared = ImageCache()

    private let memoryCache = NSCache<NSString, UIImage>()
    private let session: URLSession

    private init() {
        memoryCache.countLimit = 200
        memoryCache.totalCostLimit = 50 * 1024 * 1024 // 50 MB

        let config = URLSessionConfiguration.default
        config.urlCache = URLCache(
            memoryCapacity: 5 * 1024 * 1024,
            diskCapacity: 100 * 1024 * 1024
        )
        config.requestCachePolicy = .returnCacheDataElseLoad
        self.session = URLSession(configuration: config)
    }

    // MARK: - Public

    func loadImage(from url: URL) async throws -> UIImage {
        let key = url.absoluteString as NSString

        if let cached = memoryCache.object(forKey: key) {
            return cached
        }

        var request = URLRequest(url: url)
        request.cachePolicy = .returnCacheDataElseLoad

        let data: Data
        let response: URLResponse

        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw ImageCacheError.networkError(underlying: error)
        }

        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw ImageCacheError.badStatusCode(http.statusCode)
        }

        guard let image = UIImage(data: data) else {
            throw ImageCacheError.invalidData
        }

        let cost = data.count
        memoryCache.setObject(image, forKey: key, cost: cost)
        return image
    }

    func cachedImage(for url: URL) -> UIImage? {
        memoryCache.object(forKey: url.absoluteString as NSString)
    }

    func clearCache() {
        memoryCache.removeAllObjects()
    }
}
