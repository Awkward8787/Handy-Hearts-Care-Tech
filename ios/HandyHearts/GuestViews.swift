import SwiftUI

enum CivilDate {
    static func string(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = AppConfig.businessTimeZone
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}

struct FieldBlock<Content: View>: View {
    let title: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.headline)
            content
        }
    }
}

struct ReceiptDetail: View {
    let receipt: GuestReceipt

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(receipt.reference)
                .font(.title.bold())
                .accessibilityAddTraits(.isHeader)
            Text(receipt.summary)
            if receipt.emailConfirmation == "sent" {
                Text("A confirmation was sent to your email.")
            }
            if receipt.smsConfirmation == "sent" {
                Text("A text confirmation was sent to your phone.")
            }
            if receipt.kind == "order" {
                Text(receipt.paymentStatus == "paid" ? "Payment received." : "No payment was taken.")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .overlay(RoundedRectangle(cornerRadius: 4).stroke(Color.black, lineWidth: 4))
    }
}

struct ConsultView: View {
    @State private var fullName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var topic = "device_setup"
    @State private var date = Date()
    @State private var preferredTime = "morning"
    @State private var notes = ""
    @State private var error = ""
    @State private var pending = false
    @State private var receipt: GuestReceipt?

    private let topics = [
        ("device_setup", "Device Setup"),
        ("troubleshooting", "Fix/Repair"),
        ("training", "Learning"),
        ("wifi_setup", "WiFi/Network"),
        ("printer_setup", "Printers"),
        ("unsure", "Not sure yet"),
    ]
    private let times = ["anytime", "morning", "afternoon", "evening"]

    var body: some View {
        Form {
            if let receipt {
                Section {
                    ReceiptDetail(receipt: receipt)
                }
            } else {
                Section {
                    Text("No account needed. Add your name, a way to reach you, and a time.")
                    if !error.isEmpty { Text(error).foregroundStyle(.red) }
                    TextField("Your name", text: $fullName)
                        .textContentType(.name)
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                    TextField("Phone", text: $phone)
                        .textContentType(.telephoneNumber)
                        .keyboardType(.phonePad)
                    Picker("What do you want to talk about?", selection: $topic) {
                        ForEach(topics, id: \.0) { item in
                            Text(item.1).tag(item.0)
                        }
                    }
                    DatePicker("Preferred date", selection: $date, displayedComponents: .date)
                    Picker("Preferred time", selection: $preferredTime) {
                        ForEach(times, id: \.self) { Text($0.capitalized).tag($0) }
                    }
                    TextField("Anything else?", text: $notes, axis: .vertical)
                    Button(pending ? "Saving request" : "Request consultation") {
                        Task { await submit() }
                    }
                    .disabled(pending)
                }
            }
        }
        .navigationTitle("Consultation")
    }

    private func submit() async {
        error = ""
        pending = true
        defer { pending = false }
        do {
            receipt = try await GuestApi.createConsultation([
                "fullName": fullName,
                "email": email,
                "phone": phone,
                "topic": topic,
                "preferredDate": CivilDate.string(from: date),
                "preferredTime": preferredTime,
                "notes": notes,
            ])
        } catch let GuestApiError.message(message) {
            error = message
        } catch {
            error = "That request could not be saved. Please try again."
        }
    }
}

struct BookView: View {
    @State private var fullName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var serviceCategory = "device_setup"
    @State private var urgency = "low"
    @State private var serviceType = "in_home"
    @State private var address = ""
    @State private var date = Date()
    @State private var preferredTime = "morning"
    @State private var notes = ""
    @State private var error = ""
    @State private var pending = false
    @State private var receipt: GuestReceipt?
    @State private var clientSecret: String?

    private let services = [
        ("device_setup", "Device Setup"),
        ("troubleshooting", "Fix/Repair"),
        ("training", "Learning"),
        ("wifi_setup", "WiFi/Network"),
        ("printer_setup", "Printers"),
    ]

    var body: some View {
        Form {
            if let receipt {
                Section {
                    ReceiptDetail(receipt: receipt)
                    if clientSecret != nil, !AppConfig.stripePublishableKey.isEmpty {
                        PayBookingButton(secret: clientSecret ?? "", reference: receipt.reference)
                    } else {
                        Text("No payment was taken.")
                    }
                }
            } else {
                Section {
                    Text("No account needed. An address is required only for an in-home visit.")
                    if !error.isEmpty { Text(error).foregroundStyle(.red) }
                    Picker("Service", selection: $serviceCategory) {
                        ForEach(services, id: \.0) { Text($0.1).tag($0.0) }
                    }
                    Picker("How soon", selection: $urgency) {
                        Text("Standard").tag("low")
                        Text("Expedited").tag("medium")
                        Text("Emergency").tag("high")
                    }
                    Picker("Where", selection: $serviceType) {
                        Text("In-home visit").tag("in_home")
                        Text("Remote help").tag("remote")
                    }
                    if serviceType == "in_home" {
                        TextField("Address", text: $address, axis: .vertical)
                            .textContentType(.fullStreetAddress)
                    }
                    DatePicker("Preferred date", selection: $date, displayedComponents: .date)
                    Picker("Preferred time", selection: $preferredTime) {
                        ForEach(["anytime", "morning", "afternoon", "evening"], id: \.self) { Text($0.capitalized).tag($0) }
                    }
                    TextField("Your name", text: $fullName).textContentType(.name)
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                    TextField("Phone", text: $phone)
                        .keyboardType(.phonePad)
                        .textContentType(.telephoneNumber)
                    TextField("Anything else?", text: $notes, axis: .vertical)
                    Button(pending ? "Saving booking" : "Place booking") {
                        Task { await submit() }
                    }
                    .disabled(pending)
                }
            }
        }
        .navigationTitle("Book a service")
    }

    private func submit() async {
        error = ""
        pending = true
        defer { pending = false }
        do {
            let result = try await GuestApi.createOrder([
                "fullName": fullName,
                "email": email,
                "phone": phone,
                "serviceCategory": serviceCategory,
                "urgency": urgency,
                "serviceType": serviceType,
                "address": address,
                "preferredDate": CivilDate.string(from: date),
                "preferredTime": preferredTime,
                "notes": notes,
            ])
            receipt = result.0
            clientSecret = result.1
        } catch let GuestApiError.message(message) {
            error = message
        } catch {
            error = "That request could not be saved. Please try again."
        }
    }
}

struct ReceiptLookupView: View {
    @State private var reference = ""
    @State private var error = ""
    @State private var receipt: GuestReceipt?

    var body: some View {
        Form {
            Section {
                Text("Enter the reference from your consultation or booking. No account is required.")
                if !error.isEmpty { Text(error).foregroundStyle(.red) }
                TextField("Reference", text: $reference)
                    .textInputAutocapitalization(.characters)
                Button("Show receipt") {
                    Task { await load() }
                }
            }
            if let receipt {
                Section { ReceiptDetail(receipt: receipt) }
            }
        }
        .navigationTitle("Receipt")
    }

    private func load() async {
        error = ""
        receipt = nil
        do {
            receipt = try await GuestApi.receipt(reference: reference.trimmingCharacters(in: .whitespacesAndNewlines).uppercased())
        } catch let GuestApiError.message(message) {
            error = message
        } catch {
            error = "That receipt was not found."
        }
    }
}
