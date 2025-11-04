import { useState, useEffect } from 'react';
import { db } from '../../shared/db/schema';
import { UserPreferences } from '../../shared/types';
import { Save } from 'lucide-react';

export function Settings() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await db.preferences.get('default');
    if (prefs) {
      setPreferences(prefs);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      await db.preferences.update('default', preferences);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!preferences) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-6">
        {/* AI Settings */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Configuration</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Claude API Key
              </label>
              <input
                type="password"
                value={preferences.ai.apiKey}
                onChange={(e) => setPreferences({
                  ...preferences,
                  ai: { ...preferences.ai, apiKey: e.target.value }
                })}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from console.anthropic.com
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Summary Length
              </label>
              <select
                value={preferences.ai.summaryLength}
                onChange={(e) => setPreferences({
                  ...preferences,
                  ai: { ...preferences.ai, summaryLength: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="short">Short (100 words)</option>
                <option value="medium">Medium (200 words)</option>
                <option value="long">Long (300 words)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Privacy Settings */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Reading Time (seconds)
              </label>
              <input
                type="number"
                value={preferences.privacy.minTimeThreshold}
                onChange={(e) => setPreferences({
                  ...preferences,
                  privacy: { ...preferences.privacy, minTimeThreshold: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Excluded Domains (one per line)
              </label>
              <textarea
                value={preferences.privacy.excludedDomains.join('\n')}
                onChange={(e) => setPreferences({
                  ...preferences,
                  privacy: {
                    ...preferences.privacy,
                    excludedDomains: e.target.value.split('\n').filter(d => d.trim())
                  }
                })}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>
        </section>

        {/* Digest Settings */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Daily Digest</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule
              </label>
              <select
                value={preferences.digest.schedule}
                onChange={(e) => setPreferences({
                  ...preferences,
                  digest: { ...preferences.digest, schedule: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="off">Off</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {preferences.digest.schedule !== 'off' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Time
                </label>
                <input
                  type="time"
                  value={preferences.digest.deliveryTime}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    digest: { ...preferences.digest, deliveryTime: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="topicClustering"
                checked={preferences.digest.topicClustering}
                onChange={(e) => setPreferences({
                  ...preferences,
                  digest: { ...preferences.digest, topicClustering: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="topicClustering" className="ml-2 text-sm text-gray-700">
                Enable topic clustering with AI
              </label>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
