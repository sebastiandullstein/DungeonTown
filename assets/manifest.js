// Asset Manifest — registers all sprite images
// Loaded after assetLoader.js, before renderer scripts
// Assets are loaded during Game.init() via Assets.loadAll()
// Files that don't exist will silently fail (procedural fallback)

// ─── UI ──────────────────────────────────────────────────────────────────────
Assets.register('ui_frame', 'assets/ui/frame.png');
Assets.register('hud_bg', 'assets/ui/hud_bg.png');
Assets.register('title_bg', 'assets/ui/title_bg.png');

// ─── PLAYER (individual files per direction/frame) ───────────────────────────
Assets.register('hero_south', 'assets/entities/hero/rotations/south.png');
Assets.register('hero_east',  'assets/entities/hero/rotations/east.png');
Assets.register('hero_north', 'assets/entities/hero/rotations/north.png');
Assets.register('hero_west',  'assets/entities/hero/rotations/west.png');
// Walk animation frames (6 per direction)
for (let i = 0; i < 6; i++) {
    const pad = String(i).padStart(3, '0');
    Assets.register('hero_walk_south_' + i, 'assets/entities/hero/animations/walk/south/frame_' + pad + '.png');
    Assets.register('hero_walk_east_' + i,  'assets/entities/hero/animations/walk/east/frame_' + pad + '.png');
    Assets.register('hero_walk_north_' + i, 'assets/entities/hero/animations/walk/north/frame_' + pad + '.png');
    Assets.register('hero_walk_west_' + i,  'assets/entities/hero/animations/walk/west/frame_' + pad + '.png');
}

// ─── ENEMIES (individual files per direction) ────────────────────────────────
// Map: game enemy type → asset folder name
const ENEMY_ASSET_MAP = {
    skeleton: 'skeleton',
    orc: 'orc',
    rat: 'rat',
    demon: 'demon',
    bat: 'beholder',   // game type 'bat' uses beholder sprite
    dragon: 'dragon',
};
const DIRECTIONS = ['south', 'east', 'north', 'west'];
for (const [gameType, assetFolder] of Object.entries(ENEMY_ASSET_MAP)) {
    for (const dir of DIRECTIONS) {
        Assets.register(gameType + '_' + dir, 'assets/entities/' + assetFolder + '/rotations/' + dir + '.png');
    }
    // Walk animation frames (if they exist)
    for (let i = 0; i < 6; i++) {
        const pad = String(i).padStart(3, '0');
        for (const dir of DIRECTIONS) {
            Assets.register(gameType + '_walk_' + dir + '_' + i, 'assets/entities/' + assetFolder + '/animations/walk/' + dir + '/frame_' + pad + '.png');
        }
    }
}

// ─── DUNGEON TILESETS (Wang tile atlases) ────────────────────────────────────
// Stone theme: 16 Wang tiles in 4×4 grid (128×128 PNG, each tile 32×32)
// Corners: lower=floor, upper=wall. Wang index = NW*8 + NE*4 + SW*2 + SE*1
Assets.registerAtlas('tiles_stone', 'assets/tiles/dungeon_stone.png', {
    // Pure floor (wang_0: all corners lower)
    floor_0: { x: 64, y: 32, w: 32, h: 32 },
    floor_1: { x: 64, y: 32, w: 32, h: 32 },
    floor_2: { x: 64, y: 32, w: 32, h: 32 },
    floor_3: { x: 64, y: 32, w: 32, h: 32 },
    floor_4: { x: 64, y: 32, w: 32, h: 32 },
    floor_5: { x: 64, y: 32, w: 32, h: 32 },
    floor_6: { x: 64, y: 32, w: 32, h: 32 },
    floor_7: { x: 64, y: 32, w: 32, h: 32 },
    // Pure wall (wang_15: all corners upper)
    wall_0: { x: 0, y: 96, w: 32, h: 32 },
    wall_1: { x: 0, y: 96, w: 32, h: 32 },
    wall_2: { x: 0, y: 96, w: 32, h: 32 },
    wall_3: { x: 0, y: 96, w: 32, h: 32 },
    // Special tiles reuse floor
    door:        { x: 64, y: 32, w: 32, h: 32 },
    stairs_down: { x: 64, y: 32, w: 32, h: 32 },
    stairs_up:   { x: 64, y: 32, w: 32, h: 32 },
    chest:       { x: 64, y: 32, w: 32, h: 32 },
    // Wang transition tiles (for future neighbor-aware rendering)
    wang_0:  { x: 64, y: 32,  w: 32, h: 32 },  // all floor
    wang_1:  { x: 96, y: 32,  w: 32, h: 32 },  // SE=upper
    wang_2:  { x: 64, y: 64,  w: 32, h: 32 },  // SW=upper
    wang_3:  { x: 32, y: 64,  w: 32, h: 32 },  // SW+SE=upper
    wang_4:  { x: 64, y: 0,   w: 32, h: 32 },  // NE=upper
    wang_5:  { x: 96, y: 64,  w: 32, h: 32 },  // NE+SE=upper
    wang_6:  { x: 0,  y: 32,  w: 32, h: 32 },  // NE+SW=upper
    wang_7:  { x: 96, y: 96,  w: 32, h: 32 },  // NE+SW+SE=upper
    wang_8:  { x: 32, y: 32,  w: 32, h: 32 },  // NW=upper
    wang_9:  { x: 64, y: 96,  w: 32, h: 32 },  // NW+SE=upper
    wang_10: { x: 32, y: 0,   w: 32, h: 32 },  // NW+SW=upper
    wang_11: { x: 0,  y: 64,  w: 32, h: 32 },  // NW+SW+SE=upper
    wang_12: { x: 96, y: 0,   w: 32, h: 32 },  // NW+NE=upper
    wang_13: { x: 0,  y: 0,   w: 32, h: 32 },  // NW+NE+SW=upper (missing SE)
    wang_14: { x: 32, y: 96,  w: 32, h: 32 },  // NW+NE+SE=upper (missing SW)
    wang_15: { x: 0,  y: 96,  w: 32, h: 32 },  // all wall
});

// Placeholder atlases for other themes (will be populated when tilesets are generated)
// Assets.registerAtlas('tiles_frost', 'assets/tiles/dungeon_frost.png', { ... });
// Assets.registerAtlas('tiles_magma', 'assets/tiles/dungeon_magma.png', { ... });
// Assets.registerAtlas('tiles_abyss', 'assets/tiles/dungeon_abyss.png', { ... });
// Assets.registerAtlas('tiles_infernal', 'assets/tiles/dungeon_infernal.png', { ... });

// ─── VILLAGE ─────────────────────────────────────────────────────────────────
Assets.register('dungeon_entrance', 'assets/tiles/dungeon_entrance.png');
