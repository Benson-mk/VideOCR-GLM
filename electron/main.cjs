const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let backendServer;

// Configure Electron to fix cache warnings on Windows
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-dev-shm-usage');

/**
 * Create the main application window
 */
function createWindow() {
  const isDev = process.env.NODE_ENV === 'development';
  
  const iconPath = path.join(__dirname, '../assets/icon.png');
  
  console.log('[Electron] [ICON] __dirname:', __dirname);
  console.log('[Electron] [ICON] Icon path:', iconPath);
  console.log('[Electron] [ICON] Icon exists:', fs.existsSync(iconPath));
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    icon: iconPath,
    show: false // Don't show until ready
  });

  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  // Show window when ready to prevent blank screen
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Start the backend server
 */
function startBackend() {
  const isDev = process.env.NODE_ENV === 'development';
  
  // Resolve backend path - simple structure with asar disabled
  let backendPath;
  let workingDir;
  
  if (isDev) {
    // In development, use relative path from project root
    backendPath = path.join(__dirname, '../backend/dist/index.js');
    workingDir = path.join(__dirname, '..');
  } else {
    // In production with asar disabled:
    // - Backend is in resources/app/backend/dist/
    // - Dependencies are in resources/app/node_modules/
    backendPath = path.join(__dirname, '../backend/dist/index.js');
    // Set working directory to app directory so Node.js can find node_modules
    workingDir = path.join(__dirname, '..');
  }
  
  console.log('[Electron] ========== Backend Initialization ==========');
  console.log('[Electron] NODE_ENV:', process.env.NODE_ENV);
  console.log('[Electron] Is Development:', isDev);
  console.log('[Electron] Backend path:', backendPath);
  console.log('[Electron] Backend exists:', fs.existsSync(backendPath));
  console.log('[Electron] Working directory:', workingDir);
  console.log('[Electron] App path:', app.getAppPath());
  console.log('[Electron] Resources path:', process.resourcesPath);
  console.log('[Electron] ============================================');
  
  // Check if backend file exists
  if (!fs.existsSync(backendPath)) {
    console.error('[Electron] [ERROR] Backend file not found:', backendPath);
    console.error('[Electron] Please ensure backend is built before running electron-builder');
    return;
  }
  
  // Change working directory to ensure Node.js can find node_modules
  try {
    process.chdir(workingDir);
    console.log('[Electron] [OK] Changed working directory to:', process.cwd());
  } catch (error) {
    console.error('[Electron] [WARNING] Failed to change working directory:', error.message);
  }
  
  // Require the backend module (runs in the same process)
  try {
    console.log('[Electron] [LOADING] Loading backend module...');
    backendServer = require(backendPath);
    console.log('[Electron] [OK] Backend started successfully');
    
    // Notify renderer that backend is ready
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backend-status', { 
        status: 'ready', 
        message: 'Backend initialized' 
      });
    }
  } catch (error) {
    console.error('[Electron] [ERROR] Failed to start backend:', error);
    console.error('[Electron] Stack:', error.stack);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backend-status', { 
        status: 'error', 
        message: error.message 
      });
    }
  }
}

/**
 * Initialize the application
 */
app.whenReady().then(async () => {
  console.log('[Electron] [START] Application starting...');
  
  // Start backend first
  startBackend();
  
  // Wait for backend to be ready
  console.log('[Electron] [WAIT] Waiting for backend to initialize...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Create main window
  console.log('[Electron] [WINDOW] Creating main window...');
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  console.log('[Electron] [OK] Application ready');
});

/**
 * Clean up when all windows are closed
 */
app.on('window-all-closed', () => {
  console.log('[Electron] [STOP] All windows closed, shutting down...');
  
  // Stop backend when all windows are closed
  if (backendServer && typeof backendServer.close === 'function') {
    console.log('[Electron] [LOADING] Closing backend server...');
    backendServer.close();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Clean up before app quits
 */
app.on('before-quit', (event) => {
  console.log('[Electron] [STOP] Before quit event triggered...');
  
  // Ensure backend is stopped before quitting
  if (backendServer && typeof backendServer.close === 'function') {
    console.log('[Electron] [LOADING] Closing backend server...');
    try {
      backendServer.close();
    } catch (error) {
      console.error('[Electron] [WARNING] Error closing backend:', error.message);
    }
  }
});

// ============== IPC Handlers ==============

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

ipcMain.handle('get-python-cli-path', () => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    return path.join(__dirname, '../VideOCR-GLM-CLI/videocr_glm_cli.py');
  } else {
    // In production, CLI is bundled in extraResources
    const resourcesPath = process.resourcesPath || path.dirname(app.getAppPath());
    return path.join(resourcesPath, 'VideOCR-GLM-CLI', 'dist', 'videocr_glm_cli.exe');
  }
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Directory'
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: 'Select File',
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'flv', 'wmv'] },
      { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

ipcMain.handle('save-file', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options.title || 'Save File',
    defaultPath: options.defaultPath,
    filters: options.filters || [
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePath;
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: options.type || 'info',
    title: options.title || 'Message',
    message: options.message,
    detail: options.detail,
    buttons: options.buttons || ['OK'],
    defaultId: options.defaultId || 0,
    cancelId: options.cancelId || -1
  });
  
  return result.response;
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Electron] [CRASH] Uncaught Exception:', error);
  console.error('[Electron] Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Electron] [CRASH] Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('[Electron] [OK] Main process initialization complete');