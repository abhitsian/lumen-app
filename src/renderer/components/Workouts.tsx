import React, { useState, useEffect } from 'react';
import { Activity, Settings, RefreshCw, ExternalLink, TrendingUp, Zap, Heart, Clock } from 'lucide-react';
import { stravaService, StravaActivity, StravaTokens } from '../../shared/services/strava';

export function Workouts() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings form
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    loadStravaSettings();
    checkConnection();
  }, []);

  const loadStravaSettings = async () => {
    try {
      const settings = await window.electron.store.get('strava-settings');
      if (settings?.clientId && settings?.clientSecret) {
        setClientId(settings.clientId);
        setClientSecret(settings.clientSecret);
        stravaService.configure(settings.clientId, settings.clientSecret);
        setIsConfigured(true);
      }
    } catch (error) {
      console.error('Error loading Strava settings:', error);
    }
  };

  const saveStravaSettings = async () => {
    try {
      await window.electron.store.set('strava-settings', { clientId, clientSecret });
      stravaService.configure(clientId, clientSecret);
      setIsConfigured(true);
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving Strava settings:', error);
    }
  };

  const checkConnection = async () => {
    try {
      const tokens = await window.electron.store.get('strava-tokens');
      if (tokens?.accessToken) {
        setIsConnected(true);
        await loadActivities(tokens);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connectToStrava = () => {
    const authUrl = stravaService.getAuthorizationUrl();
    window.electron.openUrl(authUrl);
    // User will need to manually paste the authorization code
    // In a real app, you'd set up a proper OAuth callback
  };

  const handleAuthCode = async (code: string) => {
    try {
      setLoading(true);
      const tokens = await stravaService.exchangeToken(code);
      await window.electron.store.set('strava-tokens', tokens);
      setIsConnected(true);
      await loadActivities(tokens);
    } catch (error) {
      console.error('Error exchanging auth code:', error);
      alert('Failed to connect to Strava. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async (tokens: StravaTokens) => {
    try {
      setLoading(true);

      // Check if token needs refresh
      if (tokens.expiresAt < Date.now() / 1000) {
        const newTokens = await stravaService.refreshAccessToken(tokens.refreshToken);
        await window.electron.store.set('strava-tokens', newTokens);
        tokens = newTokens;
      }

      // Load athlete profile
      const athleteData = await stravaService.getAthlete(tokens.accessToken);
      setAthlete(athleteData);

      // Load activities
      const activitiesData = await stravaService.getActivities(tokens.accessToken, 1, 30);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshActivities = async () => {
    try {
      const tokens = await window.electron.store.get('strava-tokens');
      if (tokens) {
        await loadActivities(tokens);
      }
    } catch (error) {
      console.error('Error refreshing activities:', error);
    }
  };

  const disconnect = async () => {
    if (confirm('Are you sure you want to disconnect from Strava?')) {
      await window.electron.store.set('strava-tokens', null);
      setIsConnected(false);
      setActivities([]);
      setAthlete(null);
    }
  };

  // Settings view
  if (showSettings) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Strava API Configuration</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://www.strava.com/settings/api" target="_blank" className="underline">strava.com/settings/api</a></li>
                <li>Create an application</li>
                <li>Set Authorization Callback Domain to: <code className="bg-white px-1 rounded">localhost</code></li>
                <li>Copy your Client ID and Client Secret below</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="abc123..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveStravaSettings}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-all"
                >
                  Save Configuration
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not configured state
  if (!isConfigured) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <Activity className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Strava Integration</h2>
          <p className="text-gray-600 mb-6">
            Connect your Strava account to track workouts and fitness data alongside your reading activities.
          </p>
          <button
            onClick={() => setShowSettings(true)}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-all inline-flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Configure Strava API
          </button>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <Activity className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect to Strava</h2>
          <p className="text-gray-600 mb-6">
            Authorize Lumen to access your Strava activities and workout data.
          </p>
          <button
            onClick={connectToStrava}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-all inline-flex items-center gap-2 mb-4"
          >
            <ExternalLink className="w-5 h-5" />
            Connect with Strava
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="block mx-auto text-sm text-gray-600 hover:text-gray-900"
          >
            Change API Settings
          </button>
        </div>
      </div>
    );
  }

  // Connected state - show activities
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header with athlete info */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">
                  {athlete?.firstname} {athlete?.lastname}'s Workouts
                </h2>
                <p className="text-orange-100 text-sm">Connected to Strava</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshActivities}
                disabled={loading}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Activities list */}
        {loading && activities.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activities Yet</h3>
            <p className="text-gray-600">Your Strava activities will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const emoji = stravaService.getActivityEmoji(activity.type);
              const distance = stravaService.formatDistance(activity.distance);
              const duration = stravaService.formatDuration(activity.moving_time);
              const pace = stravaService.formatPace(activity.average_speed);
              const date = new Date(activity.start_date_local);

              return (
                <div
                  key={activity.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{emoji}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{activity.name}</h3>
                        <p className="text-sm text-gray-500">
                          {date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      {activity.type}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Distance
                      </div>
                      <div className="font-bold text-gray-900">{distance}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                        <Clock className="w-3 h-3" />
                        Duration
                      </div>
                      <div className="font-bold text-gray-900">{duration}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                        <Zap className="w-3 h-3" />
                        Pace
                      </div>
                      <div className="font-bold text-gray-900">{pace}</div>
                    </div>
                    {activity.average_heartrate && (
                      <div>
                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                          <Heart className="w-3 h-3" />
                          Avg HR
                        </div>
                        <div className="font-bold text-gray-900">
                          {Math.round(activity.average_heartrate)} bpm
                        </div>
                      </div>
                    )}
                  </div>

                  {activity.total_elevation_gain > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      Elevation Gain: {Math.round(activity.total_elevation_gain)}m
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
