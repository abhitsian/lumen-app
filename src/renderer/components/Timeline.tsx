import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../shared/db/schema';
import { SessionCard } from './SessionCard';
import { format } from 'date-fns';

export function Timeline() {
  const sessions = useLiveQuery(
    () => db.sessions
      .orderBy('startTime')
      .reverse()
      .limit(50)
      .toArray()
  );

  if (!sessions) {
    return <div className="p-4">Loading...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No reading activity yet.</p>
        <p className="text-sm mt-2">Start browsing to track your reading!</p>
      </div>
    );
  }

  // Group by date
  const grouped = sessions.reduce((acc, session) => {
    const dateKey = format(session.startTime, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>);

  return (
    <div className="h-full overflow-y-auto">
      {Object.entries(grouped).map(([date, daySessions]) => (
        <div key={date} className="mb-6">
          <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </div>
          <div className="px-4 space-y-3 mt-2">
            {daySessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
