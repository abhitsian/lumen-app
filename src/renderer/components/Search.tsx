import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../shared/db/schema';
import { SessionCard } from './SessionCard';
import { Search as SearchIcon } from 'lucide-react';

export function Search() {
  const [query, setQuery] = useState('');

  const sessions = useLiveQuery(
    async () => {
      if (!query.trim()) {
        return [];
      }

      const lowerQuery = query.toLowerCase();

      // Search in title, domain, and content
      const results = await db.sessions
        .filter(session =>
          session.title.toLowerCase().includes(lowerQuery) ||
          session.domain.toLowerCase().includes(lowerQuery) ||
          session.content.text.toLowerCase().includes(lowerQuery) ||
          session.topics.some(t => t.toLowerCase().includes(lowerQuery))
        )
        .limit(20)
        .toArray();

      return results;
    },
    [query]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your reading history..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!query.trim() ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Enter a search query to find articles</p>
          </div>
        ) : !sessions ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Searching...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No results found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
