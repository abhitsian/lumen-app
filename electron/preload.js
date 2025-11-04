const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded!');

contextBridge.exposeInMainWorld('electron', {
  store: {
    get: (key) => ipcRenderer.invoke('get-store-value', key),
    set: (key, value) => ipcRenderer.invoke('set-store-value', key, value),
    delete: (key) => ipcRenderer.invoke('delete-store-value', key),
    clear: () => ipcRenderer.invoke('clear-store')
  },
  capturePage: (data) => ipcRenderer.invoke('capture-page', data),
  captureCurrentPage: () => ipcRenderer.invoke('capture-current-page'),
  onCaptureUrl: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('capture-url', handler);
    return () => ipcRenderer.removeListener('capture-url', handler);
  },
  onAutoCaptureUrl: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('auto-capture-url', handler);
    return () => ipcRenderer.removeListener('auto-capture-url', handler);
  },
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  startAutoTracking: () => ipcRenderer.invoke('start-auto-tracking'),
  stopAutoTracking: () => ipcRenderer.invoke('stop-auto-tracking'),
  getAutoTrackingStatus: () => ipcRenderer.invoke('get-auto-tracking-status'),
  startAppTracking: () => ipcRenderer.invoke('start-app-tracking'),
  stopAppTracking: () => ipcRenderer.invoke('stop-app-tracking'),
  getAppTrackingStatus: () => ipcRenderer.invoke('get-app-tracking-status'),
  onAppActivity: (callback) => {
    const handler = (event, data) => {
      console.log('Preload received app-activity event:', data);
      callback(data);
    };
    ipcRenderer.on('app-activity', handler);
    console.log('Registered app-activity listener in preload');
    return () => ipcRenderer.removeListener('app-activity', handler);
  },
  // Calendar functions
  calendar: {
    getEvents: (daysAhead) => ipcRenderer.invoke('get-calendar-events', daysAhead),
    startWatch: () => ipcRenderer.invoke('start-calendar-watch'),
    stopWatch: () => ipcRenderer.invoke('stop-calendar-watch'),
    onUpdated: (callback) => {
      const handler = (event, events) => callback(events);
      ipcRenderer.on('calendar-updated', handler);
      return () => ipcRenderer.removeListener('calendar-updated', handler);
    }
  },
  platform: process.platform
});

console.log('window.electron exposed!');
