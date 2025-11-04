#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Get Calendar Events JSON
# @raycast.mode silent
# @raycast.packageName ReadTrack

# Documentation:
# @raycast.description Export calendar events as JSON for ReadTrack app
# @raycast.author ReadTrack
# @raycast.authorURL https://github.com/readtrack

# Get events for next 14 days using shortcuts
/usr/bin/osascript -l JavaScript << 'EOF'
function run() {
  const Calendar = Application('Calendar');
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + 14);

  const events = [];

  try {
    const calendars = Calendar.calendars();

    for (let i = 0; i < calendars.length; i++) {
      const cal = calendars[i];
      const calName = cal.name();
      const calEvents = cal.events();

      for (let j = 0; j < calEvents.length; j++) {
        const evt = calEvents[j];
        const startDate = evt.startDate();

        if (startDate > now && startDate < future) {
          events.push({
            title: evt.summary(),
            start: startDate.toISOString(),
            end: evt.endDate().toISOString(),
            location: evt.location() || '',
            description: evt.description() || '',
            calendar: calName,
            isAllDay: evt.alldayEvent()
          });
        }
      }
    }
  } catch(e) {}

  return JSON.stringify(events);
}
EOF
