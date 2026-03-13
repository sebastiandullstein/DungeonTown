# DungeonTown — Build Instructions

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

## Quick Start (Dev Mode)

```bash
npm install
npm start
```

This launches the game in an Electron window at 1280x720.

## Build for Distribution

```bash
# Windows (.exe installer + portable)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (.AppImage)
npm run build:linux

# All platforms
npm run build:all
```

Build output goes to `dist/`.

**Cross-compilation note**: Building for macOS requires a Mac. Windows and Linux
can be cross-compiled from either platform, but native builds are recommended.

## Project Structure

```
├── index.html              ← Game entry point
├── css/style.css           ← Game styles
├── js/
│   ├── assetLoader.js      ← Sprite/image loading system (Assets singleton)
│   ├── tileRenderer.js     ← Dungeon & village tile drawing
│   ├── spriteRenderer.js   ← Player & enemy sprite rendering
│   ├── uiRenderer.js       ← HUD, panels, overlays
│   ├── renderer.js         ← 3-layer canvas compositor
│   ├── game.js             ← Main game loop, scene manager, save/load
│   └── scenes/             ← Title, Village, Dungeon, Shop scenes
├── assets/
│   ├── manifest.js         ← Asset registration (sprites, atlases)
│   ├── entities/           ← PixelLab-generated character sprites
│   │   ├── hero/           ← 4 rotations + 24 walk frames
│   │   ├── skeleton/       ← 4 rotations
│   │   ├── orc/            ← 4 rotations
│   │   ├── rat/            ← 4 rotations
│   │   ├── demon/          ← 4 rotations
│   │   └── beholder/       ← 4 rotations (mapped to game type 'bat')
│   ├── tiles/
│   │   └── dungeon_stone.png  ← 128x128 Wang tileset (16 tiles)
│   └── ui/
│       └── frame.png       ← 800x720 ornate border overlay
├── electron/
│   ├── main.js             ← Electron main process (frameless, 1280x720)
│   └── preload.js          ← Renderer preload (fullscreen API)
├── build/
│   └── icon.png            ← App icon (512x512, replace with real icon)
├── package.json            ← Dependencies + build config
├── CLAUDE.md               ← Architecture & coding conventions
└── dist/                   ← Build output (gitignored)
```

## localStorage / Save Data

The game uses `localStorage` for save data. This works natively in Electron's
renderer process — no migration or bridging is needed.

**Where Electron stores it:**
- Windows: `%APPDATA%/DungeonTown/Local Storage/`
- macOS: `~/Library/Application Support/DungeonTown/Local Storage/`
- Linux: `~/.config/DungeonTown/Local Storage/`

Save data persists across app restarts. It is tied to the Electron app's user
data directory, not the browser profile.

**Caveat**: If you clear the app's user data directory, saves are lost. A future
improvement could export saves to a user-visible file, but for now localStorage
is reliable and sufficient.

## Steam Integration (Future)

The Electron wrapper is configured for Steam overlay compatibility:
- GPU sandbox is disabled (`--disable-gpu-sandbox`)
- Single-instance lock prevents duplicate windows

To add Steamworks SDK later:
1. Install `steamworks.js` or `greenworks` as a native dependency
2. Expose Steam API calls via `electron/preload.js` using `contextBridge`
3. Initialize Steam in `electron/main.js` before creating the window

## Dev Tools

In dev mode (`npm start`), press **Ctrl+Shift+I** to toggle DevTools.
DevTools are disabled in packaged builds.

## Icon

Replace `build/icon.png` with your final 512x512 game icon.
For Windows builds, electron-builder auto-generates .ico from the PNG.
For macOS, it generates .icns.

## Frameless Window

The window launches without a native title bar (`frame: false`). The game
canvas fills the entire window. To restore the native frame, set `frame: true`
in `electron/main.js`.
