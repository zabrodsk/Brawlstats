import Foundation

enum BrawlStarsAPIError: LocalizedError {
    case invalidBaseURL
    case http(status: Int, body: String?)
    case notJSON

    var errorDescription: String? {
        switch self {
        case .invalidBaseURL:
            return "Invalid API base URL."
        case let .http(status, body):
            return "HTTP \(status): \(body ?? "")"
        case .notJSON:
            return "Response was not valid JSON."
        }
    }
}

/// Calls your Next.js BFF (`/api/brawlstars/*`). Never embed the Supercell token in the app.
final class BrawlStarsAPIClient {
    let baseURL: URL
    private let session: URLSession

    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    private func absoluteURL(path: String) throws -> URL {
        let p = path.hasPrefix("/") ? path : "/" + path
        guard let u = URL(string: p, relativeTo: baseURL)?.absoluteURL else {
            throw BrawlStarsAPIError.invalidBaseURL
        }
        return u
    }

    func getData(path: String) async throws -> Data {
        let url = try absoluteURL(path: path)
        var req = URLRequest(url: url)
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        let (data, resp) = try await session.data(for: req)
        guard let http = resp as? HTTPURLResponse else {
            throw BrawlStarsAPIError.http(status: 0, body: nil)
        }
        guard (200 ..< 300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8)
            throw BrawlStarsAPIError.http(status: http.statusCode, body: body)
        }
        return data
    }

    func getJSONObject(path: String) async throws -> Any {
        let data = try await getData(path: path)
        return try JSONSerialization.jsonObject(with: data)
    }
}
