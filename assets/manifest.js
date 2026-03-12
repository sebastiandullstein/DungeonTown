// Asset Manifest — registers all sprite sheets and images
// Loaded after assetLoader.js, before renderer scripts
// Assets are loaded during Game.init() via Assets.loadAll()

// ─── UI ──────────────────────────────────────────────────────────────────────
Assets.register('ui_frame', 'assets/ui/frame.png');
Assets.register('hud_bg', 'assets/ui/hud_bg.png');
Assets.register('title_bg', 'assets/ui/title_bg.png');

// ─── DUNGEON TILES (one atlas per theme) ─────────────────────────────────────
// Each theme sheet layout: 32x32 cells
// Row 0: floor variants (0-7)
// Row 1: wall variants (0-3), door, stairs_down, stairs_up, water_0
// Row 2: water_1, water_2, water_3, chest, shrine, merchant, cursed_chest, fountain
// Row 3: fountain_dry, prisoner

// Helper: generate standard dungeon tile regions for a theme
function _dungeonTileRegions() {
    const S = 32;
    const r = {};
    // Floor variants (row 0)
    for (let i = 0; i < 8; i++) r['floor_' + i] = { x: i * S, y: 0, w: S, h: S };
    // Wall variants (row 1, cols 0-3)
    for (let i = 0; i < 4; i++) r['wall_' + i] = { x: i * S, y: S, w: S, h: S };
    // Row 1 continued
    r.door        = { x: 4 * S, y: S, w: S, h: S };
    r.stairs_down = { x: 5 * S, y: S, w: S, h: S };
    r.stairs_up   = { x: 6 * S, y: S, w: S, h: S };
    r.water_0     = { x: 7 * S, y: S, w: S, h: S };
    // Row 2
    r.water_1      = { x: 0,     y: 2 * S, w: S, h: S };
    r.water_2      = { x: S,     y: 2 * S, w: S, h: S };
    r.water_3      = { x: 2 * S, y: 2 * S, w: S, h: S };
    r.chest        = { x: 3 * S, y: 2 * S, w: S, h: S };
    r.shrine       = { x: 4 * S, y: 2 * S, w: S, h: S };
    r.merchant     = { x: 5 * S, y: 2 * S, w: S, h: S };
    r.cursed_chest = { x: 6 * S, y: 2 * S, w: S, h: S };
    r.fountain     = { x: 7 * S, y: 2 * S, w: S, h: S };
    // Row 3
    r.fountain_dry = { x: 0,   y: 3 * S, w: S, h: S };
    r.prisoner     = { x: S,   y: 3 * S, w: S, h: S };
    return r;
}

Assets.registerAtlas('tiles_stone',    'assets/tiles/dungeon_stone.png',    _dungeonTileRegions());
Assets.registerAtlas('tiles_frost',    'assets/tiles/dungeon_frost.png',    _dungeonTileRegions());
Assets.registerAtlas('tiles_magma',    'assets/tiles/dungeon_magma.png',    _dungeonTileRegions());
Assets.registerAtlas('tiles_abyss',    'assets/tiles/dungeon_abyss.png',    _dungeonTileRegions());
Assets.registerAtlas('tiles_infernal', 'assets/tiles/dungeon_infernal.png', _dungeonTileRegions());

// ─── VILLAGE TILES ───────────────────────────────────────────────────────────
Assets.registerAtlas('village_terrain', 'assets/tiles/village_terrain.png', {
    grass_0: { x: 0,   y: 0, w: 32, h: 32 },
    grass_1: { x: 32,  y: 0, w: 32, h: 32 },
    grass_2: { x: 64,  y: 0, w: 32, h: 32 },
    grass_3: { x: 96,  y: 0, w: 32, h: 32 },
    path:    { x: 128, y: 0, w: 32, h: 32 },
    tree:    { x: 160, y: 0, w: 32, h: 32 },
    bldg_ground: { x: 192, y: 0, w: 32, h: 32 },
});

