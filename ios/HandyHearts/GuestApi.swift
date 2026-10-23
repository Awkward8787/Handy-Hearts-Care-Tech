import Foundation

struct GuestReceipt: Decodable, Equatable {
    let kind: String
    let reference: String
    let summary: String
    let emailConfirmation: String
    let smsConfirmation: String
    let paymentStatus: String
    let totalCents: Int
    let priced: Bool
}

enum GuestApiError: Error {
    case message(String)
}

enum GuestApi {
    static func createConsultation(_ body: [String: String]) async throws -> GuestReceipt {
        try await post(path: "/api/consultations", body: body, receiptKey: "receipt")
    }

    static func createOrder(_ body: [String: String]) async throws -> (GuestReceipt, String?) {
        let payload = try await send(path: "/api/orders", method: "POST", body: body, token: nil)
        guard let receipt = payload["receipt"] as? [String: Any] else {
            throw GuestApiError.message("That request could not be saved. Please try again.")
        }
        let parsed = try decodeReceipt(receipt)
        let secret = payload["clientSecret"] as? String
        return (parsed, secret)
    }

    static func receipt(reference: String) async throws -> GuestReceipt {
        let encoded = reference.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? reference
        let payload = try await send(path: "/api/receipts/\(encoded)", method: "GET", body: nil, token: nil)
        guard let receipt = payload["receipt"] as? [String: Any] else {
            throw GuestApiError.message("That receipt was not found.")
        }
        return try decodeReceipt(receipt)
    }

    static func staffMe(token: String) async throws -> String {
        let payload = try await send(path: "/api/staff/me", method: "GET", body: nil, token: token)
        return payload["portal"] as? String ?? ""
    }

    static func signIn(email: String, password: String) async throws -> String {
        guard AppConfig.staffSignInReady, let url = URL(string: "\(AppConfig.supabaseURL)/auth/v1/token?grant_type=password") else {
            throw GuestApiError.message("Staff sign-in is unavailable right now. Please try again later.")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["email": email, "password": password])
        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
        if status >= 400 {
            let raw = (json?["error_description"] as? String) ?? (json?["msg"] as? String) ?? ""
            throw GuestApiError.message(staffFailure(raw))
        }
        guard let token = json?["access_token"] as? String, !token.isEmpty else {
            throw GuestApiError.message("Staff sign-in is unavailable right now. Please try again later.")
        }
        return token
    }

    private static func post(path: String, body: [String: String], receiptKey: String) async throws -> GuestReceipt {
        let payload = try await send(path: path, method: "POST", body: body, token: nil)
        guard let receipt = payload[receiptKey] as? [String: Any] else {
            throw GuestApiError.message("That request could not be saved. Please try again.")
        }
        return try decodeReceipt(receipt)
    }

    private static func send(path: String, method: String, body: [String: String]?, token: String?) async throws -> [String: Any] {
        let base = AppConfig.apiBaseURL
        guard let url = URL(string: base.isEmpty ? path : base + path) else {
            throw GuestApiError.message("HandyHearts can't reach the service right now. Please try again later.")
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw GuestApiError.message("HandyHearts can't reach the service right now. Please try again later.")
        }
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if status >= 400 {
            let nested = json["error"] as? [String: Any]
            let message = nested?["message"] as? String ?? "That request could not be completed. Please try again."
            throw GuestApiError.message(message)
        }
        return json
    }

    private static func decodeReceipt(_ raw: [String: Any]) throws -> GuestReceipt {
        let data = try JSONSerialization.data(withJSONObject: raw)
        return try JSONDecoder().decode(GuestReceipt.self, from: data)
    }

    private static func staffFailure(_ message: String) -> String {
        let lower = message.lowercased()
        if lower.contains("invalid login") || lower.contains("invalid credentials") {
            return "That email and password do not match."
        }
        if lower.contains("password") { return "Use a password of at least 8 characters." }
        if lower.contains("email") { return "Enter a valid email." }
        return "Staff sign-in is unavailable right now. Please try again later."
    }
}
