import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen, globalShortcut, Notification, shell } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createRequire } from 'module';
import Store from 'electron-store';

const require = createRequire(import.meta.url);
const calendar = require('./calendar.cjs');

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const store = new Store();

let tray = null;
let mainWindow = null;

const createWindow = () => {
  // Get the mouse position
  const cursorPosition = screen.getCursorScreenPoint();
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Create the window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    x: Math.min(cursorPosition.x - 600, width - 1200),
    y: 40,
    show: true,
    frame: true,
    resizable: true,
    skipTaskbar: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    }
  });

  // Load the app
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  // Commented out auto-hide for debugging
  // mainWindow.on('blur', () => {
  //   if (!mainWindow.webContents.isDevToolsOpened()) {
  //     mainWindow.hide();
  //   }
  // });
};

const createTray = () => {
  // Create a template icon for the menu bar
  const canvas = `
    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="12" height="8" fill="black" rx="1"/>
      <rect x="4" y="6" width="8" height="1" fill="white"/>
      <rect x="4" y="8" width="8" height="1" fill="white"/>
      <rect x="4" y="10" width="6" height="1" fill="white"/>
    </svg>
  `;

  const iconImage = nativeImage.createFromDataURL(
    'data:image/svg+xml;base64,' + Buffer.from(canvas).toString('base64')
  );
  iconImage.setTemplateImage(true);

  tray = new Tray(iconImage);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open ReadTrack',
      click: () => {
        if (!mainWindow) {
          createWindow();
        }
        mainWindow.show();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('ReadTrack - Track your reading');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (!mainWindow) {
      createWindow();
    }

    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
};

// IPC handlers
ipcMain.handle('get-store-value', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', async (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('delete-store-value', async (event, key) => {
  store.delete(key);
});

ipcMain.handle('clear-store', async () => {
  store.clear();
});

// Function to get current browser URL using AppleScript
async function getCurrentBrowserUrl() {
  const chromeScript = `
    tell application "Google Chrome"
      if (count of windows) > 0 then
        set currentURL to URL of active tab of front window
        set currentTitle to title of active tab of front window
        return currentURL & "|||" & currentTitle
      end if
    end tell
  `;

  const safariScript = `
    tell application "Safari"
      if (count of windows) > 0 then
        set currentURL to URL of front document
        set currentTitle to name of front document
        return currentURL & "|||" & currentTitle
      end if
    end tell
  `;

  // Try Chrome first (more commonly used)
  try {
    const { stdout } = await execAsync(`osascript -e '${chromeScript}'`);
    const output = stdout.trim();
    console.log('Chrome output:', output);

    if (output && !output.includes('missing value')) {
      const parts = output.split('|||');
      if (parts.length === 2) {
        const [url, title] = parts;
        if (url && url !== 'missing value' && title && title !== 'missing value') {
          console.log('Chrome success:', { url, title });
          return { url, title, browser: 'Chrome' };
        }
      }
    }
  } catch (e) {
    console.log('Chrome error:', e.message);
  }

  // Try Safari as fallback
  try {
    const { stdout } = await execAsync(`osascript -e '${safariScript}'`);
    const output = stdout.trim();
    console.log('Safari output:', output);

    if (output && !output.includes('missing value')) {
      const parts = output.split('|||');
      if (parts.length === 2) {
        const [url, title] = parts;
        if (url && url !== 'missing value' && title && title !== 'missing value') {
          console.log('Safari success:', { url, title });
          return { url, title, browser: 'Safari' };
        }
      }
    }
  } catch (e) {
    console.log('Safari error:', e.message);
  }

  return null;
}

// Add page capture handler
ipcMain.handle('capture-page', async (event, data) => {
  // Store the captured page data
  const sessions = store.get('sessions', []);
  sessions.push(data);
  store.set('sessions', sessions);
  return { success: true };
});

// Handle capture current page request
ipcMain.handle('capture-current-page', async () => {
  try {
    console.log('Attempting to capture current page...');
    const browserData = await getCurrentBrowserUrl();
    console.log('Browser data:', browserData);
    if (browserData) {
      return browserData;
    }
    return { error: 'No active browser window found' };
  } catch (error) {
    console.error('Error in capture-current-page:', error);
    return { error: error.message };
  }
});

// Handle opening URLs in default browser
ipcMain.handle('open-url', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Error opening URL:', error);
    return { error: error.message };
  }
});

// Calendar IPC handlers
ipcMain.handle('get-calendar-events', async (event, daysAhead = 7) => {
  try {
    const events = await calendar.getCalendarEvents(daysAhead);
    return { success: true, events };
  } catch (error) {
    console.error('Error getting calendar events:', error);
    return { success: false, error: error.message };
  }
});

// Calendar auto-refresh watcher
let calendarWatcher = null;