// Village buildings: 96x96 each (3x3 tiles), 4 per row
Assets.registerAtlas('village_buildings', 'assets/tiles/village_buildings.png', {
    town_hall:  { x: 0,   y: 0,   w: 96, h: 96 },
    farm:       { x: 96,  y: 0,   w: 96, h: 96 },
    lumber:     { x: 192, y: 0,   w: 96, h: 96 },
    quarry:     { x: 288, y: 0,   w: 96, h: 96 },
    blacksmith: { x: 0,   y: 96,  w: 96, h: 96 },
    apothecary: { x: 96,  y: 96,  w: 96, h: 96 },
    barracks:   { x: 192, y: 96,  w: 96, h: 96 },
    inn:        { x: 288, y: 96,  w: 96, h: 96 },
    walls:      { x: 0,   y: 192, w: 96, h: 96 },
    smithy:     { x: 96,  y: 192, w: 96, h: 96 },
    tavern:     { x: 192, y: 192, w: 96, h: 96 },
    temple:     { x: 288, y: 192, w: 96, h: 96 },
    warehouse:  { x: 0,   y: 288, w: 96, h: 96 },
    weaponsmith:{ x: 96,  y: 288, w: 96, h: 96 },
    armorsmith: { x: 192, y: 288, w: 96, h: 96 },
    jewelry:    { x: 288, y: 288, w: 96, h: 96 },
    food_store: { x: 0,   y: 384, w: 96, h: 96 },
    pharmacy:   { x: 96,  y: 384, w: 96, h: 96 },
});

Assets.register('dungeon_entrance', 'assets/tiles/dungeon_entrance.png');

// ─── ENTITIES ────────────────────────────────────────────────────────────────
// Player: 4 frames per row, rows: idle, walk, attack
Assets.registerAtlas('player', 'assets/entities/player.png', {
    idle_0:    { x: 0,   y: 0,  w: 32, h: 32 },
    idle_1:    { x: 32,  y: 0,  w: 32, h: 32 },
    walk_0:    { x: 0,   y: 32, w: 32, h: 32 },
    walk_1:    { x: 32,  y: 32, w: 32, h: 32 },
    walk_2:    { x: 64,  y: 32, w: 32, h: 32 },
    walk_3:    { x: 96,  y: 32, w: 32, h: 32 },
    attack_0:  { x: 0,   y: 64, w: 32, h: 32 },
    attack_1:  { x: 32,  y: 64, w: 32, h: 32 },
    attack_2:  { x: 64,  y: 64, w: 32, h: 32 },
});

// Enemies: each type gets one row (32x32 per frame)
// Columns: idle_0, idle_1, attack_0, attack_1
Assets.registerAtlas('enemies', 'assets/entities/enemies.png', {
    rat_idle_0:      { x: 0,   y: 0,   w: 32, h: 32 },
    rat_idle_1:      { x: 32,  y: 0,   w: 32, h: 32 },
    rat_attack_0:    { x: 64,  y: 0,   w: 32, h: 32 },
    bat_idle_0:      { x: 0,   y: 32,  w: 32, h: 32 },
    bat_idle_1:      { x: 32,  y: 32,  w: 32, h: 32 },
    bat_attack_0:    { x: 64,  y: 32,  w: 32, h: 32 },
    skeleton_idle_0: { x: 0,   y: 64,  w: 32, h: 32 },
    skeleton_idle_1: { x: 32,  y: 64,  w: 32, h: 32 },
    skeleton_attack_0:{ x: 64, y: 64,  w: 32, h: 32 },
    orc_idle_0:      { x: 0,   y: 96,  w: 32, h: 32 },
    orc_idle_1:      { x: 32,  y: 96,  w: 32, h: 32 },
    orc_attack_0:    { x: 64,  y: 96,  w: 32, h: 32 },
    demon_idle_0:    { x: 0,   y: 128, w: 32, h: 32 },
    demon_idle_1:    { x: 32,  y: 128, w: 32, h: 32 },
    demon_attack_0:  { x: 64,  y: 128, w: 32, h: 32 },
    dragon_idle_0:   { x: 0,   y: 160, w: 32, h: 32 },
    dragon_idle_1:   { x: 32,  y: 160, w: 32, h: 32 },
    dragon_attack_0: { x: 64,  y: 160, w: 32, h: 32 },
    cursed_idle_0:   { x: 0,   y: 192, w: 32, h: 32 },
    stone_idle_0:    { x: 0,   y: 224, w: 32, h: 32 },
    lich_idle_0:     { x: 0,   y: 256, w: 32, h: 32 },
    inferno_idle_0:  { x: 0,   y: 288, w: 32, h: 32 },
    warlord_idle_0:  { x: 0,   y: 320, w: 32, h: 32 },
    vampire_idle_0:  { x: 0,   y: 352, w: 32, h: 32 },
    shadow_idle_0:   { x: 0,   y: 384, w: 32, h: 32 },
    chaos_idle_0:    { x: 0,   y: 416, w: 32, h: 32 },
    malphas_idle_0:  { x: 0,   y: 448, w: 32, h: 32 },
});

