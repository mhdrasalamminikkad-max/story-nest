const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');

let mainWindow = null;
let isChildModeActive = false;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    // Start in normal mode - kiosk mode will be enabled when Child Mode activates
    fullscreen: false,
    kiosk: false,
  });

  // Load the app
  // In production, load from built files
  // In development, load from dev server (adjust port as needed)
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: serve from dist/public
    mainWindow.loadFile(path.join(__dirname, '../dist/public/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Enable kiosk mode and fullscreen for Child Mode
 */
function enableChildMode() {
  if (!mainWindow || isChildModeActive) return;
  
  isChildModeActive = true;
  
  try {
    // Enter kiosk mode (fullscreen, no window controls)
    mainWindow.setKiosk(true);
    console.log('[Electron] Kiosk mode enabled');
    
    mainWindow.setFullScreen(true);
    console.log('[Electron] Fullscreen enabled');
    
    // Block Alt+F4 and window close
    mainWindow.setClosable(false);
    console.log('[Electron] Window close disabled');
    
    // Register global shortcuts to block
    const shortcuts = [
      'Alt+F4',
      'CommandOrControl+Q',
      'CommandOrControl+W',
      'Escape',
      'F11',
      'F12',
      'CommandOrControl+Shift+I'
    ];
    
    shortcuts.forEach(shortcut => {
      try {
        globalShortcut.register(shortcut, () => {
          console.log(`[Electron] ${shortcut} blocked in Child Mode`);
          return false;
        });
      } catch (err) {
        console.error(`[Electron] Failed to register ${shortcut}:`, err);
      }
    });
    
    console.log('[Electron] Child Mode enabled - kiosk mode active with keyboard blocking');
  } catch (err) {
    console.error('[Electron] Error enabling Child Mode:', err);
    isChildModeActive = false;
  }
}

/**
 * Disable kiosk mode and restore normal window
 */
function disableChildMode() {
  if (!mainWindow || !isChildModeActive) return;
  
  try {
    isChildModeActive = false;
    
    // Exit kiosk mode
    mainWindow.setKiosk(false);
    console.log('[Electron] Kiosk mode disabled');
    
    mainWindow.setFullScreen(false);
    console.log('[Electron] Fullscreen disabled');
    
    // Re-enable window close
    mainWindow.setClosable(true);
    console.log('[Electron] Window close re-enabled');
    
    // Unregister blocked shortcuts
    globalShortcut.unregisterAll();
    console.log('[Electron] Global shortcuts unregistered');
    
    console.log('[Electron] Child Mode disabled - normal mode restored');
  } catch (err) {
    console.error('[Electron] Error disabling Child Mode:', err);
    isChildModeActive = true; // Reset flag on error
  }
}

/**
 * Validate parent password
 * PRODUCTION: Replace with secure password validation
 * This is a placeholder - use secure storage/encryption in production
 */
function validatePassword(password) {
  // PLACEHOLDER: Replace with production authentication
  return password === '1234';
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Clean up global shortcuts
  globalShortcut.unregisterAll();
});

// IPC handlers for Child Mode
ipcMain.handle('enter-child-mode', () => {
  enableChildMode();
  return true;
});

ipcMain.handle('exit-child-mode', async (event, password) => {
  const isValid = validatePassword(password);
  if (isValid) {
    disableChildMode();
    return true;
  }
  return false;
});

// Prevent window close during Child Mode
app.on('before-quit', (event) => {
  if (isChildModeActive) {
    event.preventDefault();
    console.log('[Electron] Quit blocked - Child Mode is active');
  }
});


