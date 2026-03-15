// Village Scene - management view with interactive building panels
const VillageScene = {
    mode: 'explore', // explore, paused, settings, build, manage, recruit, assign_villager, smithy, tavern, temple, warehouse
    selectedOption: 0,
    _pauseIndex: 0,
    _settingsIndex: 0,
    buildList: [],
    cursor: { x: 40, y: 25 },
    villageMap: null,  // 50×80 array of tile-info objects
    managingBuilding: null,

    // Panel sub-state for smithy/warehouse
    _panelTab: 0,        // 0=weapons, 1=armor (smithy); 0=inventory (warehouse)
    _panelScroll: 0,

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
        // Interactive buildings (diamond around town hall)
        { x: 33, y: 21, type: 'smithy' },
        { x: 47, y: 21, type: 'tavern' },
        { x: 33, y: 29, type: 'temple' },
        { x: 47, y: 29, type: 'warehouse' },
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

    // Decorative NPCs
    _npcs: [],
    _npcTimer: 0,

    // Building pulse after death return
    _buildingPulse: 0,

    // Viewport (mirrors dungeon scene — 25×18 scrolling window)
    viewX: 0,
    viewY: 0,
    viewW: 25,
    viewH: 18,

    // Smithy cached items
    _smithyItems: null,

    init() {},

    enter(data) {
        this.mode = 'explore';
        this.generateVillageMap();
        this._quickReenter = false;

        if (data && data.fromDeath) {
            // Death return
            this.cursor.x = 40;
            this.cursor.y = 25;
            this._buildingPulse = 2.0;
            this._quickReenter = true;
            this._quickReenterTimer = 4.0; // show prompt for 4 seconds
            Audio.play('villageReturn');
            this._showDeathReactions(data.runStats, data.goldLost);
        } else if (data && data.fromEscape) {
            // Successful escape — escapeJingle already played in dungeon summary
            this.cursor.x = 40;
            this.cursor.y = 25;
            this._quickReenter = true;
            this._quickReenterTimer = 4.0;
            Audio.play('villageReturn');
            this._showEscapeReactions(data.runStats, data.runRating);
        } else {
            Game.notify('You return to DungeonTown.', '#0f0');
        }

        // Check for floor milestones
        this._checkMilestones();

        this._centerOnCursor();
        Audio.startMusic('village');
        this._initNPCs();
    },

    exit() {},

    _initNPCs() {
        this._npcs = [
            { x: 36, y: 25, dx: 1, dy: 0, color: '#8a6040', timer: 0, speed: 1.5, name: 'Elder Maren', role: 'elder' },
            { x: 44, y: 25, dx: -1, dy: 0, color: '#6080a0', timer: 0, speed: 2.0, name: 'Scout Fynn', role: 'scout' },
            { x: 40, y: 22, dx: 0, dy: 1, color: '#a06060', timer: 0, speed: 1.8, name: 'Healer Sila', role: 'healer' },
        ];
    },

    _getNearNPC() {
        for (const npc of this._npcs) {
            const dist = Math.abs(this.cursor.x - npc.x) + Math.abs(this.cursor.y - npc.y);
            if (dist <= 2) return npc;
        }
        return null;
    },

    _getNPCDialogue(npc) {
        const floor = Game.state.maxFloorReached || 1;
        const deaths = Game.state.totalDeaths || 0;
        const victory = Game.state.victory;
        const villagers = Game.state.village.villagers.length;
        const player = Game.state.player;

        if (npc.role === 'elder') {
            if (victory) return '"You freed us all. DungeonTown will never forget."';
            if (floor >= 40) return '"The Demon Lord\'s presence weakens. Press on!"';
            if (floor >= 25) return '"The deep floors hold terrible secrets... and great power."';
            if (floor >= 10) return '"The dungeon respects you now. The village prospers."';
            if (deaths >= 5) return '"Each fall teaches the town something new. We grow stronger."';
            return '"The dungeon beneath us holds our children captive. Will you descend?"';
        }
        if (npc.role === 'scout') {
            if (victory) return '"The dungeon is quiet now... but for how long?"';
            if (floor >= 30) return '"I\'ve mapped the upper floors. Below that... only you know."';
            if (floor >= 15) return `"Floor ${floor} is your record. The frost caves are treacherous."`;
            if (player.level >= 5) return '"You\'re getting stronger. The Smithy has new gear for you."';
            if (deaths >= 3) return '"I\'ve been watching the entrance. Something stirs below floor 10."';
            return '"I scout the dungeon entrance daily. Monsters grow bolder."';
        }
        if (npc.role === 'healer') {
            if (victory) return '"The curse is lifted. But some wounds... take longer to heal."';
            if (player.hp < player.maxHp) return '"You\'re wounded. Rest here a moment before your next descent."';
            if (deaths >= 10) return `"${deaths} returns from the brink. Your resilience is remarkable."`;
            if (floor >= 20) return '"The Temple blessings will serve you well in the deep floors."';
            if (villagers >= 3) return '"More hands means more herbs. Visit the Temple when you can."';
            return '"Potions and blessings keep adventurers alive. Don\'t forget them."';
        }
        return '"..."';
    },

    _showDeathReactions(runStats, goldLost) {
        const stats = runStats || {};
        const deaths = Game.state.totalDeaths || 0;
        const floor = stats.deathFloor || stats.floorsReached || 1;
        const kills = stats.kills || 0;
        const cause = stats.deathCause || 'the dungeon';

        // Context-aware villager reaction (delayed 0.5s via notify queue)
        const reactions = [];
        if (deaths === 1) {
            reactions.push({ text: 'First fall? The dungeon tests everyone.', color: '#c8a050' });
            reactions.push({ text: 'The Smithy and Tavern can help you prepare.', color: '#80b0c0' });
        } else if (floor >= 40) {
            reactions.push({ text: `Floor ${floor}... You were so close.`, color: '#c8a050' });
        } else if (floor >= 25) {
            reactions.push({ text: `The deep floors claim many. You fought well.`, color: '#c8a050' });
        } else if (kills >= 30) {
            reactions.push({ text: `${kills} slain! The town feels safer already.`, color: '#c8a050' });
        } else if (floor <= 3 && deaths > 3) {
            reactions.push({ text: 'Try the Tavern buffs before your next run.', color: '#80b0c0' });
        } else {
            // Rotating generic reactions
            const generic = [
                'The dungeon is patient. So must we be.',
                'Every fall teaches something new.',
                'Rest up. The town needs you strong.',
                'The deeper you go, the more we prosper.',
                'Your courage inspires the villagers.',
            ];
            reactions.push({ text: generic[deaths % generic.length], color: '#c8a050' });
        }

        // Gold lost notification
        if (goldLost > 0) {
            Game.notify(`Lost ${goldLost} gold in the dungeon.`, '#cc6644');
        }

        // Show reactions with slight delay
        for (const r of reactions) {
            Game.notify(r.text, r.color);
        }

        // Death milestone events
        if (deaths === 1) {
            Game.notify('Tip: Soul Shards (purple) are never lost!', '#c040ff');
        } else if (deaths === 5) {
            Game.notify('The village grows stronger with each return.', '#40c0e0');
        } else if (deaths === 10) {
            Game.notify('Ten falls. Ten lessons. The dungeon respects persistence.', '#ffd700');
        } else if (deaths % 25 === 0) {
            Game.notify(`${deaths} deaths. A legend in the making.`, '#ffd700');
        }
    },

    _showEscapeReactions(runStats, runRating) {
        const stats = runStats || {};
        const floor = stats.floorsReached || 1;
        const kills = stats.kills || 0;
        const gold = stats.goldEarned || 0;
        const bosses = stats.bossesKilled || 0;

        Game.notify('You escaped the dungeon safely!', '#40e0e0');

        // Context-aware villager reactions
        if (floor >= 40) {
            Game.notify(`Floor ${floor}! The village celebrates your bravery.`, '#ffd700');
        } else if (bosses >= 2) {
            Game.notify(`${bosses} bosses felled! Your legend grows.`, '#ffd700');
        } else if (kills >= 50) {
            Game.notify(`${kills} slain! The town sleeps safer tonight.`, '#c8a050');
        } else if (gold >= 200) {
            Game.notify(`${gold} gold earned. The coffers overflow!`, '#ffd020');
        } else if (floor >= 20) {
            Game.notify('The deep floors respect your strength.', '#c8a050');
        } else if (floor >= 10) {
            Game.notify('Another successful expedition. The dungeon weakens.', '#c8a050');
        } else if (kills >= 10) {
            Game.notify(`${kills} monsters cleared. Steady progress!`, '#c8a050');
        }

        // Positive milestone for total escapes
        const escapes = (Game.state.totalEscapes || 0);
        Game.state.totalEscapes = escapes + 1;
        if (Game.state.totalEscapes === 1) {
            Game.notify('First successful escape! The villagers cheer.', '#40ff80');
        } else if (Game.state.totalEscapes === 10) {
            Game.notify('10 expeditions survived. A seasoned adventurer!', '#ffd700');
        } else if (Game.state.totalEscapes % 25 === 0) {
            Game.notify(`${Game.state.totalEscapes} runs completed. Living legend.`, '#ffd700');
        }
    },

    _checkMilestones() {
        const ms = Game.state.milestones || {};
        const floor = Game.state.maxFloorReached || 1;
        const deaths = Game.state.totalDeaths || 0;
        let changed = false;

        if (floor >= 10 && !ms.floor10) {
            ms.floor10 = true; changed = true;
            Game.notify('Milestone: Floor 10 reached! The frost caves await.', '#40e0e0');
            Game.notify('The village feels safer. New dangers stir below.', '#c8a050');
        }
        if (floor >= 25 && !ms.floor25) {
            ms.floor25 = true; changed = true;
            Game.notify('Milestone: Floor 25! You have entered the Abyss.', '#c040ff');
            Game.notify('The villagers whisper of an ancient evil below...', '#c8a050');
        }
        if (floor >= 40 && !ms.floor40) {
            ms.floor40 = true; changed = true;
            Game.notify('Milestone: Floor 40! The Infernal depths beckon.', '#ff4040');
            Game.notify('The Demon Lord knows you are coming.', '#ff8040');
        }
        if (Game.state.victory && !ms.victory) {
            ms.victory = true; changed = true;
            Game.notify('The curse is broken! DungeonTown is free!', '#ffd700');
            Game.notify('Your children return. The nightmare ends.', '#ffd700');
        }

        if (changed) {
            Game.state.milestones = ms;
            Game.save();
        }
    },

    _updateNPCs(dt) {
        for (const npc of this._npcs) {
            npc.timer -= dt;
            if (npc.timer <= 0) {
                npc.timer = npc.speed + Math.random() * 1.0;
                // Random walk, prefer paths
                if (Math.random() < 0.4) {
                    // Change direction
                    const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
                    const d = dirs[Math.floor(Math.random() * dirs.length)];
                    npc.dx = d.x;
                    npc.dy = d.y;
                }
                const nx = npc.x + npc.dx;
                const ny = npc.y + npc.dy;
                if (nx > 12 && nx < 68 && ny > 8 && ny < 42) {
                    const tile = this.villageMap[ny] && this.villageMap[ny][nx];
                    if (tile && (tile.type === 'path' || tile.type === 'grass')) {
                        npc.x = nx;
                        npc.y = ny;
                    }
                }
            }
        }
    },

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
                const variant = (x * 7 + y * 13) % 4;
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
        // Extra paths to smithy/tavern/temple/warehouse
        for (let x = 33; x <= 47; x++) {
            this.villageMap[21][x] = { type: 'path' };
            this.villageMap[29][x] = { type: 'path' };
        }
        for (let y = 21; y <= 29; y++) {
            this.villageMap[y][33] = { type: 'path' };
            this.villageMap[y][47] = { type: 'path' };
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
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const tx = pos.x + dx, ty = pos.y + dy;
                        if (tx >= 0 && tx < 80 && ty >= 0 && ty < 50) {
                            this.villageMap[ty][tx] = { type: 'building_ground' };
                        }
                    }
                }
                this.villageMap[pos.y][pos.x] = {
                    type: 'building',
                    buildingType: pos.type,
                    def,
                    level: building.level,
                };
            } else if (village.isBuildingUnlocked(pos.type)) {
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

    _getInteractiveTarget() {
        const target = this.getBuildingAtCursor();
        if (target && target.def && target.def.isInteractive && target.building) {
            return target;
        }
        return null;
    },

    _enterDungeon() {
        if (Game.state.unlockedFloors && Game.state.unlockedFloors.length > 1) {
            Game.switchScene('dungeon', { floorSelect: true });
        } else {
            Game.switchScene('dungeon');
        }
    },

    _refreshSmithyItems() {
        const village = Game.state.village;
        const smithy = village.getBuilding('smithy');
        const level = smithy ? smithy.level : 1;
        const maxTier = [3, 5, 8][level - 1] || 3;
        const weapons = ItemGenerator.getShopItems('weapons', maxTier).slice(0, 6);
        const armors = ItemGenerator.getShopItems('armors', maxTier).slice(0, 6);
        this._smithyItems = { weapons, armors };
    },

    update(dt) {
        const village = Game.state.village;
        village.updateProduction(dt);

        // Decrement player moveTimer for walk animation in village
        const p = Game.state.player;
        if (p.moveTimer > 0) p.moveTimer = Math.max(0, p.moveTimer - dt);

        // Tick building pulse
        if (this._buildingPulse > 0) this._buildingPulse = Math.max(0, this._buildingPulse - dt);

        // Tick NPCs
        this._updateNPCs(dt);

        // Sync viewport dims
        const r = Game.renderer;
        this.viewW = r.viewportCols;
        this.viewH = r.viewportRows;

        // Pause menu
        if (this.mode === 'paused') {
            const pauseOptions = ['Resume', 'Settings', 'Save Game', 'Main Menu'];
            if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
                this._pauseIndex = Math.max(0, this._pauseIndex - 1);
            }
            if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
                this._pauseIndex = Math.min(pauseOptions.length - 1, this._pauseIndex + 1);
            }
            if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
                if (this._pauseIndex === 0) {
                    this.mode = 'explore';
                } else if (this._pauseIndex === 1) {
                    this._settingsIndex = 0;
                    this.mode = 'settings';
                } else if (this._pauseIndex === 2) {
                    Game.save();
                    this.mode = 'explore';
                } else if (this._pauseIndex === 3) {
                    Game.switchScene('title');
                }
                return;
            }
            if (Input.wasPressed('Escape') || Input.wasPressed('p') || Input.wasPressed('P')) {
                this.mode = 'explore';
            }
            return;
        }

        // Settings panel (from pause)
        if (this.mode === 'settings') {
            this._updateVillageSettings();
            return;
        }

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
        } else if (this.mode === 'smithy') {
            this.updateSmithyPanel(dt);
        } else if (this.mode === 'tavern') {
            this.updateTavernPanel(dt);
        } else if (this.mode === 'temple') {
            this.updateTemplePanel(dt);
        } else if (this.mode === 'warehouse') {
            this.updateWarehousePanel(dt);
        }
    },

    updateExplore(dt) {
        // Quick re-enter dungeon prompt
        if (this._quickReenter) {
            this._quickReenterTimer -= dt;
            if (this._quickReenterTimer <= 0) {
                this._quickReenter = false;
            } else if (Input.wasPressed('r') || Input.wasPressed('R')) {
                this._quickReenter = false;
                this._enterDungeon();
                return;
            }
        }

        // Pause menu
        if (Input.wasPressed('Escape') || Input.wasPressed('p') || Input.wasPressed('P')) {
            this._pauseIndex = 0;
            this.mode = 'paused';
            return;
        }

        const prevCX = this.cursor.x, prevCY = this.cursor.y;
        if (Input.wasPressed('ArrowLeft') || Input.wasPressed('a') || Input.wasPressed('A')) this.cursor.x -= 2;
        if (Input.wasPressed('ArrowRight') || Input.wasPressed('d') || Input.wasPressed('D')) this.cursor.x += 2;
        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) this.cursor.y -= 2;
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) this.cursor.y += 2;
        this.cursor.x = Math.max(1, Math.min(78, this.cursor.x));
        this.cursor.y = Math.max(1, Math.min(48, this.cursor.y));

        // Trigger walk animation + facing when cursor moved
        if (this.cursor.x !== prevCX || this.cursor.y !== prevCY) {
            const p = Game.state.player;
            p.moveTimer = 0.25; // brief walk anim
            const dx = this.cursor.x - prevCX, dy = this.cursor.y - prevCY;
            if (Math.abs(dx) >= Math.abs(dy)) {
                p.facing = { x: dx > 0 ? 1 : -1, y: 0 };
            } else {
                p.facing = { x: 0, y: dy > 0 ? 1 : -1 };
            }
        }

        this._centerOnCursor();

        // E key: NPC dialogue or enter interactive buildings
        if (Input.wasPressed('e') || Input.wasPressed('E')) {
            const nearNPC = this._getNearNPC();
            if (nearNPC) {
                const line = this._getNPCDialogue(nearNPC);
                Game.notify(`${nearNPC.name}: ${line}`, '#e0d0a0');
                return;
            }
            const iTarget = this._getInteractiveTarget();
            if (iTarget) {
                const panel = iTarget.def.interactPanel;
                this.mode = panel;
                this.selectedOption = 0;
                this._panelTab = 0;
                this._panelScroll = 0;
                if (panel === 'smithy') this._refreshSmithyItems();
                return;
            }
            // Also allow E for dungeon entrance
            if (this.getBuildingAtCursor()?.type === 'dungeon_entrance') {
                this._enterDungeon();
                return;
            }
        }

        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            const target = this.getBuildingAtCursor();
            if (target) {
                if (target.type === 'dungeon_entrance') {
                    this._enterDungeon();
                    return;
                }
                // Interactive buildings also respond to Enter
                if (target.def && target.def.isInteractive && target.building) {
                    const panel = target.def.interactPanel;
                    this.mode = panel;
                    this.selectedOption = 0;
                    this._panelTab = 0;
                    this._panelScroll = 0;
                    if (panel === 'smithy') this._refreshSmithyItems();
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

    _updateVillageSettings() {
        const items = ['masterVolume', 'sfxVolume', 'musicVolume', 'fullscreen', 'assistMode'];
        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
            this._settingsIndex = Math.max(0, this._settingsIndex - 1);
        }
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
            this._settingsIndex = Math.min(items.length - 1, this._settingsIndex + 1);
        }
        const key = items[this._settingsIndex];
        if (key === 'fullscreen') {
            if (Input.wasPressed('Enter') || Input.wasPressed(' ') || Input.wasPressed('ArrowLeft') || Input.wasPressed('ArrowRight')) {
                Game.toggleFullscreen();
            }
        } else if (key === 'assistMode') {
            if (Input.wasPressed('Enter') || Input.wasPressed(' ') || Input.wasPressed('ArrowLeft') || Input.wasPressed('ArrowRight')) {
                Game.settings.assistMode = !Game.settings.assistMode;
                Game.saveSettings();
            }
        } else {
            const step = 0.05;
            if (Input.wasPressed('ArrowLeft') || Input.wasPressed('a') || Input.wasPressed('A')) {
                Game.settings[key] = Math.max(0, Math.round((Game.settings[key] - step) * 100) / 100);
                Audio.setVolume(Game.settings.masterVolume, Game.settings.sfxVolume, Game.settings.musicVolume);
                Game.saveSettings();
            }
            if (Input.wasPressed('ArrowRight') || Input.wasPressed('d') || Input.wasPressed('D')) {
                Game.settings[key] = Math.min(1, Math.round((Game.settings[key] + step) * 100) / 100);
                Audio.setVolume(Game.settings.masterVolume, Game.settings.sfxVolume, Game.settings.musicVolume);
                Game.saveSettings();
            }
        }
        if (Input.wasPressed('Escape')) {
            this._pauseIndex = 1;
            this.mode = 'paused';
        }
    },

    // ── Panel update handlers ────────────────────────────────────────────────

    updateSmithyPanel(dt) {
        if (Input.wasPressed('Escape')) { this.mode = 'explore'; return; }

        const items = this._smithyItems;
        if (!items) { this.mode = 'explore'; return; }

        // Tab switch: Tab or Left/Right
        if (Input.wasPressed('Tab')) {
            this._panelTab = (this._panelTab + 1) % 3; // 0=weapons, 1=armor, 2=upgrade
            this.selectedOption = 0;
        }

        let listLen;
        if (this._panelTab === 0) listLen = items.weapons.length;
        else if (this._panelTab === 1) listLen = items.armors.length;
        else listLen = 1; // upgrade option

        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
        }
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
            this.selectedOption = Math.min(Math.max(0, listLen - 1), this.selectedOption + 1);
        }

        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            const player = Game.state.player;
            if (this._panelTab === 2) {
                // Upgrade weapon
                const wep = player.equipment.weapon;
                if (!wep) { Game.notify('No weapon equipped!', '#f00'); return; }
                const goldCost = 10 + (wep.stats.atk || 0) * 5;
                const ironCost = 2 + Math.floor((wep.stats.atk || 0) / 2);
                const village = Game.state.village;
                if (player.gold < goldCost) { Game.notify(`Need ${goldCost} gold!`, '#f00'); return; }
                if ((village.resources.iron || 0) < ironCost) { Game.notify(`Need ${ironCost} iron ore!`, '#f00'); return; }
                player.gold -= goldCost;
                village.resources.iron -= ironCost;
                wep.stats.atk = (wep.stats.atk || 0) + 1;
                wep.name = wep.name.replace(/ \+\d+$/, '') + ` +${wep.stats.atk - 3}`;
                Game.notify(`Weapon upgraded! ATK +1`, '#0f0');
            } else {
                const list = this._panelTab === 0 ? items.weapons : items.armors;
                const item = list[this.selectedOption];
                if (!item) return;
                if (player.gold < item.value) { Game.notify('Not enough gold!', '#f00'); return; }
                if (player.inventory.length >= player.maxInventory) { Game.notify('Inventory full!', '#f00'); return; }
                const cat = this._panelTab === 0 ? 'weapons' : 'armors';
                const bought = ItemGenerator.createItem(item, cat);
                player.gold -= item.value;
                player.addToInventory(bought);
                Game.notify(`Bought ${item.name} for ${item.value} gold`, '#0f0');
            }
        }
    },

    updateTavernPanel(dt) {
        if (Input.wasPressed('Escape')) { this.mode = 'explore'; return; }

        const buffKeys = Object.keys(TAVERN_BUFFS);
        this.selectedOption = Math.min(this.selectedOption, buffKeys.length - 1);

        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
        }
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
            this.selectedOption = Math.min(buffKeys.length - 1, this.selectedOption + 1);
        }

        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            const player = Game.state.player;
            const key = buffKeys[this.selectedOption];
            const buff = TAVERN_BUFFS[key];
            if (!buff) return;

            // Check if already active
            if (player.tavernBuffs.includes(key)) {
                Game.notify('Already active!', '#f80');
                return;
            }
            if (player.gold < buff.cost) {
                Game.notify('Not enough gold!', '#f00');
                return;
            }
            player.gold -= buff.cost;
            player.tavernBuffs.push(key);
            Game.notify(`${buff.name} activated!`, '#0f0');
        }
    },

    updateTemplePanel(dt) {
        if (Input.wasPressed('Escape')) { this.mode = 'explore'; return; }

        const blessingKeys = Object.keys(TEMPLE_BLESSINGS);
        this.selectedOption = Math.min(this.selectedOption, blessingKeys.length - 1);

        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
        }
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
            this.selectedOption = Math.min(blessingKeys.length - 1, this.selectedOption + 1);
        }

        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            const player = Game.state.player;
            const key = blessingKeys[this.selectedOption];
            const blessing = TEMPLE_BLESSINGS[key];
            if (!blessing) return;

            if (player.blessings[key]) {
                Game.notify('Already purchased!', '#f80');
                return;
            }
            if ((player.soulShards || 0) < blessing.cost) {
                Game.notify('Not enough Soul Shards!', '#f00');
                return;
            }
            player.soulShards -= blessing.cost;
            player.blessings[key] = true;
            // Recalculate HP
            player.maxHp = player.getMaxHp();
            if (player.hp > player.maxHp) player.hp = player.maxHp;
            Game.notify(`${blessing.name} bestowed!`, '#c040ff');
        }
    },

    updateWarehousePanel(dt) {
        if (Input.wasPressed('Escape')) { this.mode = 'explore'; return; }

        const player = Game.state.player;
        const maxIdx = Math.max(0, player.inventory.length - 1);
        this.selectedOption = Math.min(this.selectedOption, maxIdx);

        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
        }
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
            this.selectedOption = Math.min(maxIdx, this.selectedOption + 1);
        }

        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            const item = player.inventory[this.selectedOption];
            if (!item) return;
            if (item.slot) {
                player.equip(item);
            } else if (item.type === 'potion') {
                player.usePotion(item.subtype);
            } else if (item.type === 'food') {
                player.useFood();
            }
        }

        if (Input.wasPressed('x') || Input.wasPressed('X')) {
            const item = player.inventory[this.selectedOption];
            if (item) {
                player.inventory.splice(this.selectedOption, 1);
                Game.notify(`Dropped ${item.name}`, '#f80');
                this.selectedOption = Math.min(this.selectedOption, Math.max(0, player.inventory.length - 1));
            }
        }
    },

    getAvailableBuilds() {
        const village = Game.state.village;
        const list = [];
        for (const [type, def] of Object.entries(BUILDING_DEFS)) {
            // Skip interactive buildings from build menu (they're always pre-built)
            if (def.isInteractive) continue;
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
        // ── Pass 1: ground tiles ──
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

        // ── Pass 2: buildings ──
        const village = Game.state.village;
        for (const pos of this.BUILDING_POSITIONS) {
            const building = village.getBuilding(pos.type);
            const def = BUILDING_DEFS[pos.type];
            const col = pos.x - this.viewX;
            const row = pos.y - this.viewY;
            if (building) {
                r.putBuilding(col - 1, row - 1, def, building.level);
            } else if (village.isBuildingUnlocked(pos.type)) {
                r.putEmptyPlot(col - 1, row - 1, def);
            }
        }

        // ── Building labels for the 4 interactive buildings ──
        const ctx = r.getCtx();
        const interactiveBuildings = ['smithy', 'tavern', 'temple', 'warehouse'];
        for (const pos of this.BUILDING_POSITIONS) {
            if (!interactiveBuildings.includes(pos.type)) continue;
            const building = village.getBuilding(pos.type);
            if (!building) continue;
            const def = BUILDING_DEFS[pos.type];
            const col = pos.x - this.viewX;
            const row = pos.y - this.viewY;
            if (col < -1 || col > this.viewW + 1 || row < -1 || row > this.viewH + 1) continue;

            const px = col * r.tileW + r.tileW / 2;
            const py = (row - 2) * r.tileH + r.tileH / 2;

            ctx.save();
            // Building pulse animation after death
            let pulseAlpha = 0;
            if (this._buildingPulse > 0) {
                pulseAlpha = 0.4 * Math.sin(this._buildingPulse * 6) * (this._buildingPulse / 2.0);
                if (pulseAlpha > 0) {
                    ctx.shadowColor = def.fg;
                    ctx.shadowBlur = 12 + pulseAlpha * 20;
                }
            }
            ctx.fillStyle = def.fg;
            ctx.font = 'bold 10px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(def.name, px, py);
            ctx.textAlign = 'left';
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // ── Named NPCs ──
        for (const npc of this._npcs) {
            const col = npc.x - this.viewX;
            const row = npc.y - this.viewY;
            if (col < 0 || col >= this.viewW || row < 0 || row >= this.viewH) continue;
            const px = col * r.tileW + r.tileW / 2;
            const py = row * r.tileH + r.tileH / 2;
            ctx.save();
            ctx.fillStyle = npc.color;
            ctx.beginPath();
            ctx.arc(px, py + 4, 5, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.fillStyle = '#ddc090';
            ctx.beginPath();
            ctx.arc(px, py - 3, 4, 0, Math.PI * 2);
            ctx.fill();
            // Name tag (when player is nearby)
            const dist = Math.abs(this.cursor.x - npc.x) + Math.abs(this.cursor.y - npc.y);
            if (dist <= 3) {
                ctx.fillStyle = 'rgba(10,6,2,0.8)';
                const nameW = ctx.measureText(npc.name).width || 70;
                ctx.font = '9px "Courier New"';
                const tw = ctx.measureText(npc.name).width + 8;
                ctx.fillRect(px - tw / 2, py - 16, tw, 12);
                ctx.fillStyle = '#e0d0a0';
                ctx.textAlign = 'center';
                ctx.fillText(npc.name, px, py - 7);
                if (dist <= 2) {
                    ctx.fillStyle = '#ffd060';
                    ctx.font = '8px "Courier New"';
                    ctx.fillText('[E] Talk', px, py + 16);
                }
                ctx.textAlign = 'left';
            }
            ctx.restore();
        }

        // ── Dungeon entrance glow ──
        {
            const pulse = 0.4 + 0.3 * Math.sin(Game.renderer.time * 3);
            ctx.save();
            ctx.globalAlpha = pulse;
            for (const [ey, ex] of [[9,39],[9,40],[10,39],[10,40]]) {
                const col = ex - this.viewX;
                const row = ey - this.viewY;
                if (col < 0 || col >= this.viewW || row < 0 || row >= this.viewH) continue;
                const px = col * r.tileW;
                const py = row * r.tileH;
                ctx.fillStyle = 'rgba(160,80,255,0.25)';
                ctx.fillRect(px, py, r.tileW, r.tileH);
            }
            ctx.restore();
        }

        // ── Player hero sprite ──
        const cursorCol = this.cursor.x - this.viewX;
        const cursorRow = this.cursor.y - this.viewY;
        r.putPlayer(cursorCol, cursorRow, Game.state.player);
        r.putCursor(cursorCol, cursorRow);

        // ── Interaction prompt ──
        if (this.mode === 'explore') {
            const iTarget = this._getInteractiveTarget();
            if (iTarget) {
                // "Press [E] to enter" prompt above player
                ctx.save();
                const promptX = cursorCol * r.tileW + r.tileW / 2;
                const promptY = cursorRow * r.tileH - 8;
                ctx.fillStyle = 'rgba(10,6,2,0.85)';
                const tw = 140;
                ctx.fillRect(promptX - tw / 2, promptY - 14, tw, 18);
                ctx.strokeStyle = '#c8a030';
                ctx.lineWidth = 1;
                ctx.strokeRect(promptX - tw / 2, promptY - 14, tw, 18);
                ctx.fillStyle = '#ffd060';
                ctx.font = 'bold 11px "Courier New"';
                ctx.textAlign = 'center';
                ctx.fillText('Press [E] to enter', promptX, promptY);
                ctx.textAlign = 'left';
                ctx.restore();
            } else {
                // Standard tooltip for non-interactive buildings
                const target = this.getBuildingAtCursor();
                if (target) {
                    let lines = [];
                    if (target.type === 'dungeon_entrance') {
                        lines = ['Dungeon Entrance', '[Enter/E] Descend'];
                    } else if (target.building && !target.def.isInteractive) {
                        lines = [
                            `${target.def.name}  Lv.${target.building.level}`,
                            '[Enter] Manage',
                            target.building.villager ? `Worker: ${target.building.villager}` : '',
                        ].filter(Boolean);
                    } else if (!target.building && Game.state.village.isBuildingUnlocked(target.type)) {
                        const cost = target.def.costs[0];
                        const costStr = cost ? Object.entries(cost).map(([k, v]) => `${k}:${v}`).join(' ') : '';
                        lines = [`Build: ${target.def.name}`, costStr, '[Enter] Build'].filter(Boolean);
                    }
                    if (lines.length) {
                        r.drawInfoTooltip(lines[0], lines.slice(1), cursorCol, cursorRow);
                    }
                }
            }
        }

        // ── Village HUD ──
        r.drawVillageHUD(Game.state.village, Game.state.player);

        // ── Quick re-enter prompt ──
        if (this._quickReenter && this.mode === 'explore') {
            ctx.save();
            const alpha = Math.min(1, this._quickReenterTimer / 0.5); // fade out in last 0.5s
            ctx.globalAlpha = alpha;
            const bw = 260, bh = 28;
            const bx = 400 - bw / 2, by = 680 - bh;
            ctx.fillStyle = 'rgba(8,4,20,0.85)';
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeStyle = '#a060ff';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, bw, bh);
            ctx.fillStyle = '#d0a0ff';
            ctx.font = 'bold 12px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('Press [R] to re-enter Dungeon', 400, by + 18);
            ctx.textAlign = 'left';
            ctx.restore();
        }

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
        } else if (this.mode === 'smithy') {
            r.drawSmithyPanel(Game.state.player, this._smithyItems, this._panelTab, this.selectedOption);
        } else if (this.mode === 'tavern') {
            r.drawTavernPanel(Game.state.player, this.selectedOption);
        } else if (this.mode === 'temple') {
            r.drawTemplePanel(Game.state.player, this.selectedOption);
        } else if (this.mode === 'warehouse') {
            r.drawWarehousePanel(Game.state.player, Game.state.village, this.selectedOption);
        }

        // ── Pause menu overlay ──
        if (this.mode === 'paused') {
            r.drawPauseMenu(this._pauseIndex, ['Resume', 'Settings', 'Save Game', 'Main Menu']);
        }

        // ── Settings overlay ──
        if (this.mode === 'settings') {
            r.drawSettingsPanel(Game.settings, this._settingsIndex);
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
