import SwiftUI

@main
struct HandyHeartsApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

struct RootView: View {
    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text("Request help without creating an account.")
                        .font(.title2.bold())
                    Text("Tell us what you need, when you want it, and how to reach you. You get a receipt with a reference.")
                }
                Section {
                    NavigationLink("Request a consultation") { ConsultView() }
                    NavigationLink("Book a service") { BookView() }
                    NavigationLink("Look up a receipt") { ReceiptLookupView() }
                }
                Section {
                    NavigationLink("Staff") { StaffView() }
                }
            }
            .navigationTitle("HandyHearts")
        }
    }
}