ipcMain.handle('start-calendar-watch', async (event) => {
  try {
    if (calendarWatcher) {
      calendarWatcher.stop();
    }

    calendarWatcher = calendar.watchCalendarEvents((events) => {
      // Send updated events to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('calendar-updated', events);
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error starting calendar watch:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-calendar-watch', async (event) => {
  try {
    if (calendarWatcher) {
      calendarWatcher.stop();
      calendarWatcher = null;
    }
    return { success: true };
  } catch (error) {
    console.error('Error stopping calendar watch:', error);
    return { success: false, error: error.message };
  }
});

// Auto-tracking state
let autoTrackingEnabled = false;
let autoTrackingInterval = null;
let lastTrackedUrl = null;

// Function to start auto-tracking
function startAutoTracking() {
  if (autoTrackingInterval) return;

  console.log('Starting auto-tracking...');
  autoTrackingEnabled = true;

  // Check every 10 seconds
  autoTrackingInterval = setInterval(async () => {
    if (!autoTrackingEnabled) return;

    try {
      const browserData = await getCurrentBrowserUrl();
      if (browserData && browserData.url !== lastTrackedUrl) {
        console.log('Auto-captured new page:', browserData.title);
        lastTrackedUrl = browserData.url;

        // Send to renderer
        if (mainWindow) {
          mainWindow.webContents.send('auto-capture-url', browserData);
        }
      }
    } catch (error) {
      console.error('Auto-tracking error:', error);
    }
  }, 10000); // Every 10 seconds
}

// Function to stop auto-tracking
function stopAutoTracking() {
  console.log('Stopping auto-tracking...');
  autoTrackingEnabled = false;
  if (autoTrackingInterval) {
    clearInterval(autoTrackingInterval);
    autoTrackingInterval = null;
  }
  lastTrackedUrl = null;
}

// IPC handlers for auto-tracking
ipcMain.handle('start-auto-tracking', async () => {
  startAutoTracking();
  return { success: true };
});

ipcMain.handle('stop-auto-tracking', async () => {
  stopAutoTracking();
  return { success: true };
});

ipcMain.handle('get-auto-tracking-status', async () => {
  return { enabled: autoTrackingEnabled };
});

// App categorization and productivity scoring
const APP_CATEGORIES = {
  // Development
  'Code': { category: 'development', productivity: 'high' },
  'Visual Studio Code': { category: 'development', productivity: 'high' },
  'Xcode': { category: 'development', productivity: 'high' },
  'Terminal': { category: 'development', productivity: 'high' },
  'iTerm': { category: 'development', productivity: 'high' },
  'iTerm2': { category: 'development', productivity: 'high' },
  'WebStorm': { category: 'development', productivity: 'high' },
  'IntelliJ IDEA': { category: 'development', productivity: 'high' },
  'PyCharm': { category: 'development', productivity: 'high' },
  'Sublime Text': { category: 'development', productivity: 'high' },
  'Cursor': { category: 'development', productivity: 'high' },
  'GitHub Desktop': { category: 'development', productivity: 'high' },

  // Communication
  'Slack': { category: 'communication', productivity: 'medium' },
  'Discord': { category: 'communication', productivity: 'medium' },
  'Microsoft Teams': { category: 'communication', productivity: 'medium' },
  'Zoom': { category: 'communication', productivity: 'medium' },
  'Mail': { category: 'communication', productivity: 'medium' },
  'Messages': { category: 'communication', productivity: 'low' },
  'Telegram': { category: 'communication', productivity: 'low' },
  'WhatsApp': { category: 'communication', productivity: 'low' },

  // Design
  'Figma': { category: 'design', productivity: 'high' },
  'Sketch': { category: 'design', productivity: 'high' },
  'Adobe Photoshop': { category: 'design', productivity: 'high' },
  'Adobe Illustrator': { category: 'design', productivity: 'high' },
  'Adobe XD': { category: 'design', productivity: 'high' },
  'Canva': { category: 'design', productivity: 'medium' },

  // Productivity
  'Notion': { category: 'productivity', productivity: 'high' },
  'Obsidian': { category: 'productivity', productivity: 'high' },
  'Notes': { category: 'productivity', productivity: 'medium' },
  'Things': { category: 'productivity', productivity: 'high' },
  'Todoist': { category: 'productivity', productivity: 'high' },
  'Evernote': { category: 'productivity', productivity: 'medium' },
  'OneNote': { category: 'productivity', productivity: 'medium' },
  'Bear': { category: 'productivity', productivity: 'medium' },
  'Drafts': { category: 'productivity', productivity: 'medium' },

  // Reference/Learning
  'Safari': { category: 'reference', productivity: 'neutral' },
  'Google Chrome': { category: 'reference', productivity: 'neutral' },
  'Firefox': { category: 'reference', productivity: 'neutral' },
  'Arc': { category: 'reference', productivity: 'neutral' },
  'Brave Browser': { category: 'reference', productivity: 'neutral' },
  'Preview': { category: 'reference', productivity: 'neutral' },
  'Books': { category: 'reference', productivity: 'medium' },
  'Kindle': { category: 'reference', productivity: 'medium' },

  // Entertainment
  'Spotify': { category: 'entertainment', productivity: 'neutral' },
  'Music': { category: 'entertainment', productivity: 'neutral' },
  'YouTube': { category: 'entertainment', productivity: 'low' },
  'Netflix': { category: 'entertainment', productivity: 'low' },
  'VLC': { category: 'entertainment', productivity: 'low' },
  'QuickTime Player': { category: 'entertainment', productivity: 'neutral' },
};

// Function to get current active app using AppleScript
async function getCurrentActiveApp() {
  const script = `
    tell application "System Events"
      set frontApp to name of first application process whose frontmost is true
      return frontApp
    end tell
  `;

  try {
    const { stdout } = await execAsync(`osascript -e '${script}'`);
    const appName = stdout.trim();

    if (appName && appName !== 'missing value') {
      const appInfo = APP_CATEGORIES[appName] || { category: 'other', productivity: 'neutral' };
      return {
        appName,
        category: appInfo.category,
        productivityLevel: appInfo.productivity
      };
    }
  } catch (e) {
    console.log('Error getting active app:', e.message);
  }

  return null;
}

// App tracking state
let appTrackingEnabled = false;
let appTrackingInterval = null;
let currentAppSession = null;

// Function to start app tracking
function startAppTracking() {
  if (appTrackingInterval) return;

  console.log('Starting app tracking...');
  appTrackingEnabled = true;

  // Check every 5 seconds
  appTrackingInterval = setInterval(async () => {
    if (!appTrackingEnabled) return;

    try {
      const appData = await getCurrentActiveApp();

      if (!appData) return;

      // If same app, extend current session
      if (currentAppSession && currentAppSession.appName === appData.appName) {
        currentAppSession.endTime = new Date().toISOString();
        currentAppSession.durationMs = new Date(currentAppSession.endTime) - new Date(currentAppSession.startTime);
        return;
      }

      // If different app, save previous session and start new one
      if (currentAppSession) {
        // Only save sessions longer than 10 seconds
        if (currentAppSession.durationMs > 10000) {
          console.log(`App session ended: ${currentAppSession.appName} (${Math.round(currentAppSession.durationMs / 1000)}s)`);

          // Send completed session to renderer
          if (mainWindow) {
            console.log('Sending app-activity event to renderer:', currentAppSession);
            mainWindow.webContents.send('app-activity', currentAppSession);
          } else {
            console.log('ERROR: mainWindow is null, cannot send app-activity event');
          }
        }
      }

      // Start new session
      const now = new Date().toISOString();
      currentAppSession = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        appName: appData.appName,
        category: appData.category,
        productivityLevel: appData.productivityLevel,
        startTime: now,
        endTime: now,
        durationMs: 0
      };

      console.log(`New app session started: ${appData.appName}`);
    } catch (error) {
      console.error('App tracking error:', error);
    }
  }, 5000); // Every 5 seconds
}

// Function to stop app tracking
function stopAppTracking() {
  console.log('Stopping app tracking...');
  appTrackingEnabled = false;

  // Save current session if exists
  if (currentAppSession && currentAppSession.durationMs > 10000) {
    if (mainWindow) {
      mainWindow.webContents.send('app-activity', currentAppSession);
    }
  }

  if (appTrackingInterval) {
    clearInterval(appTrackingInterval);
    appTrackingInterval = null;
  }

  currentAppSession = null;
}

// IPC handlers for app tracking
ipcMain.handle('start-app-tracking', async () => {
  startAppTracking();
  return { success: true };
});

ipcMain.handle('stop-app-tracking', async () => {
  stopAppTracking();
  return { success: true };
});

ipcMain.handle('get-app-tracking-status', async () => {
  return { enabled: appTrackingEnabled };
});

app.whenReady().then(() => {
  createTray();
  createWindow();

  // Register global shortcut: Command+Shift+C to capture current page
  const ret = globalShortcut.register('CommandOrControl+Shift+C', async () => {
    const browserData = await getCurrentBrowserUrl();
    if (browserData) {
      // Send to renderer to fetch and process the page
      if (mainWindow) {
        mainWindow.webContents.send('capture-url', browserData);
        mainWindow.show();
      }

      // Show notification
      new Notification({
        title: 'ReadTrack',
        body: `Capturing: ${browserData.title}`
      }).show();
    } else {
      new Notification({
        title: 'ReadTrack',
        body: 'No active browser window found'
      }).show();
    }
  });

  if (!ret) {
    console.log('Failed to register global shortcut');
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', (e) => {
  // Keep app running even when window is closed
  e.preventDefault();
});
