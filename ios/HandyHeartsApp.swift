
import SwiftUI
import StripePaymentSheet

/**
 * HANDYHEARTS iOS ARCHITECTURE (MEDM)
 * -----------------------------------
 * This file contains the root app structure and role shells.
 */

@main
struct HandyHeartsApp: App {
    @StateObject private var authManager = AuthManager()
    
    var body: some Scene {
        WindowGroup {
            Group {
                if authManager.isAuthenticated {
                    switch authManager.userRole {
                    case .family:
                        FamilyShellView()
                    case .provider:
                        ProviderShellView()
                    case .admin:
                        AdminShellView()
                    }
                } else {
                    LoginView()
                }
            }
            .environmentObject(authManager)
        }
    }
}

// MARK: - Role Shells (MEDM Separation)

struct FamilyShellView: View {
    var body: some View {
        TabView {
            RequestServiceView()
                .tabItem { Label("Request", systemImage: "plus.circle.fill") }
            
            BookingsListView()
                .tabItem { Label("Bookings", systemImage: "calendar") }
            
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }
        .accentColor(.pink)
    }
}

struct ProviderShellView: View {
    var body: some View {
        TabView {
            JobBoardView()
                .tabItem { Label("Jobs", systemImage: "briefcase.fill") }
            
            EarningsView()
                .tabItem { Label("Earnings", systemImage: "dollarsign.circle") }
        }
        .accentColor(.emerald)
    }
}

struct AdminShellView: View {
    var body: some View {
        NavigationView {
            List {
                Section("Platform Control") {
                    NavigationLink("Service Management") { Text("Services Editor") }
                    NavigationLink("Provider Verification") { Text("Approval Queue") }
                }
            }
            .navigationTitle("Admin HQ")
        }
    }
}

// MARK: - Stripe Integration Logic

class PaymentViewModel: ObservableObject {
    @Published var paymentSheet: PaymentSheet?
    @Published var paymentResult: PaymentSheetResult?

    func preparePayment(amount: Int) {
        // 1. Call backend POST /payments/create-intent
        // 2. Receive client_secret
        // 3. Initialize PaymentSheet
        
        let clientSecret = "pi_..." // From Backend
        var configuration = PaymentSheet.Configuration()
        configuration.merchantDisplayName = "HandyHearts Care"
        configuration.allowsDelayedPaymentMethods = false
        
        DispatchQueue.main.async {
            self.paymentSheet = PaymentSheet(paymentIntentClientSecret: clientSecret, configuration: configuration)
        }
    }
}

// MARK: - Models & Entities

enum UserRole {
    case family, provider, admin
}

class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var userRole: UserRole = .family
    
    func login(role: UserRole) {
        self.userRole = role
        self.isAuthenticated = true
    }
}
