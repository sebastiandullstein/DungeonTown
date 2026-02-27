// Village Scene - management view
const VillageScene = {
    mode: 'explore', // explore, build, manage, recruit, assign_villager
    selectedOption: 0,
    buildList: [],
    cursor: { x: 40, y: 25 },
    villageMap: null,  // 50×80 array of tile-info objects
    managingBuilding: null,

    // Building positions (world tile coords)
    BUILDING_POSITIONS: [
        // Core / resource buildings
        { x: 40, y: 25, type: 'townhall' },
        { x: 22, y: 20, type: 'farm' },
        { x: 58, y: 20, type: 'lumbermill' },
        { x: 22, y: 30, type: 'quarry' },
        { x: 58, y: 30, type: 'barracks' },
        { x: 40, y: 35, type: 'inn' },
        { x: 40, y: 15, type: 'walls' },
        // Weapon & armor shops (west side)
        { x: 14, y: 18, type: 'weaponsmith' },
        { x: 14, y: 25, type: 'blacksmith' },
        { x: 14, y: 32, type: 'armorsmith' },
        // Buff / heal / accessory shops (east side)
        { x: 66, y: 18, type: 'jewelry' },
        { x: 66, y: 25, type: 'pharmacy' },
        { x: 66, y: 32, type: 'apothecary' },
        { x: 66, y: 39, type: 'foodstore' },
    ],

    // Viewport (mirrors dungeon scene — 25×18 scrolling window)
    viewX: 0,
    viewY: 0,
    viewW: 25,
    viewH: 18,

    init() {},

    enter() {
        this.mode = 'explore';
        this.generateVillageMap();
        this._centerOnCursor();
        Game.notify('You return to DungeonTown.', '#0f0');
        Audio.startMusic('village');
    },

    exit() {},

    _centerOnCursor() {
        const r = Game.renderer;
        this.viewW = r.viewportCols;
        this.viewH = r.viewportRows;
        this.viewX = Math.floor(this.cursor.x - this.viewW / 2);
        this.viewY = Math.floor(this.cursor.y - this.viewH / 2);
        this.viewX = Math.max(0, Math.min(80 - this.viewW, this.viewX));
        this.viewY = Math.max(0, Math.min(50 - this.viewH, this.viewY));
    },

    generateVillageMap() {
        this.villageMap = [];
        for (let y = 0; y < 50; y++) {
            this.villageMap[y] = [];
            for (let x = 0; x < 80; x++) {
                const rnd = Math.random();
                const variant = (x * 7 + y * 13) % 4; // deterministic variant
                this.villageMap[y][x] = { type: 'grass', variant };
            }
        }

        // Horizontal path (y=24..26)
        for (let x = 10; x < 70; x++) {
            for (let dy = -1; dy <= 1; dy++) {
                const y = 25 + dy;
                this.villageMap[y][x] = { type: 'path' };
            }
        }
        // Vertical path (x=39..41)
        for (let y = 10; y < 40; y++) {
            for (let dx = -1; dx <= 1; dx++) {
                const x = 40 + dx;
                this.villageMap[y][x] = { type: 'path' };
            }
        }

        // Trees around edges
        for (let x = 0; x < 80; x++) {
            for (let y = 0; y < 5; y++) {
                if (Math.random() < 0.4) this.villageMap[y][x] = { type: 'tree' };
            }
            for (let y = 44; y < 50; y++) {
                if (Math.random() < 0.4) this.villageMap[y][x] = { type: 'tree' };
            }
        }

        // Dungeon entrance (2×2 footprint centred on x=40, y=10)
        this.villageMap[9][39]  = { type: 'dungeon_entrance' };
        this.villageMap[9][40]  = { type: 'dungeon_entrance' };
        this.villageMap[10][39] = { type: 'dungeon_entrance' };
        this.villageMap[10][40] = { type: 'dungeon_entrance' };

        this.placeBuildings();
    },

    placeBuildings() {
        const village = Game.state.village;
        for (const pos of this.BUILDING_POSITIONS) {
            const building = village.getBuilding(pos.type);
            const def = BUILDING_DEFS[pos.type];
            if (building) {
                // 3×3 footprint — mark all tiles so they draw ground only (building drawn in 2nd pass)
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const tx = pos.x + dx, ty = pos.y + dy;
                        if (tx >= 0 && tx < 80 && ty >= 0 && ty < 50) {
                            this.villageMap[ty][tx] = { type: 'building_ground' };
                        }
                    }
                }
                // Anchor tile carries building data (for tooltip detection, not tile rendering)
                this.villageMap[pos.y][pos.x] = {
                    type: 'building',
                    buildingType: pos.type,
                    def,
                    level: building.level,
                };
            } else if (village.isBuildingUnlocked(pos.type)) {
                // 3×3 footprint for empty plot
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const tx = pos.x + dx, ty = pos.y + dy;
                        if (tx >= 0 && tx < 80 && ty >= 0 && ty < 50) {
                            this.villageMap[ty][tx] = { type: 'building_ground' };
                        }
                    }
                }
                this.villageMap[pos.y][pos.x] = {
                    type: 'empty_plot',
                    buildingType: pos.type,
                    def,
                };
            }
        }
    },

    getBuildingAtCursor() {
        const village = Game.state.village;
        for (const pos of this.BUILDING_POSITIONS) {
            const dist = Math.abs(this.cursor.x - pos.x) + Math.abs(this.cursor.y - pos.y);
            if (dist <= 3) {
                return {
                    pos,
                    type: pos.type,
                    building: village.getBuilding(pos.type),
                    def: BUILDING_DEFS[pos.type],
                };
            }
        }
        // Dungeon entrance at x=40, y=10 (±2 tiles)
        if (Math.abs(this.cursor.x - 40) + Math.abs(this.cursor.y - 10) <= 2) {
            return { type: 'dungeon_entrance' };
        }
        return null;
    },

    update(dt) {
        const village = Game.state.village;
        village.updateProduction(dt);

        // Sync viewport dims
        const r = Game.renderer;
        this.viewW = r.viewportCols;
        this.viewH = r.viewportRows;

        // UI menus (inventory / character)
        if (UI.isOpen()) {
            UI.update(dt);
            return;
        }

        if (Input.wasPressed('i') || Input.wasPressed('I')) { UI.toggle('inventory'); return; }
        if (Input.wasPressed('c') || Input.wasPressed('C')) { UI.toggle('character'); return; }

        if (this.mode === 'explore') {
            this.updateExplore(dt);
        } else if (this.mode === 'build') {
            this.updateBuildMenu(dt);
        } else if (this.mode === 'manage') {
            this.updateManage(dt);
        } else if (this.mode === 'assign_villager') {
            this.updateAssignMenu(dt);
        } else if (this.mode === 'recruit') {
            this.updateRecruit(dt);
        }
    },

    updateExplore(dt) {
        if (Input.wasPressed('ArrowLeft') || Input.wasPressed('a') || Input.wasPressed('A')) this.cursor.x -= 2;
        if (Input.wasPressed('ArrowRight') || Input.wasPressed('d') || Input.wasPressed('D')) this.cursor.x += 2;
        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) this.cursor.y -= 2;
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) this.cursor.y += 2;
        this.cursor.x = Math.max(1, Math.min(78, this.cursor.x));
        this.cursor.y = Math.max(1, Math.min(48, this.cursor.y));

        // Scroll viewport to follow cursor
        this._centerOnCursor();

        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            const target = this.getBuildingAtCursor();
            if (target) {
                if (target.type === 'dungeon_entrance') {
                    Game.switchScene('dungeon');
                    return;
                }
                if (target.building) {
                    if (target.def.isShop) {
                        Game.switchScene('shop', { buildingType: target.type });
                    } else {
                        this.managingBuilding = target;
                        this.mode = 'manage';
                        this.selectedOption = 0;
                    }
                } else if (Game.state.village.isBuildingUnlocked(target.type)) {
                    Game.state.village.buildOrUpgrade(target.type);
                    this.generateVillageMap();
                }
            }
        }

        if (Input.wasPressed('b') || Input.wasPressed('B')) {
            this.mode = 'build';
            this.selectedOption = 0;
            this.buildList = this.getAvailableBuilds();
        }

        if (Input.wasPressed('r') || Input.wasPressed('R')) {
            const inn = Game.state.village.getBuilding('inn');
            if (inn) {
                this.mode = 'recruit';
                this.selectedOption = 0;
            } else {
                Game.notify('Build an Inn first!', '#f00');
            }
        }

        if (Input.wasPressed('F5')) {
            Game.save();
        }
    },

    getAvailableBuilds() {
        const village = Game.state.village;
        const list = [];
        for (const [type, def] of Object.entries(BUILDING_DEFS)) {
            const existing = village.getBuilding(type);
            if (existing) {
                if (existing.level < def.maxLevel) {
                    list.push({ type, action: 'upgrade', level: existing.level + 1, cost: def.costs[existing.level], def });
                }
            } else if (village.isBuildingUnlocked(type)) {
                list.push({ type, action: 'build', level: 1, cost: def.costs[0], def });
            }
        }
        return list;
    },

    updateBuildMenu(dt) {
        if (Input.wasPressed('Escape') || Input.wasPressed('b') || Input.wasPressed('B')) {
            this.mode = 'explore';
            return;
        }
        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
        }
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
            this.selectedOption = Math.min(this.buildList.length - 1, this.selectedOption + 1);
        }
        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            const item = this.buildList[this.selectedOption];
            if (item) {
                Game.state.village.buildOrUpgrade(item.type);
                this.buildList = this.getAvailableBuilds();
                this.generateVillageMap();
            }
        }
    },

    updateManage(dt) {
        if (Input.wasPressed('Escape')) { this.mode = 'explore'; return; }

        const target = this.managingBuilding;
        if (!target) { this.mode = 'explore'; return; }

        const options = [];
        if (target.building.level < target.def.maxLevel) options.push('upgrade');
        if (target.def.job) options.push('assign');
        if (target.def.isShop) options.push('shop');
        options.push('close');

        this.selectedOption = Math.min(this.selectedOption, options.length - 1);

        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
        }
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
            this.selectedOption = Math.min(options.length - 1, this.selectedOption + 1);
        }

        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            const opt = options[this.selectedOption];
            if (opt === 'upgrade') {
                Game.state.village.buildOrUpgrade(target.type);
                this.managingBuilding.building = Game.state.village.getBuilding(target.type);
                this.generateVillageMap();
            } else if (opt === 'assign') {
                this.mode = 'assign_villager';
                this.selectedOption = 0;
            } else if (opt === 'shop') {
                Game.switchScene('shop', { buildingType: target.type });
            } else {
                this.mode = 'explore';
            }
        }
    },

    updateAssignMenu(dt) {
        const village = Game.state.village;
        if (village.villagers.length > 0) {
            this.selectedOption = Math.min(this.selectedOption, village.villagers.length - 1);
            if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
                this.selectedOption = Math.max(0, this.selectedOption - 1);
            }
            if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
                this.selectedOption = Math.min(village.villagers.length - 1, this.selectedOption + 1);
            }
            if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
                const target = this.managingBuilding;
                if (target) village.assignVillager(target.type, this.selectedOption);
                this.generateVillageMap();
                this.mode = 'manage';
            }
        }
        if (Input.wasPressed('Escape')) this.mode = 'manage';
    },

    updateRecruit(dt) {
        if (Input.wasPressed('Escape')) { this.mode = 'explore'; return; }

        const village = Game.state.village;
        const max = village.recruits.length;
        this.selectedOption = Math.min(this.selectedOption, Math.max(0, max - 1));

        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
        }
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
            this.selectedOption = Math.min(max - 1, this.selectedOption + 1);
        }
        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            village.recruitVillager(this.selectedOption);
        }
    },

    render(r) {
        // ── Pass 1: ground tiles (grass, path, tree, building_ground) ──
        for (let row = 0; row < this.viewH; row++) {
            for (let col = 0; col < this.viewW; col++) {
                const mx = col + this.viewX;
                const my = row + this.viewY;
                if (mx < 0 || mx >= 80 || my < 0 || my >= 50) continue;
                const tile = this.villageMap[my] && this.villageMap[my][mx];
                if (tile) {
                    r.putVillageTile(col, row, tile);
                }
            }
        }

        // ── Pass 2: buildings rendered ON TOP (3×3 centered on anchor) ──
        const village = Game.state.village;
        for (const pos of this.BUILDING_POSITIONS) {
            const building = village.getBuilding(pos.type);
            const def = BUILDING_DEFS[pos.type];
            const col = pos.x - this.viewX;
            const row = pos.y - this.viewY;
            if (building) {
                // Draw 3×3 building centred on anchor (col-1, row-1)
                r.putBuilding(col - 1, row - 1, def, building.level);
            } else if (village.isBuildingUnlocked(pos.type)) {
                // Draw empty plot marker
                r.putEmptyPlot(col - 1, row - 1, def);
            }
        }

        // ── Player hero sprite (cursor position = hero position in village) ──
        const cursorCol = this.cursor.x - this.viewX;
        const cursorRow = this.cursor.y - this.viewY;
        r.putPlayer(cursorCol, cursorRow, Game.state.player);

        // ── Cursor ring drawn on top of hero ──
        r.putCursor(cursorCol, cursorRow);

        // ── Info tooltip near cursor ──
        const target = this.getBuildingAtCursor();
        if (target && this.mode === 'explore') {
            let lines = [];
            if (target.type === 'dungeon_entrance') {
                lines = ['Dungeon Entrance', '[Enter] Descend'];
            } else if (target.building) {
                lines = [
                    `${target.def.name}  Lv.${target.building.level}`,
                    '[Enter] Manage',
                    target.building.villager ? `Worker: ${target.building.villager}` : '',
                ].filter(Boolean);
            } else if (Game.state.village.isBuildingUnlocked(target.type)) {
                const cost = target.def.costs[0];
                const costStr = cost ? Object.entries(cost).map(([k, v]) => `${k}:${v}`).join(' ') : '';
                lines = [`Build: ${target.def.name}`, costStr, '[Enter] Build'].filter(Boolean);
            }
            if (lines.length) {
                r.drawInfoTooltip(lines[0], lines.slice(1), cursorCol, cursorRow);
            }
        }

        // ── Village HUD (resource bar + player gold) ──
        r.drawVillageHUD(Game.state.village, Game.state.player);

        // ── Mode-specific overlay menus ──
        if (this.mode === 'build') {
            r.drawBuildMenu(this.buildList, this.selectedOption, Game.state.village);
        } else if (this.mode === 'manage') {
            const target = this.managingBuilding;
            if (target) {
                const options = [];
                if (target.building.level < target.def.maxLevel) options.push({ label: 'Upgrade', key: 'upgrade' });
                if (target.def.job) options.push({ label: 'Assign Worker', key: 'assign' });
                if (target.def.isShop) options.push({ label: 'Visit Shop', key: 'shop' });
                options.push({ label: 'Close', key: 'close' });
                r.drawManageMenu(target, options, this.selectedOption);
            }
        } else if (this.mode === 'assign_villager') {
            r.drawAssignMenu(Game.state.village.villagers, this.selectedOption);
        } else if (this.mode === 'recruit') {
            r.drawRecruitMenu(
                Game.state.village.recruits,
                Game.state.village.villagers,
                Game.state.village.maxVillagers,
                this.selectedOption,
                Game.state.village.resources.food || 0
            );
        }

        // ── Inventory / Character overlays ──
        if (UI.isOpen()) {
            const player = Game.state.player;
            if (UI.currentMenu === 'inventory') {
                r.drawInventoryPanel(player, UI.selectedIndex);
            } else if (UI.currentMenu === 'character') {
                r.drawCharacterPanel(player, UI.selectedIndex);
            }
        }
    },
};
