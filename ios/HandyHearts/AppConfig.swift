import Foundation

enum AppConfig {
    static var apiBaseURL: String {
        trimmed("APIBaseURL")
    }

    static var stripePublishableKey: String {
        trimmed("StripePublishableKey")
    }

    static var supabaseURL: String {
        trimmed("SupabaseURL")
    }

    static var supabaseAnonKey: String {
        trimmed("SupabaseAnonKey")
    }

    static var businessTimeZone: TimeZone {
        let name = trimmed("BusinessTimeZone")
        if let zone = TimeZone(identifier: name), !name.isEmpty {
            return zone
        }
        return TimeZone(secondsFromGMT: 0) ?? .current
    }

    static var staffSignInReady: Bool {
        !supabaseURL.isEmpty && !supabaseAnonKey.isEmpty
    }

    private static func trimmed(_ key: String) -> String {
        let value = Bundle.main.object(forInfoDictionaryKey: key) as? String ?? ""
        return value.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
