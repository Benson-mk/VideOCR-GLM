import { contextBridge, ipcRenderer } from 'electron';

// Valid channels for IPC communication
const VALID_SEND_CHANNELS = ['backend-status', 'cli-progress'];
const VALID_INVOKE_CHANNELS = [
  'get-app-version',
  'get-app-path',
  'get-python-cli-path',
  'select-directory',
  'select-file',
  'save-file',
  'show-message-box'
];

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Invoke methods (promise-based)
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getPythonCliPath: () => ipcRenderer.invoke('get-python-cli-path'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFile: (options) => ipcRenderer.invoke('save-file', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // Subscribe to events
  on: (channel, callback) => {
    if (VALID_SEND_CHANNELS.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    console.warn(`[Preload] Invalid channel: ${channel}`);
    return () => {};
  },
  
  // Remove all listeners for a channel
  removeAllListeners: (channel) => {
    if (VALID_SEND_CHANNELS.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
  
  // Check if running in production
  isProduction: () => process.env.NODE_ENV !== 'development',
  
  // Platform info
  platform: process.platform
});

console.log('[Preload] ✓ Preload script loaded successfully');