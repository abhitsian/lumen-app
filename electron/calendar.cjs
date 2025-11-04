const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

/**
 * Get calendar events using Swift EventKit
 * Requires Calendar permissions for the app
 */
async function getCalendarEvents(daysAhead = 7) {
  try {
    console.log('Fetching calendar events via Swift EventKit...');

    // Call the Swift script - handle both dev and production paths
    let scriptPath = path.join(__dirname, '../scripts/get-calendar-events.swift');

    // In production, scripts are unpacked from asar
    if (scriptPath.includes('app.asar')) {
      scriptPath = scriptPath.replace('app.asar', 'app.asar.unpacked');
    }

    console.log('Script path:', scriptPath);

    const { stdout, stderr } = await execAsync(
      `/usr/bin/swift "${scriptPath}"`,
      { timeout: 5000 }
    );

    // Check for permission error
    if (stderr && stderr.includes('Calendar access denied')) {
      console.log('Calendar access denied - returning setup instructions');
      return [{
        id: 'setup-1',
        title: '📅 Calendar Permission Required',
        start: new Date(Date.now() + 3600000).toISOString(),
        end: new Date(Date.now() + 7200000).toISOString(),
        location: '',
        description: 'To view your calendar events:\n\n1. Open System Settings > Privacy & Security > Calendars\n2. Find "ReadTrack" in the list\n3. Toggle it ON\n4. Restart the app\n\nIf ReadTrack is not listed, it means the permission prompt hasn\'t appeared yet. Try clicking "Refresh" above.',
        url: '',
        calendar: 'ReadTrack',
        color: '#3b82f6',
        status: 'confirmed',
        isAllDay: false,
        meetingLinks: []
      }];
    }

    if (stderr) {
      console.log('Script stderr:', stderr);
    }

    if (!stdout || stdout.trim() === '' || stdout.trim() === '[]') {
      console.log('No events found');
      return [];
    }

    // Parse JSON
    const events = JSON.parse(stdout);
    console.log(`Found ${events.length} events from EventKit`);

    // Process events
    const processedEvents = events.map(evt => {
      return {
        id: evt.id || `${evt.title}-${new Date(evt.start).getTime()}`,
        title: evt.title,
        start: evt.start,
        end: evt.end,
        location: evt.location,
        description: evt.description,
        url: '',
        calendar: evt.calendar,
        color: getCalendarColor(evt.calendar),
        status: 'confirmed',
        isAllDay: evt.isAllDay,
        meetingLinks: evt.meetingLinks || []
      };
    });

    processedEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

    console.log(`✅ Successfully loaded ${processedEvents.length} events`);
    return processedEvents;

  } catch (error) {
    console.error('Calendar error:', error.message);

    // Check for timeout
    if (error.message.includes('timeout') || error.killed) {
      return [{
        id: 'error-1',
        title: '⚠️ Calendar Access Blocked',
        start: new Date(Date.now() + 3600000).toISOString(),
        end: new Date(Date.now() + 7200000).toISOString(),
        location: '',
        description: 'Calendar access timed out. macOS may be blocking access.\n\nPlease:\n1. Open System Settings > Privacy & Security > Automation\n2. Find "ReadTrack" or your terminal app\n3. Grant Calendar access\n4. Restart the app',
        url: '',
        calendar: 'System',
        color: '#ef4444',
        status: 'confirmed',
        isAllDay: false,
        meetingLinks: []
      }];
    }

    // Generic error
    return [{
      id: 'error-1',
      title: '⚠️ Calendar Error',
      start: new Date(Date.now() + 3600000).toISOString(),
      end: new Date(Date.now() + 7200000).toISOString(),
      location: '',
      description: `Error: ${error.message}\n\nPlease check System Settings > Privacy & Security > Calendars to ensure the app has permission.`,
      url: '',
      calendar: 'System',
      color: '#ef4444',
      status: 'confirmed',
      isAllDay: false,
      meetingLinks: []
    }];
  }
}

/**
 * Get a color for a calendar
 */
function getCalendarColor(calendarName) {
  const colors = {
    'Work': '#3b82f6',
    'Personal': '#10b981',
    'Family': '#f59e0b',
    'Holidays': '#ef4444',
    'Birthdays': '#ec4899',
    'Home': '#8b5cf6',
    'Calendar': '#6366f1',
    'Knowledge 2025': '#8b5cf6',
    'Ticktick Tasks': '#06b6d4'
  };
  return colors[calendarName] || '#6366f1';
}

/**
 * Extract meeting links
 */
function extractMeetingLinks(description = '', location = '') {
  const links = [];
  const text = `${description} ${location}`;

  const patterns = [
    { type: 'Zoom', regex: /https?:\/\/[^\s]*zoom\.us\/[^\s]*/i },
    { type: 'Google Meet', regex: /https?:\/\/[^\s]*meet\.google\.com\/[^\s]*/i },
    { type: 'Teams', regex: /https?:\/\/[^\s]*teams\.microsoft\.com\/[^\s]*/i },
    { type: 'Webex', regex: /https?:\/\/[^\s]*webex\.com\/[^\s]*/i }
  ];

  for (const { type, regex } of patterns) {
    const match = text.match(regex);
    if (match) {
      links.push({ type, url: match[0].replace(/[,;.]$/, '') });
    }
  }

  return links;
}

/**
 * Watch for calendar changes
 */
function watchCalendarEvents(callback, interval = 60000) {
  let lastChecksum = '';
  let isRunning = true;

  const poll = async () => {
    if (!isRunning) return;

    try {
      const events = await getCalendarEvents(14);
      const checksum = `${events.length}-${events[0]?.id || ''}`;

      if (checksum !== lastChecksum) {
        console.log('📅 Calendar changes detected');
        lastChecksum = checksum;
        callback(events);
      }
    } catch (error) {
      console.error('Watch error:', error.message);
    }

    if (isRunning) {
      setTimeout(poll, interval);
    }
  };

  poll();

  return {
    stop: () => {
      isRunning = false;
    }
  };
}

module.exports = {
  getCalendarEvents,
  watchCalendarEvents
};
