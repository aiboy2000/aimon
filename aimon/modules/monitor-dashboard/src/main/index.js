const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Store = require('electron-store');

// Initialize electron store for settings
const store = new Store();

let mainWindow;
let tray;

// Enable live reload for Electron in development
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', '..', 'public', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  });

  // Load the app
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '..', '..', 'build', 'index.html')}`
  );

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent window from closing, minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, '..', '..', 'public', 'tray-icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Settings',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('navigate', '/settings');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('AI Activity Monitor');
  tray.setContextMenu(contextMenu);

  // Show window on tray icon click
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createTray();

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

// IPC handlers
ipcMain.handle('get-settings', async () => {
  return store.get('settings', {
    apiUrl: 'http://localhost:8080',
    apiKey: '',
    refreshInterval: 5000,
    theme: 'light',
    notifications: true
  });
});

ipcMain.handle('save-settings', async (event, settings) => {
  store.set('settings', settings);
  return { success: true };
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Handle deep links
app.setAsDefaultProtocolClient('ai-monitor');

// Export for testing
module.exports = { createWindow, createTray };