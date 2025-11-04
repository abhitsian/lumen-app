import { ReadingSession } from '../../shared/types';
import { Clock, ExternalLink, Star } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../../shared/db/schema';

interface SessionCardProps {
  session: ReadingSession;
}

export function SessionCard({ session }: SessionCardProps) {
  const readingTimeMin = Math.round(session.activeReadingTime / 60);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {session.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
            {session.domain}
          </p>
          {session.content.excerpt && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
              {session.content.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readingTimeMin} min
            </span>
            <span>{format(session.startTime, 'h:mm a')}</span>
            {session.topics.length > 0 && (
              <div className="flex gap-1">
                {session.topics.slice(0, 2).map(topic => (
                  <span key={topic} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => window.open(session.url, '_blank')}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              await db.sessions.update(session.id, { isFavorite: !session.isFavorite });
            }}
            className={`p-1 ${session.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Star className="w-4 h-4" fill={session.isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}
