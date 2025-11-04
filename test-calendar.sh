#!/bin/bash

echo "Testing Calendar Access..."
echo "=========================="

# Simple test to get calendar events
osascript <<'EOF'
set output to ""
set startDate to current date
set endDate to current date
set time of endDate to 0
set endDate to endDate + (7 * days)

tell application "Calendar"
  set allCalendars to every calendar
  set calendarCount to count of allCalendars

  set output to output & "Found " & calendarCount & " calendars" & linefeed

  repeat with aCalendar in allCalendars
    set calendarName to name of aCalendar
    set output to output & "Calendar: " & calendarName & linefeed

    try
      set theEvents to (every event of aCalendar whose start date ≥ startDate and start date ≤ endDate)
      set eventCount to count of theEvents
      set output to output & "  Events in this calendar: " & eventCount & linefeed

      repeat with anEvent in theEvents
        set eventTitle to summary of anEvent
        set output to output & "  - " & eventTitle & linefeed
      end repeat
    on error errMsg
      set output to output & "  Error: " & errMsg & linefeed
    end try
  end repeat
end tell

return output
EOF

echo ""
echo "Test complete. If you see calendar names and events above, the script works."
echo "If you see errors, please share them with me."
