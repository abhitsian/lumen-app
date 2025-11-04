import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../shared/db/schema';
import { format, parseISO, subDays } from 'date-fns';
import { Sparkles, Calendar } from 'lucide-react';

export function Digest() {
  const [generating, setGenerating] = useState(false);

  const digests = useLiveQuery(
    () => db.digests
      .orderBy('date')
      .reverse()
      .limit(10)
      .toArray()
  );

  const handleGenerateDigest = async () => {
    setGenerating(true);
    try {
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_DIGEST',
        date: yesterday
      });

      if (!response.success) {
        alert(response.error || 'Failed to generate digest');
      }
    } catch (error) {
      alert('Failed to generate digest: ' + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  if (!digests) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4">
        <button
          onClick={handleGenerateDigest}
          disabled={generating}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {generating ? 'Generating...' : 'Generate Digest for Yesterday'}
        </button>
      </div>

      {digests.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <p>No digests yet.</p>
          <p className="text-sm mt-2">Click the button above to generate your first digest!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {digests.map(digest => (
            <div key={digest.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">
                  {format(parseISO(digest.date), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {digest.summary.totalArticles}
                  </div>
                  <div className="text-xs text-gray-500">Articles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {digest.summary.totalReadingTime}
                  </div>
                  <div className="text-xs text-gray-500">Minutes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {digest.summary.topics.length}
                  </div>
                  <div className="text-xs text-gray-500">Topics</div>
                </div>
              </div>

              {digest.summary.topDomains.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Sources</h4>
                  <div className="flex flex-wrap gap-2">
                    {digest.summary.topDomains.map(d => (
                      <span key={d.domain} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {d.domain} ({d.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {digest.summary.topics.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {digest.summary.topics.map(t => (
                      <span key={t.name} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded p-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Summary</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {digest.summary.aiSummary}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
