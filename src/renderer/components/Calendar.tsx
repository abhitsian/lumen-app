import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Video, MapPin, Clock, ExternalLink, RefreshCw, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
  url: string;
  calendar: string;
  color: string;
  status: string;
  isAllDay: boolean;
  meetingLinks: Array<{
    type: string;
    url: string;
  }>;
}

export function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.electron.calendar.getEvents(14); // Get 2 weeks ahead

      if (result.success) {
        setEvents(result.events);
      } else {
        setError(result.error || 'Failed to load calendar events');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load calendar events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
  };

  const handleJoinMeeting = async (url: string) => {
    try {
      await window.electron.openUrl(url);
    } catch (error) {
      console.error('Error opening meeting link:', error);
    }
  };

  useEffect(() => {
    loadEvents();

    // Start watching for calendar changes
    window.electron.calendar.startWatch();

    // Listen for calendar updates
    const cleanup = window.electron.calendar.onUpdated((updatedEvents: CalendarEvent[]) => {
      console.log('Calendar updated:', updatedEvents.length, 'events');
      setEvents(updatedEvents);
    });

    return () => {
      cleanup();
      window.electron.calendar.stopWatch();
    };
  }, []);

  const groupEventsByDate = () => {
    const grouped: Record<string, CalendarEvent[]> = {};

    events.forEach(event => {
      const date = new Date(event.start);
      const dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const isEventNow = (event: CalendarEvent) => {
    const now = new Date();
    const start = new Date(event.start);
    const end = new Date(event.end);
    return now >= start && now <= end;
  };

  const isEventSoon = (event: CalendarEvent) => {
    const now = new Date();
    const start = new Date(event.start);
    const diffMinutes = (start.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes > 0 && diffMinutes <= 15;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-600">Loading calendar events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <CalendarIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar Access Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Please grant ReadTrack access to your Calendar in System Preferences → Privacy & Security → Calendar
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const groupedEvents = groupEventsByDate();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Calendar</h1>
              <p className="text-xs text-gray-500">{events.length} upcoming events</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-6">
        {events.length === 0 ? (
          <div className="text-center py-20">
            <CalendarIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Upcoming Events</h3>
            <p className="text-gray-500 text-sm">Your calendar is clear for the next 2 weeks</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {Object.entries(groupedEvents).map(([date, dayEvents]) => (
              <div key={date}>
                <h2 className="text-lg font-bold text-gray-800 mb-3">{date}</h2>
                <div className="space-y-3">
                  {dayEvents.map(event => {
                    const isNow = isEventNow(event);
                    const isSoon = isEventSoon(event);

                    return (
                      <div
                        key={event.id}
                        className={`bg-white rounded-lg border-2 p-4 transition-all ${
                          isNow
                            ? 'border-green-500 shadow-lg shadow-green-100'
                            : isSoon
                            ? 'border-orange-500 shadow-lg shadow-orange-100'
                            : 'border-gray-200 hover:shadow-md'
                        }`}
                      >
                        {/* Event Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {isNow && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                  HAPPENING NOW
                                </span>
                              )}
                              {isSoon && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                                  STARTING SOON
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {event.isAllDay ? (
                                  <span>All day</span>
                                ) : (
                                  <span>
                                    {formatTime(event.start)} - {formatTime(event.end)}
                                  </span>
                                )}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span className="truncate max-w-xs">{event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Calendar badge */}
                          <div
                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: event.color }}
                          >
                            {event.calendar}
                          </div>
                        </div>

                        {/* Meeting Links */}
                        {event.meetingLinks && event.meetingLinks.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-2">
                              {event.meetingLinks.map((link, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleJoinMeeting(link.url)}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-105 ${
                                    isNow || isSoon
                                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg animate-pulse'
                                      : 'bg-blue-600 hover:bg-blue-700'
                                  }`}
                                >
                                  <Video className="w-4 h-4" />
                                  Join {link.type}
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {event.description && (
                          <div className="text-sm text-gray-700 mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="line-clamp-2">{event.description}</p>
                          </div>
                        )}

                        {/* Event URL */}
                        {event.url && (
                          <button
                            onClick={() => handleJoinMeeting(event.url)}
                            className="flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View in Calendar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
