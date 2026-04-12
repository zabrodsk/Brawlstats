import Foundation

// MARK: - Errors

enum BrawlifyError: LocalizedError {
    case invalidURL
    case invalidResponse(statusCode: Int)
    case decodingFailed(underlying: Error)
    case networkError(underlying: Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL."
        case .invalidResponse(let code):
            return "Unexpected HTTP status code: \(code)."
        case .decodingFailed(let err):
            return "Failed to decode response: \(err.localizedDescription)"
        case .networkError(let err):
            return "Network error: \(err.localizedDescription)"
        }
    }
}

// MARK: - BrawlifyService

actor BrawlifyService {
    static let shared = BrawlifyService()

    private let baseURL = "https://api.brawlify.com/v1"
    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        // 24-hour disk cache, 50 MB memory
        config.urlCache = URLCache(
            memoryCapacity: 10 * 1024 * 1024,
            diskCapacity: 50 * 1024 * 1024
        )
        config.requestCachePolicy = .returnCacheDataElseLoad
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
    }

    // MARK: - Brawlers

    func fetchBrawlers() async throws -> [Brawler] {
        let response: BrawlersResponse = try await fetch(path: "/brawlers")
        return response.list.map { $0.toBrawler() }
    }

    // MARK: - Maps

    func fetchMaps() async throws -> [GameMap] {
        let response: MapsResponse = try await fetch(path: "/maps")
        return response.list.map { $0.toGameMap() }
    }

    // MARK: - Game Modes

    func fetchGameModes() async throws -> [GameMode] {
        let response: GameModesResponse = try await fetch(path: "/gamemodes")
        return response.list.map { $0.toGameMode() }
    }

    // MARK: - Generic Fetch

    private func fetch<T: Decodable>(path: String) async throws -> T {
        guard let url = URL(string: baseURL + path) else {
            throw BrawlifyError.invalidURL
        }

        var request = URLRequest(url: url)
        request.cachePolicy = .returnCacheDataElseLoad

        let data: Data
        let response: URLResponse

        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw BrawlifyError.networkError(underlying: error)
        }

        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw BrawlifyError.invalidResponse(statusCode: http.statusCode)
        }

        do {
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .useDefaultKeys
            return try decoder.decode(T.self, from: data)
        } catch {
            throw BrawlifyError.decodingFailed(underlying: error)
        }
    }
}
