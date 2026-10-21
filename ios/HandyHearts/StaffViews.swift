import StripePaymentSheet
import SwiftUI
import UIKit

struct PayBookingButton: View {
    let secret: String
    let reference: String
    @State private var message = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button("Pay now") { present() }
            if !message.isEmpty { Text(message) }
            Text("Reference \(reference)")
                .font(.footnote)
        }
    }

    private func present() {
        StripeAPI.defaultPublishableKey = AppConfig.stripePublishableKey
        var configuration = PaymentSheet.Configuration()
        configuration.merchantDisplayName = "HandyHearts Care Tech"
        configuration.returnURL = "handyhearts://stripe-redirect"
        let sheet = PaymentSheet(paymentIntentClientSecret: secret, configuration: configuration)
        guard let controller = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .rootViewController else {
            message = "The card payment did not go through. No payment was taken."
            return
        }
        sheet.present(from: controller) { result in
            switch result {
            case .completed:
                message = "Payment received."
            case .canceled:
                message = "No payment was taken."
            case .failed(let error):
                let stripeError = error as NSError
                let customerSafe = stripeError.domain.contains("card") || stripeError.localizedDescription.isEmpty == false
                message = customerSafe ? stripeError.localizedDescription : "The card payment did not go through. No payment was taken."
                if message.isEmpty {
                    message = "The card payment did not go through. No payment was taken."
                }
            }
        }
    }
}

struct StaffView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var token = StaffKeychain.read()
    @State private var portal = ""
    @State private var error = ""
    @State private var pending = false

    var body: some View {
        Form {
            Section {
                Text("This sign-in is for staff and providers. Guests do not need it to request a consultation or book a service.")
                if !error.isEmpty { Text(error).foregroundStyle(.red) }
            }
            if token == nil {
                Section {
                    TextField("Email", text: $email)
                        .textContentType(.username)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                    SecureField("Password", text: $password)
                    Button(pending ? "Signing in" : "Sign in") {
                        Task { await signIn() }
                    }
                    .disabled(pending)
                }
            } else {
                Section {
                    Text(portal.isEmpty ? "Signed in" : "Signed in · \(portal)")
                    Button("Sign out") {
                        StaffKeychain.clear()
                        token = nil
                        portal = ""
                    }
                }
            }
        }
        .navigationTitle("Staff")
        .task(id: token) { await load() }
    }

    private func signIn() async {
        error = ""
        pending = true
        defer { pending = false }
        do {
            let access = try await GuestApi.signIn(email: email, password: password)
            StaffKeychain.save(access)
            token = access
        } catch let GuestApiError.message(message) {
            error = message
        } catch {
            error = "Staff sign-in is unavailable right now. Please try again later."
        }
    }

    private func load() async {
        guard let token else { return }
        do {
            portal = try await GuestApi.staffMe(token: token)
        } catch let GuestApiError.message(message) {
            error = message
        } catch {
            error = "Staff sign-in is unavailable right now. Please try again later."
        }
    }
}
