# 🏃 Strava Integration Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create a Strava API Application

1. Go to **https://www.strava.com/settings/api**
2. Log in with your Strava account
3. Fill in the application details:
   - **Application Name**: Lumen (or any name you prefer)
   - **Category**: Data Importer
   - **Club**: Leave blank
   - **Website**: http://localhost (or your actual website)
   - **Authorization Callback Domain**: `localhost`
4. Upload an application icon (optional)
5. Click **Create**

### Step 2: Get Your API Credentials

After creating the app, you'll see:
- **Client ID**: A number (e.g., 123456)
- **Client Secret**: A long string (e.g., abc123def456...)

**Copy both of these** - you'll need them in the next step.

### Step 3: Configure Lumen

1. Open Lumen
2. Go to the **Workouts** tab
3. Click **Configure Strava API**
4. Paste your **Client ID** and **Client Secret**
5. Click **Save Configuration**

### Step 4: Connect Your Strava Account

1. Click **Connect with Strava**
2. You'll be redirected to Strava's authorization page in your browser
3. Click **Authorize** to grant Lumen access to your activities
4. Copy the authorization code from the URL (it will look like: `?code=abc123...`)
5. Paste it back into Lumen when prompted

### Step 5: Enjoy Your Workouts!

Your Strava activities will now appear in the Workouts tab, showing:
- Activity type (Run, Ride, Swim, etc.)
- Distance, duration, and pace
- Heart rate data (if available)
- Elevation gain
- Date and time

## Troubleshooting

### "Failed to connect to Strava"
- Make sure your Client ID and Client Secret are correct
- Check that the Authorization Callback Domain is set to `localhost`
- Try refreshing the page and reconnecting

### "No activities showing"
- Click the refresh button (↻) in the top right
- Make sure you have activities on Strava
- Check that you authorized "read" and "activity:read_all" scopes

### "Token expired"
- Lumen automatically refreshes tokens, but you may need to reconnect if there's an issue
- Go to Workouts → Settings → Disconnect → Connect again

## Privacy & Security

- **Local Storage**: Your Strava tokens are stored locally on your Mac, never in the cloud
- **Limited Access**: Lumen only requests read-only access to your activities
- **No Data Sharing**: Your workout data is never shared with third parties
- **Revoke Access**: You can revoke Lumen's access anytime at https://www.strava.com/settings/apps

## API Limits

Strava's free API tier allows:
- 100 requests every 15 minutes
- 1,000 requests per day

Lumen is designed to stay well within these limits.

## What Data is Synced?

Lumen pulls the following from Strava:
- Activity name and type
- Distance, duration, pace
- Heart rate (average and max)
- Elevation gain
- Start date/time
- Route polyline (for future map feature)

Lumen does **NOT** pull:
- Private activities (unless you explicitly grant access)
- Photos or comments
- Athlete followers/following lists
- Segment efforts

## Future Features

Coming soon:
- Route maps visualization
- Workout statistics and trends
- Training load analysis
- Weekly/monthly summaries
- Export workout data

---

**Need help?** Check the [Strava API documentation](https://developers.strava.com/docs/) or create an issue on GitHub.
