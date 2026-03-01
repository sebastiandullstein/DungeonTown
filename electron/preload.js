// Preload script runs in renderer context before page scripts.
// With contextIsolation: true and nodeIntegration: false,
// the game's vanilla JS runs in a safe sandbox.
//
// localStorage works natively in Electron's renderer process —
// no bridging needed.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
    isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),
});
