const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

// Steam overlay compatibility: disable GPU sandbox
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');

// Keep a global reference to avoid garbage collection
let mainWindow = null;
const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    title: 'DungeonTown',
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the game
  mainWindow.loadFile('index.html');

  // Show window once ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Dev tools: Ctrl+Shift+I in dev mode only
  if (isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.shift && input.key === 'I') {
        mainWindow.webContents.toggleDevTools();
      }
    });
  }

  // Prevent the window title from being overridden by <title> tag
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock — only one game window at a time
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}
