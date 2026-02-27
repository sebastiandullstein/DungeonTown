// Preload script runs in renderer context before page scripts.
// With contextIsolation: true and nodeIntegration: false,
// the game's vanilla JS runs in a safe sandbox.
//
// localStorage works natively in Electron's renderer process —
// no bridging needed. This preload is intentionally minimal.
//
// If future Node/Electron APIs are needed (e.g. file system access,
// Steam SDK integration), expose them here via contextBridge:
//
// const { contextBridge } = require('electron');
// contextBridge.exposeInMainWorld('electronAPI', {
//   example: () => { ... }
// });