// Village NPCs
Assets.registerAtlas('npcs', 'assets/entities/npcs.png', {
    elder:  { x: 0,  y: 0, w: 32, h: 32 },
    scout:  { x: 32, y: 0, w: 32, h: 32 },
    healer: { x: 64, y: 0, w: 32, h: 32 },
});

// ─── ITEMS ───────────────────────────────────────────────────────────────────
Assets.registerAtlas('items', 'assets/items/items.png', {
    // Weapons (row 0)
    dagger:      { x: 0,   y: 0, w: 32, h: 32 },
    short_sword: { x: 32,  y: 0, w: 32, h: 32 },
    longsword:   { x: 64,  y: 0, w: 32, h: 32 },
    battle_axe:  { x: 96,  y: 0, w: 32, h: 32 },
    war_hammer:  { x: 128, y: 0, w: 32, h: 32 },
    flame_blade: { x: 160, y: 0, w: 32, h: 32 },
    frost_edge:  { x: 192, y: 0, w: 32, h: 32 },
    doom_sword:  { x: 224, y: 0, w: 32, h: 32 },
    // Armor (row 1)
    cloth_shirt:   { x: 0,   y: 32, w: 32, h: 32 },
    leather_armor: { x: 32,  y: 32, w: 32, h: 32 },
    chain_mail:    { x: 64,  y: 32, w: 32, h: 32 },
    plate_armor:   { x: 96,  y: 32, w: 32, h: 32 },
    dragon_scale:  { x: 128, y: 32, w: 32, h: 32 },
    mythril_mail:  { x: 160, y: 32, w: 32, h: 32 },
    // Helmets (row 2)
    cap:         { x: 0,  y: 64, w: 32, h: 32 },
    iron_helm:   { x: 32, y: 64, w: 32, h: 32 },
    steel_helm:  { x: 64, y: 64, w: 32, h: 32 },
    knight_helm: { x: 96, y: 64, w: 32, h: 32 },
    // Boots (row 2 continued)
    sandals:       { x: 128, y: 64, w: 32, h: 32 },
    leather_boots: { x: 160, y: 64, w: 32, h: 32 },
    iron_boots:    { x: 192, y: 64, w: 32, h: 32 },
    swift_boots:   { x: 224, y: 64, w: 32, h: 32 },
    // Accessories (row 3)
    iron_ring:      { x: 0,   y: 96, w: 32, h: 32 },
    ruby_ring:      { x: 32,  y: 96, w: 32, h: 32 },
    diamond_ring:   { x: 64,  y: 96, w: 32, h: 32 },
    wooden_charm:   { x: 96,  y: 96, w: 32, h: 32 },
    silver_amulet:  { x: 128, y: 96, w: 32, h: 32 },
    golden_amulet:  { x: 160, y: 96, w: 32, h: 32 },
    // Consumables (row 4)
    potion_hp:    { x: 0,   y: 128, w: 32, h: 32 },
    potion_mp:    { x: 32,  y: 128, w: 32, h: 32 },
    food:         { x: 64,  y: 128, w: 32, h: 32 },
    gold:         { x: 96,  y: 128, w: 32, h: 32 },
    soul_shard:   { x: 128, y: 128, w: 32, h: 32 },
});
