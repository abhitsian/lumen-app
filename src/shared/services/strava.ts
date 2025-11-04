// Strava API Integration
// Docs: https://developers.strava.com/docs/reference/

interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

interface StravaActivity {
  id: number;
  name: string;
  type: string; // Run, Ride, Swim, etc.
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  start_date: string; // ISO 8601
  start_date_local: string;
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  map?: {
    summary_polyline: string;
  };
  start_latlng?: [number, number];
  end_latlng?: [number, number];
}

class StravaService {
  private clientId = ''; // User will need to provide this
  private clientSecret = ''; // User will need to provide this
  private redirectUri = 'http://localhost:3000/strava-callback';
  private baseUrl = 'https://www.strava.com/api/v3';

  // Check if Strava is configured
  isConfigured(): boolean {
    return this.clientId !== '' && this.clientSecret !== '';
  }

  // Configure Strava credentials
  configure(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  // Get authorization URL for OAuth flow
  getAuthorizationUrl(): string {
    const scopes = 'read,activity:read_all';
    return `https://www.strava.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code&scope=${scopes}`;
  }

  // Exchange authorization code for tokens
  async exchangeToken(code: string): Promise<StravaTokens> {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<StravaTokens> {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    };
  }

  // Get athlete profile
  async getAthlete(accessToken: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/athlete`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch athlete profile');
    }

    return response.json();
  }

  // Get activities with pagination
  async getActivities(
    accessToken: string,
    page: number = 1,
    perPage: number = 30
  ): Promise<StravaActivity[]> {
    const response = await fetch(
      `${this.baseUrl}/athlete/activities?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    return response.json();
  }

  // Get specific activity with more details
  async getActivity(activityId: number, accessToken: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/activities/${activityId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity');
    }

    return response.json();
  }

  // Helper: Format distance
  formatDistance(meters: number, unit: 'km' | 'mi' = 'km'): string {
    if (unit === 'km') {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${(meters / 1609.34).toFixed(2)} mi`;
  }

  // Helper: Format pace (min/km or min/mi)
  formatPace(metersPerSecond: number, unit: 'km' | 'mi' = 'km'): string {
    if (metersPerSecond === 0) return '--:--';

    const divisor = unit === 'km' ? 1000 : 1609.34;
    const secondsPerUnit = divisor / metersPerSecond;
    const minutes = Math.floor(secondsPerUnit / 60);
    const seconds = Math.floor(secondsPerUnit % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}/${unit}`;
  }

  // Helper: Format duration
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  }

  // Helper: Get activity emoji
  getActivityEmoji(type: string): string {
    const emojiMap: Record<string, string> = {
      'Run': '🏃',
      'Ride': '🚴',
      'Swim': '🏊',
      'Walk': '🚶',
      'Hike': '🥾',
      'Yoga': '🧘',
      'Workout': '💪',
      'WeightTraining': '🏋️',
      'Elliptical': '🏃',
      'StairStepper': '🪜',
      'Rowing': '🚣',
      'Crossfit': '🏋️',
    };
    return emojiMap[type] || '🏃';
  }
}

export const stravaService = new StravaService();
export type { StravaActivity, StravaTokens };
