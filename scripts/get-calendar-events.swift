#!/usr/bin/swift

import EventKit
import Foundation

let eventStore = EKEventStore()

// Request calendar access
let semaphore = DispatchSemaphore(value: 0)
var accessGranted = false

eventStore.requestAccess(to: .event) { granted, error in
    accessGranted = granted
    semaphore.signal()
}

semaphore.wait()

if !accessGranted {
    print("ERROR: Calendar access denied")
    exit(1)
}

// Get events for next 14 days
let calendar = Calendar.current
let startDate = Date()
let endDate = calendar.date(byAdding: .day, value: 14, to: startDate)!

let predicate = eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: nil)
let events = eventStore.events(matching: predicate)

// Convert to JSON
var jsonEvents: [[String: Any]] = []

for event in events {
    var meetingLinks: [[String: String]] = []

    // Extract meeting links from notes and location
    let fullText = "\(event.notes ?? "") \(event.location ?? "")"

    // Zoom
    if let range = fullText.range(of: #"https?://[^\s]*zoom\.us/[^\s]*"#, options: .regularExpression) {
        let url = String(fullText[range])
        meetingLinks.append(["type": "Zoom", "url": url])
    }

    // Google Meet
    if let range = fullText.range(of: #"https?://[^\s]*meet\.google\.com/[^\s]*"#, options: .regularExpression) {
        let url = String(fullText[range])
        meetingLinks.append(["type": "Google Meet", "url": url])
    }

    // Teams
    if let range = fullText.range(of: #"https?://[^\s]*teams\.microsoft\.com/[^\s]*"#, options: .regularExpression) {
        let url = String(fullText[range])
        meetingLinks.append(["type": "Teams", "url": url])
    }

    let eventDict: [String: Any] = [
        "id": event.eventIdentifier,
        "title": event.title ?? "Untitled",
        "start": ISO8601DateFormatter().string(from: event.startDate),
        "end": ISO8601DateFormatter().string(from: event.endDate),
        "location": event.location ?? "",
        "description": event.notes ?? "",
        "calendar": event.calendar.title,
        "isAllDay": event.isAllDay,
        "meetingLinks": meetingLinks
    ]

    jsonEvents.append(eventDict)
}

// Output JSON
if let jsonData = try? JSONSerialization.data(withJSONObject: jsonEvents, options: .prettyPrinted),
   let jsonString = String(data: jsonData, encoding: .utf8) {
    print(jsonString)
} else {
    print("ERROR: Failed to serialize JSON")
    exit(1)
}
