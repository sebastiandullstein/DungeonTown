// Dungeon Gameplay Scene — 2D canvas renderer version
const DungeonScene = {
    map: null,
    viewX: 0,
    viewY: 0,
    viewW: 25,
    viewH: 18,
    deathTimer: 0,
    victoryTimer: 0,
    chestAnims: [],
    _abilityUnlockAnim: null,
    _trackedLevel: 0,
    // Boss intro cinematic
    _bossIntro: null,  // { name, tier, timer, maxTimer }
    // Loot fanfare particles
    _lootFanfare: [],
    // Death save flash
    _deathSaveFlash: 0,
    // Phase 1: Escape + Events
    mode: 'play', // 'play','paused','settings','floorSelect','escapeConfirm','eventPrompt','merchant','prisonerChoice','altarChoice'
    floorEvents: [],
    // Room-clear altar system
    _clearedRooms: new Set(),     // room keys that have been cleared
    _altarOffering: null,         // current altar offering data
    _altarIndex: 0,               // selected altar option (0 or 1)
    _floorOptions: [],
    _floorSelectIndex: 0,
    _eventTarget: null,
    _merchantItems: [],
    _merchantIndex: 0,
    _prisonerIndex: 0,
    _pauseIndex: 0,
    _settingsIndex: 0,
    // Tutorial hints (non-blocking, overlay during play)
    _tutorialHint: null,  // { text, timer }
    _tutorialTimer: 0,    // time spent on this floor (for movement hint delay)
    // Combat log entries: { text, color, age }
    combatLog: [],
    // Item drop bounce animations: { x, y, timer }
    _itemDropAnims: [],
    // Kill streak
    _killStreak: 0,
    _killStreakTimer: 0, // resets if no kill within 5s
    _killStreakFlash: 0, // visual flash on milestone
    // Arena sealing
    _arenaSealed: false,
    _arenaRoom: null,
    _arenaDoorTiles: [], // saved door positions for unsealing
    _bossVictoryTimer: 0, // victory fanfare countdown

    init() {},

    enter(data) {
        // Floor select mode
        if (data && data.floorSelect && Game.state.unlockedFloors.length > 1) {
            this.mode = 'floorSelect';
            this._floorOptions = [...Game.state.unlockedFloors];
            this._floorSelectIndex = 0;
            return;
        }
        this.mode = 'play';
        const floor = Game.state.currentFloor;
        TileRenderer.setTheme(floor);
        this.map = DungeonGenerator.generate(floor);
        const p = Game.state.player;
        p.x = this.map.playerStart.x;
        p.y = this.map.playerStart.y;
        p.attacking = false;
        p.invulnTimer = 0;
        this.deathTimer = 0;
        this.victoryTimer = 0;
        Game.state.victory = false;
        this.chestAnims = [];
        this._abilityUnlockAnim = null;
        this._trackedLevel = p.level;
        this._tutorialHint = null;
        this._tutorialTimer = 0;
        this._bossIntro = null;
        this.combatLog = [];
        this._clearedRooms = new Set();
        this._altarOffering = null;
        this._altarIndex = 0;
        this._itemDropAnims = [];
        this._killStreak = 0;
        this._killStreakTimer = 0;
        this._killStreakFlash = 0;
        this._arenaSealed = false;
        this._arenaRoom = null;
        this._arenaDoorTiles = [];
        this._bossVictoryTimer = 0;
        this._prevPlayerHp = p.hp;
        this._lootFanfare = [];
        this._furyTriggered = false;
        this._deathSaveFlash = 0;
        this._deathSaveAcknowledged = false;
        this._escapeSummaryTimer = 0;
        this._levelUpPicks = null;
        this._levelUpPickIndex = 0;
        // Run stats tracking
        if (!Game.state.runStats || floor === 1) {
            Game.state.runStats = {
                kills: 0, floorsReached: floor, goldAtStart: p.gold,
                itemsFound: 0, goldEarned: 0, damageDealt: 0, damageTaken: 0,
                potionsUsed: 0, runTime: 0, deathCause: null, deathFloor: 0,
                bossesKilled: 0, bestKill: null
            };
        }
        Game.state.runStats.floorsReached = Math.max(Game.state.runStats.floorsReached, floor);
        // Generate floor events
        this.floorEvents = DungeonEvents.generate(floor, this.map);
        // Clear run bonuses on floor 1
        if (floor === 1) {
            p._runBonuses = {};
            p._deathSaveUsed = false;
            p._bonusMaxHp = 0;
            p._goldBonus = 0;
            p._xpBonus = 0;

            // Town Hall bonuses: the town's development aids dungeon runs
            const village = Game.state.village;
            if (village) {
                const thLevel = village.getBuilding('townhall')?.level || 0;
                if (thLevel >= 2) {
                    // Town intel: start with a small defense boost
                    p._runBonuses.def = 2;
                    Game.notify('Town scouts report: +2 DEF', '#aaccff');
                }
                if (thLevel >= 3) {
                    // Town backing: start with bonus HP
                    p._bonusMaxHp = 20;
                    p.maxHp = p.getMaxHp();
                    p.hp = p.maxHp;
                    Game.notify('Town blessing: +20 Max HP', '#ffcc44');
                }
                // Smithy bonus: equipped weapon gets a small ATK buff per smithy level
                const smLevel = village.getBuilding('smithy')?.level || 0;
                if (smLevel >= 2) {
                    p._runBonuses.atk = smLevel;
                    Game.notify(`Smithy forging: +${smLevel} ATK`, '#ff8844');
                }
            }
        }

        Audio.startMusic('dungeon', floor);

        if (floor === 50) {
            Audio.play('bossFloorWarning');
            Audio.play('bossIntro');
            this._bossIntro = { name: 'Malphas the Demon Lord', tier: 'final', timer: 3.5, maxTimer: 3.5 };
            Game.renderer.shake(15, 1.0);
        } else if (floor % 10 === 0) {
            const boss = EnemyTypes.getMajorBossForFloor(floor);
            Audio.play('bossFloorWarning');
            Audio.play('bossIntro');
            this._bossIntro = { name: boss.name, tier: 'major', timer: 3.0, maxTimer: 3.0 };
            Game.renderer.shake(10, 0.6);
        } else if (floor % 5 === 0) {
            const boss = EnemyTypes.getMiniBossForFloor(floor);
            Audio.play('bossFloorWarning');
            Audio.play('bossEncounter');
            this._bossIntro = { name: boss.name, tier: 'mini', timer: 2.0, maxTimer: 2.0 };
            Game.renderer.shake(6, 0.4);
        } else {
            Audio.play('floorTransition');
            Game.notify(`Dungeon Floor ${floor}`, '#40e0e0');
        }
    },

    exit() {
        UI.close();
    },

    update(dt) {
        const r = Game.renderer;
        this.viewW = r.viewportCols;
        this.viewH = r.viewportRows;

        // Pause menu
        if (this.mode === 'paused') {
            const pauseOptions = ['Resume', 'Settings', 'Main Menu'];
            if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
                this._pauseIndex = Math.max(0, this._pauseIndex - 1);
            }
            if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
                this._pauseIndex = Math.min(pauseOptions.length - 1, this._pauseIndex + 1);
            }
            if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
                if (this._pauseIndex === 0) {
                    this.mode = 'play';
                } else if (this._pauseIndex === 1) {
                    this._settingsIndex = 0;
                    this.mode = 'settings';
                } else if (this._pauseIndex === 2) {
                    Game.switchScene('title');
                }
                return;
            }
            if (Input.wasPressed('Escape') || Input.wasPressed('p') || Input.wasPressed('P')) {
                this.mode = 'play';
            }
            return;
        }

        // Settings panel (from pause)
        if (this.mode === 'settings') {
            this._updateSettings();
            return;
        }

        // Level-up pick mode
        if (this.mode === 'levelUpPick') {
            if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
                this._levelUpPickIndex = Math.max(0, this._levelUpPickIndex - 1);
                Audio.play('menuMove');
            }
            if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
                this._levelUpPickIndex = Math.min(2, this._levelUpPickIndex + 1);
                Audio.play('menuMove');
            }
            if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
                const pick = this._levelUpPicks[this._levelUpPickIndex];
                pick.apply(Game.state.player);
                Game.notify(`Chose: ${pick.label}!`, pick.color);
                Audio.play('menuSelect');
                Combat.addFloatingText(Game.state.player.x, Game.state.player.y, pick.label, pick.color);
                this._levelUpPicks = null;
                this.mode = 'play';
            }
            return;
        }

        // Floor select mode
        if (this.mode === 'floorSelect') {
            if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
                this._floorSelectIndex = Math.max(0, this._floorSelectIndex - 1);
                Audio.play('menuMove');
            }
            if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
                this._floorSelectIndex = Math.min(this._floorOptions.length - 1, this._floorSelectIndex + 1);
                Audio.play('menuMove');
            }
            if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
                Game.state.currentFloor = this._floorOptions[this._floorSelectIndex];
                Audio.play('menuSelect');
                this.enter();
                return;
            }
            if (Input.wasPressed('Escape')) {
                Game.state.currentFloor = 1;
                this.enter();
                return;
            }
            return;
        }

        // Escape confirmation mode
        if (this.mode === 'escapeConfirm') {
            if (Input.wasPressed('Enter') || Input.wasPressed('y') || Input.wasPressed('Y')) {
                this.mode = 'escapeSummary';
                this._escapeSummaryTimer = 0;
                Audio.play('escapeJingle');
                return;
            }
            if (Input.wasPressed('Escape') || Input.wasPressed('n') || Input.wasPressed('N')) {
                this.mode = 'play';
            }
            return;
        }

        // Escape summary overlay
        if (this.mode === 'escapeSummary') {
            this._escapeSummaryTimer += dt;
            if (this._escapeSummaryTimer > 1.5 && (Input.wasPressed('Enter') || Input.wasPressed(' ') || Input.wasPressed('Escape'))) {
                this.returnToVillage();
            }
            return;
        }

        // Event prompt mode (shrine, fountain, cursed chest)
        if (this.mode === 'eventPrompt') {
            if (Input.wasPressed('Enter') || Input.wasPressed('y') || Input.wasPressed('Y')) {
                const result = DungeonEvents.resolve(this._eventTarget, Game.state.player, Game.state.currentFloor);
                if (result) {
                    Game.notify(result.text, result.color);
                    Combat.addFloatingText(Game.state.player.x, Game.state.player.y, result.text.substring(0, 30), result.color);
                    // Handle trap from cursed chest
                    if (result.trap && this.map.enemies) {
                        const p = Game.state.player;
                        for (let i = 0; i < 2; i++) {
                            const ex = p.x + (Math.random() < 0.5 ? -1 : 1);
                            const ey = p.y + (Math.random() < 0.5 ? -1 : 1);
                            if (!this.map.isWalkable(ex, ey)) continue;
                            const enemy = Enemy.spawn(Game.state.currentFloor, ex, ey);
                            if (enemy) this.map.enemies.push(enemy);
                        }
                    }
                    // Handle dry fountain
                    if (this._eventTarget.dry) {
                        this.map.set(this._eventTarget.x, this._eventTarget.y, TILE.FOUNTAIN_DRY);
                    }
                }
                this.mode = 'play';
                return;
            }
            if (Input.wasPressed('Escape') || Input.wasPressed('n') || Input.wasPressed('N')) {
                this.mode = 'play';
            }
            return;
        }

        // Merchant mode
        if (this.mode === 'merchant') {
            if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
                this._merchantIndex = Math.max(0, this._merchantIndex - 1);
            }
            if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
                this._merchantIndex = Math.min(this._merchantItems.length - 1, this._merchantIndex + 1);
            }
            if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
                const item = this._merchantItems[this._merchantIndex];
                const p = Game.state.player;
                if (item && p.gold >= item.value) {
                    if (p.inventory.length < 20) {
                        p.gold -= item.value;
                        p.inventory.push(item);
                        Game.notify('Purchased ' + item.name, '#ffd700');
                        Audio.play('buy');
                        this._merchantItems.splice(this._merchantIndex, 1);
                        if (this._merchantIndex >= this._merchantItems.length) this._merchantIndex = Math.max(0, this._merchantItems.length - 1);
                        this._eventTarget.used = true;
                    } else {
                        Game.notify('Inventory full!', '#f00');
                    }
                } else if (item) {
                    Game.notify('Not enough gold!', '#f00');
                }
            }
            if (Input.wasPressed('Escape')) {
                this._eventTarget.used = true;
                this.mode = 'play';
            }
            return;
        }

        // Prisoner choice mode
        if (this.mode === 'prisonerChoice') {
            if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
                this._prisonerIndex = Math.max(0, this._prisonerIndex - 1);
            }
            if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
                this._prisonerIndex = Math.min(2, this._prisonerIndex + 1);
            }
            if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
                const result = DungeonEvents.resolvePrisoner(Game.state.player, this._prisonerIndex);
                if (result) {
                    Game.notify(result.text, result.color);
                    this._eventTarget.used = true;
                }
                this.mode = 'play';
                return;
            }
            if (Input.wasPressed('Escape')) {
                this.mode = 'play';
            }
            return;
        }

        // Altar choice mode (room-clear mini-event)
        if (this.mode === 'altarChoice') {
            if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
                this._altarIndex = 0;
            }
            if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
                this._altarIndex = 1;
            }
            if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
                const result = DungeonEvents.resolveAltar(this._altarOffering, this._altarIndex, Game.state.player);
                if (result) {
                    Game.notify(result.text, result.color);
                    Combat.addFloatingText(Game.state.player.x, Game.state.player.y, result.text, result.color);
                    Audio.play('chestOpen');
                }
                this._altarOffering = null;
                this.mode = 'play';
                return;
            }
            if (Input.wasPressed('Escape')) {
                this._altarOffering = null;
                this.mode = 'play';
            }
            return;
        }

        // Victory screen — Demon Lord slain
        if (Game.state.victory) {
            this.victoryTimer += dt;
            // After 8 seconds, return to village with victory state preserved
            if (this.victoryTimer > 8 && Input.wasPressed('Enter')) {
                Game.switchScene('village');
            }
            return;
        }

        if (this.deathTimer > 0) {
            this.deathTimer -= dt;
            // Allow skip after 2 seconds
            const elapsed = 5.0 - this.deathTimer;
            if (elapsed > 2.0 && (Input.wasPressed('Enter') || Input.wasPressed(' ') || Input.wasPressed('Escape'))) {
                this.deathTimer = 0;
            }
            if (this.deathTimer <= 0) {
                const p = Game.state.player;
                // Calculate gold lost before modifying
                const savePercent = p.getDeathGoldSavePercent ? p.getDeathGoldSavePercent() : 0;
                const lossPercent = 0.5 * (1 - savePercent);
                const goldLost = Math.floor((p.gold || 0) * lossPercent);
                p.hp = p.maxHp;
                p.mp = p.maxMp;
                p.gold = (p.gold || 0) - goldLost;
                if (p.clearTavernBuffs) p.clearTavernBuffs();
                Game.state.currentFloor = 1;
                // Track total deaths (persisted)
                Game.state.totalDeaths = (Game.state.totalDeaths || 0) + 1;
                Game.switchScene('village', {
                    fromDeath: true,
                    runStats: Game.state.runStats,
                    goldLost: goldLost
                });
            }
            return;
        }

        // Track run time
        if (Game.state.runStats) Game.state.runStats.runTime += dt;

        // Boss intro cinematic (blocks input)
        if (this._bossIntro) {
            this._bossIntro.timer -= dt;
            if (this._bossIntro.timer <= 0) this._bossIntro = null;
            return;
        }

        // Tick loot fanfare particles
        for (let i = this._lootFanfare.length - 1; i >= 0; i--) {
            const lf = this._lootFanfare[i];
            lf.timer += dt;
            if (lf.timer >= lf.duration) this._lootFanfare.splice(i, 1);
        }

        // UI menus take priority
        if (UI.isOpen()) {
            UI.update(dt);
            return;
        }

        if (Input.wasPressed('i') || Input.wasPressed('I')) { UI.toggle('inventory'); return; }
        if (Input.wasPressed('c') || Input.wasPressed('C')) { UI.toggle('character'); return; }
        if (Input.wasPressed('Escape') || Input.wasPressed('p') || Input.wasPressed('P')) {
            this._pauseIndex = 0;
            this.mode = 'paused';
            return;
        }

        const player = Game.state.player;

        // Ability cooldowns and input
        Abilities.update(dt);
        if (Input.wasPressed('Shift')) {
            if (Abilities.tryActivate('dash', player, this.map, this.map.enemies))
                this._log('Dash!', '#60c8ff');
        }
        if (Input.wasPressed('q') || Input.wasPressed('Q')) {
            if (Abilities.tryActivate('whirlwind', player, this.map, this.map.enemies))
                this._log('Whirlwind!', '#a0e0ff');
        }
        if ((Input.wasPressed('e') || Input.wasPressed('E')) && (!this._nearEvent || this._nearEvent.used)) {
            if (Abilities.tryActivate('execute', player, this.map, this.map.enemies))
                this._log('Execute!', '#ff6040');
        }

        player.update(dt, this.map);
        const fovRadius = 6 + (player.getFOVBonus ? player.getFOVBonus() : 0);
        this.map.revealAround(player.x, player.y, fovRadius);

        // Tutorial hints (non-blocking)
        this._tutorialTimer += dt;
        if (this._tutorialHint) {
            this._tutorialHint.timer += dt;
            if (this._tutorialHint.timer >= 6 || Object.keys(Input.keyPressed).length > 0) {
                this._tutorialHint = null;
            }
        }
        this._checkTutorials(player);

        // Stairs
        if (this.map.get(player.x, player.y) === TILE.STAIRS_DOWN) {
            if (Input.wasPressed('Enter') || Input.wasPressed('>') || Input.wasPressed('.') || Input.wasPressed('e') || Input.wasPressed('E')) {
                Game.state.currentFloor++;
                if (Game.state.currentFloor > Game.state.maxFloorReached)
                    Game.state.maxFloorReached = Game.state.currentFloor;
                this.enter();
                return;
            }
        }
        if (this.map.get(player.x, player.y) === TILE.STAIRS_UP) {
            if (Input.wasPressed('Enter') || Input.wasPressed('<') || Input.wasPressed(',') || Input.wasPressed('e') || Input.wasPressed('E')) {
                if (Game.state.currentFloor > 1) {
                    this.mode = 'escapeConfirm';
                    return;
                }
                // Floor 1 escape — show summary then return
                this.mode = 'escapeSummary';
                this._escapeSummaryTimer = 0;
                Audio.play('escapeJingle');
                return;
            }
        }

        // Event tile interaction (E key — prioritize over Execute ability)
        const playerTile = this.map.get(player.x, player.y);
        const eventTiles = [TILE.SHRINE, TILE.MERCHANT, TILE.CURSED_CHEST, TILE.FOUNTAIN, TILE.PRISONER];
        if (eventTiles.includes(playerTile)) {
            this._nearEvent = this._findEvent(player.x, player.y);
            if (this._nearEvent && !this._nearEvent.used && (Input.wasPressed('e') || Input.wasPressed('E'))) {
                this._eventTarget = this._nearEvent;
                const evDef = DungeonEvents.EVENTS[this._nearEvent.id];
                if (this._nearEvent.id === 'merchant') {
                    this._merchantItems = DungeonEvents.getMerchantItems(Game.state.currentFloor);
                    this._merchantIndex = 0;
                    this.mode = 'merchant';
                } else if (this._nearEvent.id === 'prisoner') {
                    if (Game.state.player.soulShards >= 5) {
                        Game.state.player.soulShards -= 5;
                        this._prisonerIndex = 0;
                        this.mode = 'prisonerChoice';
                    } else {
                        Game.notify('You lack the soul shards to break the seal... (Need 5)', '#888');
                    }
                } else {
                    this.mode = 'eventPrompt';
                }
                return;
            }
        } else {
            this._nearEvent = null;
        }

        // Chest interaction — open automatically when stepped on
        if (this.map.get(player.x, player.y) === TILE.CHEST) {
            this.chestAnims.push({ x: player.x, y: player.y, timer: 0.5, maxTimer: 0.5 });
            this.map.openChest(player.x, player.y, Game.state.currentFloor, player);
            Audio.play('chestOpen');
        }

        // Tick chest open animations
        for (let i = this.chestAnims.length - 1; i >= 0; i--) {
            this.chestAnims[i].timer -= dt;
            if (this.chestAnims[i].timer <= 0) this.chestAnims.splice(i, 1);
        }

        // Pick up items
        for (let i = this.map.items.length - 1; i >= 0; i--) {
            const item = this.map.items[i];
            if (item.x === player.x && item.y === player.y) {
                if (item.type === 'gold') {
                    // Gold goes to player's personal wallet, spent in shops
                    player.gold = (player.gold || 0) + item.value;
                    if (Game.state.runStats) Game.state.runStats.goldEarned += item.value;
                    Game.notify(`+${item.value} Gold`, '#ffd020');
                    this._log(`+${item.value} gold`, '#ffd020');
                    this.map.items.splice(i, 1);
                } else {
                    if (player.addToInventory(item)) {
                        if (Game.state.runStats) Game.state.runStats.itemsFound++;
                        // Rare loot fanfare for tier 4+ items
                        if (item.tier >= 4) {
                            Audio.play('rareLoot');
                            Game.renderer.shake(4, 0.2);
                            const tierColors = ['#aaa','#8c8','#48f','#a4f','#f80','#f44','#f8f','#fff'];
                            const col = tierColors[Math.min(item.tier, 7)];
                            for (let p = 0; p < 12; p++) {
                                const angle = (p / 12) * Math.PI * 2;
                                this._lootFanfare.push({
                                    x: item.x * 32 + 16, y: item.y * 32 + 16,
                                    vx: Math.cos(angle) * (50 + Math.random() * 40),
                                    vy: Math.sin(angle) * (50 + Math.random() * 40) - 30,
                                    color: col, timer: 0, duration: 0.8 + Math.random() * 0.4,
                                    size: 2 + Math.random() * 3
                                });
                            }
                            Game.notify(`★ ${item.name} ★`, col);
                            this._log(`★ ${item.name}`, col);
                        } else {
                            Game.notify(`Picked up ${item.name}`, '#40c0e0');
                            this._log(`Found: ${item.name}`, '#40c0e0');
                        }
                        this.map.items.splice(i, 1);
                    } else {
                        Game.notify('Inventory full!', '#f00');
                    }
                }
            }
        }

        // Arena sealing: detect player entering boss room
        if (!this._arenaSealed && this.map.rooms.length > 1) {
            const lastRoom = this.map.rooms[this.map.rooms.length - 1];
            if (lastRoom.isArena && player.x > lastRoom.x && player.x < lastRoom.x + lastRoom.w - 1
                && player.y > lastRoom.y && player.y < lastRoom.y + lastRoom.h - 1) {
                this._arenaSealed = true;
                this._arenaRoom = lastRoom;
                this._arenaDoorTiles = [];
                // Seal all doors on the arena perimeter
                if (lastRoom.doorPositions) {
                    for (const dp of lastRoom.doorPositions) {
                        if (this.map.get(dp.x, dp.y) === TILE.DOOR) {
                            this._arenaDoorTiles.push({ x: dp.x, y: dp.y });
                            this.map.set(dp.x, dp.y, TILE.ARENA_WALL);
                        }
                    }
                }
                Game.renderer.shake(6, 0.3);
                Audio.play('bossFloorWarning');
                Game.notify('The arena seals shut!', '#ff4444');
            }
        }

        // Boss victory fanfare timer
        if (this._bossVictoryTimer > 0) {
            this._bossVictoryTimer -= dt;
            if (this._bossVictoryTimer <= 0) {
                // Unseal arena
                if (this._arenaRoom) {
                    for (const dp of this._arenaDoorTiles) {
                        this.map.set(dp.x, dp.y, TILE.DOOR);
                    }
                    // Place stairs down at arena center
                    this.map.set(this._arenaRoom.cx, this._arenaRoom.cy, TILE.STAIRS_DOWN);
                    this.map.stairsDown = { x: this._arenaRoom.cx, y: this._arenaRoom.cy };
                    this._arenaSealed = false;
                    Game.notify('The arena opens. Stairs appear.', '#40e0e0');
                }
            }
            return; // block input during victory fanfare
        }

        // Update enemies
        for (const enemy of this.map.enemies) {
            if (enemy.hp > 0) Enemy.update(enemy, dt, this.map, player);
        }

        // Resolve player attacks
        if (player.attacking) Combat.resolvePlayerAttack(player, this.map.enemies);

        // Tick enemy knockback & death animations
        for (const enemy of this.map.enemies) {
            if (enemy.knockTimer > 0) enemy.knockTimer -= dt;
            if (enemy.hp <= 0 && !enemy.deathTimer) enemy.deathTimer = 0.3;
            if (enemy.deathTimer > 0) enemy.deathTimer -= dt;
        }
        // Remove fully-dead enemies (after death animation), log kills
        const justDied = this.map.enemies.filter(e => e.hp <= 0 && (e.deathTimer === undefined || e.deathTimer <= 0));
        for (const dead of justDied) {
            if (dead.name) this._log(`${dead.name} slain`, '#ff9040');
            // Loot burst particles — gold coins flying from corpse
            const numParticles = dead.isBoss ? 12 : 4 + Math.floor(Math.random() * 3);
            for (let p = 0; p < numParticles; p++) {
                const angle = (p / numParticles) * Math.PI * 2 + Math.random() * 0.5;
                const speed = 30 + Math.random() * 50;
                this._lootFanfare.push({
                    x: dead.x * 32 + 16, y: dead.y * 32 + 16,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 40, // upward bias
                    color: '#ffd040', timer: 0, duration: 0.5 + Math.random() * 0.3,
                    size: 1.5 + Math.random() * 2
                });
            }
        }
        // Boss victory fanfare trigger
        for (const dead of justDied) {
            if (dead.isBoss && !dead.isFinalBoss && this._bossVictoryTimer <= 0) {
                this._bossVictoryTimer = 3.0;
                Game.hitStop(0.5);
                Audio.play('bossDefeatJingle');
                // Big particle explosion
                for (let i = 0; i < 24; i++) {
                    const angle = (i / 24) * Math.PI * 2;
                    const speed = 80 + Math.random() * 80;
                    Combat.particles.push({
                        x: dead.x * 32 + 16, y: dead.y * 32 + 16,
                        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40,
                        color: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ff8800' : '#fff',
                        timer: 0, duration: 0.6 + Math.random() * 0.4, size: 3 + Math.random() * 3
                    });
                }
                Combat._screenFlash = 0.15;
                Combat._screenFlashColor = '#ffd700';
            }
        }

        this.map.enemies = this.map.enemies.filter(e => e.hp > 0 || (e.deathTimer !== undefined && e.deathTimer > 0));

        // Kill streak tracking
        if (justDied.length > 0) {
            this._killStreak += justDied.length;
            this._killStreakTimer = 5.0;
            // Milestone every 5 kills
            if (this._killStreak >= 5 && this._killStreak % 5 < justDied.length) {
                const milestone = Math.floor(this._killStreak / 5) * 5;
                this._killStreakFlash = 0.8;
                Game.renderer.shake(3, 0.15);
                Combat.addFloatingText(player.x, player.y, `${milestone} KILLS!`, '#ffa020');
            }
        }
        if (this._killStreakTimer > 0) {
            this._killStreakTimer -= dt;
            if (this._killStreakTimer <= 0) this._killStreak = 0;
        }
        if (this._killStreakFlash > 0) this._killStreakFlash -= dt;

        // Check for pending level-up pick
        if (player._pendingLevelUpPick) {
            player._pendingLevelUpPick = false;
            this._levelUpPicks = Player.generateLevelUpPicks(player.level);
            this._levelUpPickIndex = 0;
            this.mode = 'levelUpPick';
            return;
        }

        // Room-clear mini-event: check if a room was just cleared (40% chance)
        if (justDied.length > 0 && this.map.rooms) {
            const pRoom = this.map.rooms.find(r =>
                player.x >= r.x && player.x < r.x + r.w &&
                player.y >= r.y && player.y < r.y + r.h
            );
            if (pRoom) {
                const rKey = pRoom.x + ',' + pRoom.y;
                if (!this._clearedRooms.has(rKey)) {
                    // Check if all enemies in this room are dead
                    const roomEnemies = this.map.enemies.filter(e =>
                        e.hp > 0 && e.x >= pRoom.x && e.x < pRoom.x + pRoom.w &&
                        e.y >= pRoom.y && e.y < pRoom.y + pRoom.h
                    );
                    if (roomEnemies.length === 0) {
                        this._clearedRooms.add(rKey);
                        if (Math.random() < 0.80) {
                            this._altarOffering = DungeonEvents.generateAltarOffering();
                            this._altarIndex = 0;
                            this.mode = 'altarChoice';
                            Audio.play('chestOpen');
                            return;
                        }
                    }
                }
            }
        }

        // Detect player damage taken
        if (player.hp < this._prevPlayerHp && player.hp > 0) {
            const dmg = Math.round(this._prevPlayerHp - player.hp);
            this._log(`-${dmg} HP`, '#ff4040');
        }
        this._prevPlayerHp = player.hp;

        // Age combat log entries (fade out old ones)
        for (const entry of this.combatLog) entry.age += dt;

        // Combat effects
        Combat.update(dt);

        // Tick ability unlock animation
        if (this._abilityUnlockAnim) {
            this._abilityUnlockAnim.timer -= dt;
            if (this._abilityUnlockAnim.timer <= 0) this._abilityUnlockAnim = null;
        }

        // Detect level-up → check ability unlocks
        if (player.level !== this._trackedLevel) {
            this._trackedLevel = player.level;
            const abilityUnlocks = { 5: { name: 'Whirlwind', key: 'Q' }, 10: { name: 'Execute', key: 'E' } };
            const unlocked = abilityUnlocks[player.level];
            if (unlocked) {
                this._abilityUnlockAnim = { name: unlocked.name, key: unlocked.key, timer: 3.5, maxTimer: 3.5 };
            }
        }

        // Village production (background ticking)
        Game.state.village.updateProduction(dt);

        // Update camera
        this.viewX = Math.floor(player.x - this.viewW / 2);
        this.viewY = Math.floor(player.y - this.viewH / 2);
        this.viewX = Math.max(0, Math.min(this.map.width  - this.viewW, this.viewX));
        this.viewY = Math.max(0, Math.min(this.map.height - this.viewH, this.viewY));
        Game.renderer.setViewport(this.viewX, this.viewY);

        // Death save flash decay
        if (this._deathSaveFlash > 0) this._deathSaveFlash -= dt;

        // Detect death save activation (player was saved from death)
        if (player._deathSaveUsed && !this._deathSaveAcknowledged) {
            this._deathSaveAcknowledged = true;
            this._deathSaveFlash = 0.8;
        }

        // Desperate Fury trigger (once per threshold crossing)
        const furyThreshold = player.getMaxHp() * 0.2;
        if (player.hp > 0 && player.hp <= furyThreshold && !this._furyTriggered) {
            this._furyTriggered = true;
            Game.notify('★ DESPERATE FURY ★  ATK +30%!', '#ff4020');
            Combat.addFloatingText(player.x, player.y, 'FURY!', '#ff4020');
            Game.renderer.shake(5, 0.3);
        } else if (player.hp > furyThreshold) {
            this._furyTriggered = false;
        }

        // Death check
        if (player.hp <= 0) {
            this.deathTimer = 5.0;
            if (Game.state.runStats) {
                Game.state.runStats.deathFloor = Game.state.currentFloor;
            }
            Audio.play('deathJingle');
            Game.renderer.shake(15, 0.8);
        }
    },

    _getRunRating(stats) {
        // S/A/B/C/D rating based on performance
        let score = 0;
        score += Math.min(50, (stats.floorsReached || 0)) * 2;      // up to 100
        score += Math.min(100, (stats.kills || 0));                   // up to 100
        score += Math.min(50, (stats.bossesKilled || 0) * 15);       // up to 50
        score += Math.min(30, (stats.goldEarned || 0) / 10);         // up to 30
        const time = stats.runTime || 1;
        if (time < 300 && stats.floorsReached >= 10) score += 20;    // speed bonus
        if (stats.floorsReached >= 50) score += 50;                   // completion bonus
        if (score >= 250) return { grade: 'S', color: '#ffd700' };
        if (score >= 180) return { grade: 'A', color: '#40e0e0' };
        if (score >= 120) return { grade: 'B', color: '#80ff40' };
        if (score >= 60)  return { grade: 'C', color: '#c8a050' };
        return { grade: 'D', color: '#887766' };
    },

    _drawEscapeSummary(ctx, elapsed) {
        const stats = Game.state.runStats || { kills: 0, floorsReached: 1, goldEarned: 0,
            itemsFound: 0, damageDealt: 0, damageTaken: 0, potionsUsed: 0, runTime: 0,
            bossesKilled: 0, bestKill: null };

        // Darken background
        const bgFade = Math.min(0.75, elapsed * 1.5);
        ctx.save();
        ctx.fillStyle = `rgba(0,8,4,${bgFade})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.textAlign = 'center';
        const cx = 400;

        // Title: "ESCAPED"
        const titleFade = Math.min(1, elapsed / 0.5);
        ctx.globalAlpha = titleFade;
        ctx.shadowColor = '#00ff80';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#40ff80';
        ctx.font = 'bold 48px "Courier New"';
        ctx.fillText('ESCAPED', cx, 130);
        ctx.shadowBlur = 0;

        // Subtitle
        ctx.fillStyle = '#80c0a0';
        ctx.font = 'italic 14px "Courier New"';
        ctx.fillText(`Returned safely from Floor ${stats.floorsReached}`, cx, 158);

        // Summary panel — fades in
        const summaryFade = Math.min(1, Math.max(0, (elapsed - 0.5) / 0.8));
        ctx.globalAlpha = summaryFade;

        const pw = 360, ph = 310;
        const px = cx - pw / 2, py = 175;
        ctx.fillStyle = 'rgba(2,8,4,0.85)';
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = '#206040';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, pw, ph);

        // Panel title
        ctx.fillStyle = '#609080';
        ctx.font = 'bold 13px "Courier New"';
        ctx.fillText('─── RUN SUMMARY ───', cx, py + 22);

        // Stats rows
        const minutes = Math.floor((stats.runTime || 0) / 60);
        const seconds = Math.floor((stats.runTime || 0) % 60);
        const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        const rows = [
            { label: 'Floors Reached', value: `${stats.floorsReached}`, color: '#88aa88' },
            { label: 'Enemies Slain', value: `${stats.kills}`, color: '#88aa88' },
            { label: 'Bosses Killed', value: `${stats.bossesKilled || 0}`, color: '#ddaa44' },
            { label: 'Damage Dealt', value: `${stats.damageDealt}`, color: '#88aa88' },
            { label: 'Items Found', value: `${stats.itemsFound}`, color: '#88aa88' },
            { label: 'Gold Earned', value: `${stats.goldEarned}`, color: '#ddaa44' },
            { label: 'Potions Used', value: `${stats.potionsUsed}`, color: '#88aa88' },
            { label: 'Time', value: timeStr, color: '#88aa88' },
        ];
        if (stats.bestKill) {
            rows.push({ label: 'Strongest Kill', value: stats.bestKill, color: '#ff9040' });
        }

        ctx.font = '13px "Courier New"';
        let ry = py + 44;
        for (const row of rows) {
            ctx.fillStyle = '#778877';
            ctx.textAlign = 'left';
            ctx.fillText(row.label, px + 24, ry);
            ctx.fillStyle = row.color;
            ctx.textAlign = 'right';
            ctx.fillText(row.value, px + pw - 24, ry);
            ry += 19;
        }

        // Divider
        ry += 4;
        ctx.strokeStyle = 'rgba(60,100,70,0.4)';
        ctx.beginPath();
        ctx.moveTo(px + 20, ry);
        ctx.lineTo(px + pw - 20, ry);
        ctx.stroke();
        ry += 16;

        // Run rating
        const rating = this._getRunRating(stats);
        ctx.textAlign = 'center';
        ctx.fillStyle = rating.color;
        ctx.font = 'bold 28px "Courier New"';
        ctx.shadowColor = rating.color;
        ctx.shadowBlur = 10;
        ctx.fillText(`RANK: ${rating.grade}`, cx, ry);
        ctx.shadowBlur = 0;
        ry += 20;

        // Flavor text
        ctx.font = 'italic 12px "Courier New"';
        ctx.fillStyle = '#80a090';
        let flavor;
        if (stats.floorsReached >= 50) flavor = 'The Demon Lord falls. DungeonTown is saved!';
        else if (stats.floorsReached >= 40) flavor = 'The deepest halls tremble at your return.';
        else if (stats.bossesKilled >= 3) flavor = 'The bosses fall, one by one. Victory draws near.';
        else if (stats.kills >= 50) flavor = 'A legendary warrior returns triumphant.';
        else if (stats.floorsReached >= 20) flavor = 'The dungeon remembers your blade.';
        else if (stats.floorsReached >= 10) flavor = 'Steady progress. The town grows stronger.';
        else flavor = 'Every safe return is a victory.';
        ctx.fillText(`"${flavor}"`, cx, ry);

        // Skip prompt
        const skipFade = Math.min(1, Math.max(0, (elapsed - 1.5) / 0.5));
        ctx.globalAlpha = skipFade * (0.5 + 0.3 * Math.sin(elapsed * 3));
        ctx.font = '12px "Courier New"';
        ctx.fillStyle = '#609080';
        ctx.fillText('[Enter / Space] Continue', cx, py + ph - 8);

        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
        ctx.restore();
    },

    _findEvent(x, y) {
        for (const ev of this.floorEvents) {
            if (ev.x === x && ev.y === y) return ev;
        }
        return null;
    },

    _log(text, color = '#ddd') {
        this.combatLog.push({ text, color, age: 0 });
        if (this.combatLog.length > 7) this.combatLog.shift();
    },

    _updateSettings() {
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

    _showHint(key, text) {
        const seen = Game.settings.tutorialSeen;
        if (seen[key] || this._tutorialHint) return;
        seen[key] = true;
        Game.saveSettings();
        this._tutorialHint = { text, timer: 0 };
    },

    _checkTutorials(player) {
        const floor = Game.state.currentFloor;
        // Movement hint — first 3 seconds on floor 1
        if (floor === 1 && this._tutorialTimer < 3 && this._tutorialTimer > 0.5) {
            this._showHint('movement', 'WASD to move, Space to attack');
        }
        // Combat hint — enemy within 4 tiles
        for (const e of this.map.enemies) {
            if (e.hp <= 0) continue;
            const dx = Math.abs(e.x - player.x);
            const dy = Math.abs(e.y - player.y);
            if (dx + dy <= 4) {
                this._showHint('combat', 'Space to attack, Shift to dash');
                break;
            }
        }
        // Item hint — item on ground within FOV
        for (const item of this.map.items) {
            if (this.map.isInFOV(player.x, player.y, item.x, item.y)) {
                this._showHint('items', 'Walk over items to pick up, I for inventory');
                break;
            }
        }
        // Event hint — standing on event tile
        if (this._nearEvent && !this._nearEvent.used) {
            this._showHint('events', 'Press E to interact with this event');
        }
        // Ability hint — player reaches level 3
        if (player.level >= 3) {
            this._showHint('abilities', 'Q: Whirlwind  E: Execute  Shift: Dash');
        }
        // Escape hint — standing on stairs up
        if (this.map.get(player.x, player.y) === TILE.STAIRS_UP) {
            this._showHint('escape', 'Enter on stairs to escape with your loot');
        }
    },

    returnToVillage() {
        const escaped = Game.state.currentFloor > 1;
        if (escaped && Math.random() < 0.3) {
            Game.state.village.resolveRaid(Game.state.currentFloor);
        }
        Game.state.village.refreshRecruits();
        if (escaped) {
            Game.save();
            Game.switchScene('village', {
                fromEscape: true,
                runStats: Game.state.runStats
            });
        } else {
            Game.switchScene('village');
        }
    },

    render(r) {
        // Floor select: no map exists yet, render panel on black
        if (this.mode === 'floorSelect') {
            r.drawFloorSelectPanel(this._floorOptions, this._floorSelectIndex);
            return;
        }

        const player = Game.state.player;

        // ── Tile layer ──
        for (let row = 0; row < this.viewH; row++) {
            for (let col = 0; col < this.viewW; col++) {
                const mx = col + this.viewX;
                const my = row + this.viewY;

                if (!this.map.explored[my] || !this.map.explored[my][mx]) {
                    // Draw void (black)
                    r.putTile(col, row, TILE.VOID, { dimFactor: 0 });
                    continue;
                }

                const tile = this.map.get(mx, my);
                const inFOV = this.map.isInFOV(player.x, player.y, mx, my);
                const dimFactor = inFOV ? 1.0 : 0.35;

                r.putTile(col, row, tile, { dimFactor });

                // Wall bottom shadow: if this tile is a floor and the tile above is a wall
                if (inFOV && tile !== TILE.WALL && tile !== TILE.VOID) {
                    const tileAbove = (my > 0) ? this.map.get(mx, my - 1) : TILE.VOID;
                    if (tileAbove === TILE.WALL) {
                        r.putWallShadow(col, row);
                    }
                }
            }
        }

        // ── Items (only in FOV) — pulsing glow + sprite ──
        for (const item of this.map.items) {
            if (this.map.isInFOV(player.x, player.y, item.x, item.y)) {
                const icol = item.x - this.viewX;
                const irow = item.y - this.viewY;
                // Loot glow pulse
                const ctx = r.getCtx();
                const ipx = icol * 32 + 16;
                const ipy = irow * 32 + 16;
                const glowColor = item.type === 'gold' ? 'rgba(255,210,40,' : 'rgba(80,200,255,';
                const pulse = 0.15 + 0.1 * Math.sin(Game.renderer.time * 4 + item.x * 3 + item.y * 7);
                ctx.save();
                ctx.globalAlpha = pulse;
                const grad = ctx.createRadialGradient(ipx, ipy, 2, ipx, ipy, 14);
                grad.addColorStop(0, glowColor + '0.6)');
                grad.addColorStop(1, glowColor + '0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(ipx, ipy, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                r.putItem(icol, irow, item);
            }
        }

        // ── Chest open animations ──
        for (const ca of this.chestAnims) {
            const progress = 1 - ca.timer / ca.maxTimer;
            r.putChestAnim(ca.x - this.viewX, ca.y - this.viewY, progress);
        }

        // ── Enemies (only in FOV, including dying) ──
        for (const enemy of this.map.enemies) {
            if (!this.map.isInFOV(player.x, player.y, enemy.x, enemy.y)) continue;
            if (enemy.hp > 0 || (enemy.deathTimer !== undefined && enemy.deathTimer > 0)) {
                r.putEnemy(enemy.x - this.viewX, enemy.y - this.viewY, enemy);
            }
        }

        // ── Attack slash arc (scales with player level) ──
        if (player.attacking && player.attackFrame < 2.5) {
            const ctx = r._entityLayer.ctx;
            const pcx = (player.x - this.viewX) * 32 + 16;
            const pcy = (player.y - this.viewY) * 32 + 16;
            const dir = player.attackDir || player.facing || { x: 1, y: 0 };
            const baseAngle = Math.atan2(dir.y, dir.x) - Math.PI * 0.5;
            const progress = Math.min(1, player.attackFrame / 2.5);

            // Arc grows with level: base 1.1 rad → up to 1.8 rad at level 20+
            const levelScale = Math.min(1, (player.level || 1) / 20);
            const swingSpan = Math.PI * (1.1 + levelScale * 0.7);
            const arcRadius = 26 + levelScale * 12;     // 26 → 38
            const outerWidth = 14 + levelScale * 8;      // 14 → 22
            const innerWidth = 4 + levelScale * 3;       // 4 → 7

            const endAngle = baseAngle + swingSpan * progress;
            const alpha = 0.85 * (1 - progress * 0.6);

            ctx.save();
            ctx.globalAlpha = alpha;
            // Outer glow arc
            ctx.strokeStyle = 'rgba(255,220,80,0.6)';
            ctx.lineWidth = outerWidth;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#ffa020';
            ctx.shadowBlur = 12 + levelScale * 8;
            ctx.beginPath();
            ctx.arc(pcx, pcy, arcRadius, baseAngle, endAngle);
            ctx.stroke();
            // Inner bright arc
            ctx.strokeStyle = '#fff8e0';
            ctx.lineWidth = innerWidth;
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(pcx, pcy, arcRadius, baseAngle, endAngle);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // ── Player ──
        // Power aura — visible from level 5+, grows with level
        if (player.hp > 0 && player.level >= 5 && !(player.hp <= player.getMaxHp() * 0.2)) {
            const ctx = r.getCtx();
            const px = (player.x - this.viewX) * 32 + 16;
            const py = (player.y - this.viewY) * 32 + 16;
            const lvlScale = Math.min(1, (player.level - 5) / 15); // 0→1 over levels 5-20
            const auraAlpha = 0.08 + lvlScale * 0.12;
            const auraRadius = 16 + lvlScale * 10;
            const pulse = auraAlpha + Math.sin(Game.renderer.time * 3) * 0.03;
            ctx.save();
            ctx.globalAlpha = pulse;
            const grad = ctx.createRadialGradient(px, py, 2, px, py, auraRadius);
            grad.addColorStop(0, 'rgba(100,180,255,0.5)');
            grad.addColorStop(1, 'rgba(100,180,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, auraRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Desperate Fury aura (below 20% HP)
        if (player.hp > 0 && player.hp <= player.getMaxHp() * 0.2) {
            const ctx = r.getCtx();
            const px = (player.x - this.viewX) * 32 + 16;
            const py = (player.y - this.viewY) * 32 + 16;
            const pulse = 0.3 + Math.sin(Game.renderer.time * 8) * 0.15;
            ctx.save();
            ctx.globalAlpha = pulse;
            const grad = ctx.createRadialGradient(px, py, 4, px, py, 24);
            grad.addColorStop(0, 'rgba(255,60,20,0.6)');
            grad.addColorStop(1, 'rgba(255,60,20,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        r.putPlayer(player.x - this.viewX, player.y - this.viewY, player);

        // ── Ground slam warning tiles ──
        if (this.map && this.map.enemies) {
            const ctx = r.getCtx();
            for (const enemy of this.map.enemies) {
                if (enemy._groundSlamWarning && enemy.hp > 0) {
                    const warn = enemy._groundSlamWarning;
                    const pulse = 0.3 + 0.4 * Math.sin(warn.timer * 20);
                    ctx.save();
                    ctx.fillStyle = `rgba(255,60,0,${pulse})`;
                    for (const st of warn.tiles) {
                        const sx = (st.x - this.viewX) * 32;
                        const sy = (st.y - this.viewY) * 32;
                        if (sx >= 0 && sx < ctx.canvas.width && sy >= 0 && sy < 576) {
                            ctx.fillRect(sx, sy, 32, 32);
                        }
                    }
                    ctx.restore();
                }
            }
        }

        // ── Boss victory banner ──
        if (this._bossVictoryTimer > 0) {
            const ctx = r.getCtx();
            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(0, 280, ctx.canvas.width, 80);
            ctx.globalAlpha = 1;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 32px "Courier New"';
            ctx.fillText('★ BOSS DEFEATED ★', 400, 330);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
            ctx.restore();
        }

        // ── Combat floating text / particles ──
        Combat.render(r, this.viewX, this.viewY);

        // ── Ability visual effects ──
        // Dash ghost trails
        if (Abilities._dashGhosts && Abilities._dashGhosts.length > 0) {
            const ctx = r.getCtx();
            for (const ghost of Abilities._dashGhosts) {
                const gx = (ghost.x - this.viewX) * 32;
                const gy = (ghost.y - this.viewY) * 32;
                if (gx >= 0 && gx < ctx.canvas.width && gy >= 0 && gy < 576) {
                    ctx.save();
                    ctx.globalAlpha = ghost.alpha * 0.35;
                    ctx.fillStyle = '#44aaff';
                    ctx.beginPath();
                    ctx.arc(gx + 16, gy + 16, 14, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
        }
        // Whirlwind ring effect
        if (Abilities._whirlEffect) {
            const we = Abilities._whirlEffect;
            const wx = (we.x - this.viewX) * 32 + 16;
            const wy = (we.y - this.viewY) * 32 + 16;
            const ctx = r.getCtx();
            const prog = we.timer / we.duration;
            const radius = 32 + prog * 48;
            ctx.save();
            ctx.globalAlpha = (1 - prog) * 0.5;
            ctx.strokeStyle = '#ffd040';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffd040';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(wx, wy, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        // Execute slash lines
        if (Abilities._slashLines && Abilities._slashLines.length > 0) {
            const ctx = r.getCtx();
            for (const sl of Abilities._slashLines) {
                const alpha = 1 - sl.timer / sl.duration;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = sl.color;
                ctx.lineWidth = 3;
                ctx.shadowColor = sl.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(sl.x1 - this.viewX * 32, sl.y1 - this.viewY * 32);
                ctx.lineTo(sl.x2 - this.viewX * 32, sl.y2 - this.viewY * 32);
                ctx.stroke();
                ctx.restore();
            }
        }
        // Screen flash (execute kill)
        if (Abilities._screenFlash > 0) {
            const ctx = r.getCtx();
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, Abilities._screenFlash * 3) + ')';
            ctx.fillRect(0, 0, r.canvas.width, r.canvas.height);
            ctx.restore();
        }

        // ── Death save golden flash ──
        if (this._deathSaveFlash > 0) {
            const ctx = r.getCtx();
            ctx.save();
            ctx.fillStyle = 'rgba(255,215,0,' + Math.min(0.5, this._deathSaveFlash) + ')';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }

        // ── Enemy proximity tension vignette ──
        if (this.mode === 'play' && this.map && this.map.enemies) {
            const player = Game.state.player;
            let closestDist = 999;
            for (const e of this.map.enemies) {
                if (e.hp <= 0) continue;
                const edx = e.x - player.x, edy = e.y - player.y;
                const eDist = Math.sqrt(edx * edx + edy * edy);
                // Only count enemies outside FOV but within proximity range
                if (eDist < closestDist && eDist > 6 && eDist < 12) {
                    closestDist = eDist;
                }
            }
            if (closestDist < 12) {
                const ctx = r.getCtx();
                const intensity = (1 - (closestDist - 6) / 6); // 1.0 at dist=6, 0.0 at dist=12
                const pulse = 0.5 + 0.5 * Math.sin(Game.renderer.time * 4);
                const alpha = intensity * pulse * 0.08;
                ctx.save();
                // Red vignette at screen edges
                const grd = ctx.createRadialGradient(400, 360, 200, 400, 360, 420);
                grd.addColorStop(0, 'rgba(255,0,0,0)');
                grd.addColorStop(1, `rgba(255,20,0,${alpha})`);
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
            }
        }

        // ── Loot fanfare particles ──
        if (this._lootFanfare.length > 0) {
            const ctx = r.getCtx();
            ctx.save();
            for (const lf of this._lootFanfare) {
                const t = lf.timer / lf.duration;
                const alpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
                const sx = lf.x + lf.vx * lf.timer - this.viewX * 32;
                const sy = lf.y + lf.vy * lf.timer - this.viewY * 32;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = lf.color;
                ctx.shadowColor = lf.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(sx, sy, lf.size * (1 - t * 0.5), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // ── Vignette (dark edge overlay over viewport, under HUD) ──
        r.drawVignette(0.55);

        // ── HUD ──
        r.drawHUD(player, Game.state.currentFloor,
            this.map.get(player.x, player.y),
            player.gold || 0);
        r.drawMinimap(this.map, player.x, player.y);
        r.drawCombatLog(this.combatLog);

        // ── Kill streak HUD ──
        if (this._killStreak >= 3) {
            const ctx = r.getCtx();
            ctx.save();
            const flash = this._killStreakFlash > 0 ? 1.0 : 0.7;
            const scale = this._killStreakFlash > 0 ? 1.0 + this._killStreakFlash * 0.3 : 1.0;
            ctx.globalAlpha = flash;
            ctx.fillStyle = this._killStreak >= 10 ? '#ff4020' : '#ffa020';
            ctx.font = `bold ${Math.floor(12 * scale)}px "Courier New"`;
            ctx.textAlign = 'right';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 3;
            ctx.fillText(`× ${this._killStreak} KILLS`, 790, 28);
            ctx.textAlign = 'left';
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // ── Victory overlay ──
        if (Game.state.victory) {
            const ctx = r.getCtx();
            const fade = Math.min(1, this.victoryTimer / 2.0);
            ctx.fillStyle = `rgba(0,0,0,${0.75 * fade})`;
            ctx.fillRect(0, 0, r.canvas.width, r.canvas.height);

            ctx.save();
            ctx.globalAlpha = fade;

            // Golden glow title
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 52px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('VICTORY', r.canvas.width / 2, 160);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ff8040';
            ctx.font = 'bold 22px "Courier New"';
            ctx.fillText('Malphas the Demon Lord is dead.', r.canvas.width / 2, 220);

            ctx.fillStyle = '#ffddcc';
            ctx.font = '16px "Courier New"';
            ctx.fillText('Your children are free from the abyss.', r.canvas.width / 2, 260);
            ctx.fillText('DungeonTown endures.', r.canvas.width / 2, 285);

            ctx.fillStyle = '#c0c0ff';
            ctx.font = 'italic 14px "Courier New"';
            ctx.fillText('"From blood and ruin, a cursed town', r.canvas.width / 2, 330);
            ctx.fillText('  claws its way back to the light."', r.canvas.width / 2, 350);

            if (this.victoryTimer > 3) {
                ctx.fillStyle = '#888888';
                ctx.font = '13px "Courier New"';
                ctx.fillText('[Enter] Return to village', r.canvas.width / 2, 420);
            }

            ctx.textAlign = 'left';
            ctx.restore();
            return; // skip death overlay
        }

        // ── Death overlay with rich run summary ──
        if (this.deathTimer > 0) {
            const ctx = r.getCtx();
            const elapsed = 5.0 - this.deathTimer;
            const deathFade = Math.min(1, elapsed / 1.2);
            // Red vignette
            const vg = ctx.createRadialGradient(400, 360, 50, 400, 360, 400);
            vg.addColorStop(0, 'rgba(40,0,0,' + (0.3 * deathFade) + ')');
            vg.addColorStop(1, 'rgba(120,0,0,' + (0.85 * deathFade) + ')');
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.save();
            ctx.textAlign = 'center';
            const cx = 400;

            // "YOU DIED" title
            ctx.globalAlpha = deathFade;
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#ff2020';
            ctx.font = 'bold 56px "Courier New"';
            ctx.fillText('YOU DIED', cx, 140);
            ctx.shadowBlur = 0;

            // Death cause subtitle
            const stats = Game.state.runStats || { kills: 0, floorsReached: 1, goldAtStart: 0,
                itemsFound: 0, goldEarned: 0, damageDealt: 0, damageTaken: 0,
                potionsUsed: 0, runTime: 0, deathCause: null, deathFloor: 0 };
            const cause = stats.deathCause || 'the dungeon';
            const floor = stats.deathFloor || Game.state.currentFloor;
            ctx.fillStyle = '#cc4444';
            ctx.font = 'italic 15px "Courier New"';
            ctx.fillText(`Slain by ${cause} on Floor ${floor}`, cx, 172);

            // Run summary panel — fades in after title
            const summaryFade = Math.min(1, Math.max(0, (elapsed - 0.8) / 1.0));
            ctx.globalAlpha = summaryFade;

            // Panel background
            const pw = 360, ph = 310;
            const px = cx - pw / 2, py = 195;
            ctx.fillStyle = 'rgba(8,3,2,0.82)';
            ctx.fillRect(px, py, pw, ph);
            ctx.strokeStyle = '#6a2020';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, pw, ph);

            // Panel title
            ctx.fillStyle = '#886655';
            ctx.font = 'bold 13px "Courier New"';
            ctx.fillText('─── RUN SUMMARY ───', cx, py + 22);

            // Stats rows (left-aligned labels, right-aligned values)
            const rows = [];
            const minutes = Math.floor((stats.runTime || 0) / 60);
            const seconds = Math.floor((stats.runTime || 0) % 60);
            const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            rows.push({ label: 'Floors Reached', value: `${stats.floorsReached}`, color: '#aa8866' });
            rows.push({ label: 'Enemies Slain', value: `${stats.kills}`, color: '#aa8866' });
            rows.push({ label: 'Bosses Killed', value: `${stats.bossesKilled || 0}`, color: '#ddaa44' });
            rows.push({ label: 'Damage Dealt', value: `${stats.damageDealt}`, color: '#aa8866' });
            rows.push({ label: 'Items Found', value: `${stats.itemsFound}`, color: '#aa8866' });
            rows.push({ label: 'Gold Earned', value: `${stats.goldEarned}`, color: '#ddaa44' });
            rows.push({ label: 'Time', value: timeStr, color: '#aa8866' });
            if (stats.bestKill) rows.push({ label: 'Strongest Kill', value: stats.bestKill, color: '#ff9040' });

            ctx.font = '13px "Courier New"';
            let ry = py + 44;
            for (const row of rows) {
                ctx.fillStyle = '#887766';
                ctx.textAlign = 'left';
                ctx.fillText(row.label, px + 24, ry);
                ctx.fillStyle = row.color;
                ctx.textAlign = 'right';
                ctx.fillText(row.value, px + pw - 24, ry);
                ry += 19;
            }

            // Divider line
            ry += 4;
            ctx.strokeStyle = 'rgba(100,60,40,0.4)';
            ctx.beginPath();
            ctx.moveTo(px + 20, ry);
            ctx.lineTo(px + pw - 20, ry);
            ctx.stroke();
            ry += 14;

            // Gold lost
            const player = Game.state.player;
            const savePercent = player.getDeathGoldSavePercent ? player.getDeathGoldSavePercent() : 0;
            const goldLost = Math.floor((player.gold || 0) * 0.5 * (1 - savePercent));
            ctx.textAlign = 'center';
            ctx.fillStyle = '#cc5533';
            ctx.font = 'bold 14px "Courier New"';
            ctx.fillText(`Gold Lost: ${goldLost}`, cx, ry);
            ry += 18;
            if (savePercent > 0) {
                ctx.fillStyle = '#c040ff';
                ctx.font = '11px "Courier New"';
                ctx.fillText(`(Death's Embrace saved ${Math.floor(savePercent * 100)}%)`, cx, ry);
                ry += 16;
            }

            // Run rating
            ry += 4;
            const rating = this._getRunRating(stats);
            ctx.fillStyle = rating.color;
            ctx.font = 'bold 22px "Courier New"';
            ctx.shadowColor = rating.color;
            ctx.shadowBlur = 8;
            ctx.fillText(`RANK: ${rating.grade}`, cx, ry);
            ctx.shadowBlur = 0;
            ry += 18;

            // Narrative flavor based on run performance
            ctx.font = 'italic 12px "Courier New"';
            ctx.fillStyle = '#997766';
            let flavor;
            if (stats.floorsReached >= 40) flavor = 'So close to the end... the town mourns.';
            else if (stats.floorsReached >= 25) flavor = 'The deep floors are unforgiving.';
            else if (stats.kills >= 50) flavor = 'A warrior\'s death. The town remembers.';
            else if (stats.floorsReached >= 10) flavor = 'Each attempt carves the path deeper.';
            else if (stats.kills === 0) flavor = 'Retreat is not defeat... not yet.';
            else flavor = 'The dungeon is patient. You will return.';
            ctx.fillText(`"${flavor}"`, cx, ry);

            // Skip prompt
            const skipFade = Math.min(1, Math.max(0, (elapsed - 2.0) / 0.5));
            ctx.globalAlpha = skipFade * (0.5 + 0.3 * Math.sin(elapsed * 3));
            ctx.font = '12px "Courier New"';
            ctx.fillStyle = '#887766';
            ctx.fillText('[Enter / Space] Continue', cx, py + ph - 8);

            ctx.textAlign = 'left';
            ctx.restore();
        }

        // ── Ability unlock dramatic notification ──
        if (this._abilityUnlockAnim) {
            const ua = this._abilityUnlockAnim;
            const t = ua.timer / ua.maxTimer; // 1→0
            // Fade in quickly, hold, then fade out
            const fadeIn = Math.min(1, (ua.maxTimer - ua.timer) / 0.3);
            const fadeOut = ua.timer < 0.6 ? ua.timer / 0.6 : 1;
            const alpha = Math.min(fadeIn, fadeOut);
            const ctx = r.getCtx();
            ctx.save();
            ctx.globalAlpha = alpha * 0.82;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, r.canvas.height / 2 - 70, r.canvas.width, 140);
            ctx.globalAlpha = alpha;
            ctx.shadowColor = '#ffd040';
            ctx.shadowBlur = 24;
            ctx.fillStyle = '#ffd040';
            ctx.font = 'bold 38px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(`✦ ${ua.name} UNLOCKED ✦`, r.canvas.width / 2, r.canvas.height / 2 - 12);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffaa30';
            ctx.font = '18px "Courier New"';
            ctx.fillText(`Press [${ua.key}] to unleash`, r.canvas.width / 2, r.canvas.height / 2 + 22);
            ctx.textAlign = 'left';
            ctx.restore();
        }

        // ── Boss intro cinematic ──
        if (this._bossIntro) {
            const bi = this._bossIntro;
            const elapsed = bi.maxTimer - bi.timer;
            const ctx = r.getCtx();
            ctx.save();

            // Letterbox bars (cinematic widescreen)
            const barH = 80;
            const barSlide = Math.min(1, elapsed / 0.4);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, ctx.canvas.width, barH * barSlide);
            ctx.fillRect(0, ctx.canvas.height - barH * barSlide, ctx.canvas.width, barH * barSlide);

            // Dark vignette overlay
            const fade = Math.min(1, elapsed / 0.6);
            ctx.fillStyle = `rgba(0,0,0,${0.5 * fade})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // Name card — fade in, hold, then slide out
            const nameAlpha = elapsed < 0.5 ? elapsed / 0.5
                : bi.timer < 0.4 ? bi.timer / 0.4 : 1;
            ctx.globalAlpha = nameAlpha;
            ctx.textAlign = 'center';

            // Boss tier label
            const tierLabel = bi.tier === 'final' ? '★ FINAL BOSS ★'
                : bi.tier === 'major' ? '◆ MAJOR BOSS ◆' : '▸ MINI-BOSS ▸';
            const tierColor = bi.tier === 'final' ? '#ff0044'
                : bi.tier === 'major' ? '#ff8800' : '#ffcc00';

            ctx.fillStyle = tierColor;
            ctx.font = 'bold 14px "Courier New"';
            ctx.fillText(tierLabel, 400, 300);

            // Boss name with glow
            ctx.shadowColor = tierColor;
            ctx.shadowBlur = bi.tier === 'final' ? 30 : 20;
            ctx.fillStyle = '#fff';
            ctx.font = bi.tier === 'final' ? 'bold 42px "Courier New"'
                : bi.tier === 'major' ? 'bold 36px "Courier New"'
                : 'bold 28px "Courier New"';
            ctx.fillText(bi.name, 400, 340);
            ctx.shadowBlur = 0;

            // Decorative line
            const lineW = Math.min(300, elapsed * 600);
            ctx.strokeStyle = tierColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = nameAlpha * 0.7;
            ctx.beginPath();
            ctx.moveTo(400 - lineW / 2, 355);
            ctx.lineTo(400 + lineW / 2, 355);
            ctx.stroke();

            // Floor label
            ctx.globalAlpha = nameAlpha * 0.6;
            ctx.fillStyle = '#888';
            ctx.font = '13px "Courier New"';
            ctx.fillText(`Floor ${Game.state.currentFloor}`, 400, 380);

            ctx.textAlign = 'left';
            ctx.restore();
        }

        // ── Event interaction prompt ──
        if (this.mode === 'play' && this._nearEvent && !this._nearEvent.used) {
            const ctx = r.getCtx();
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(r.canvas.width / 2 - 100, 540, 200, 24);
            ctx.fillStyle = '#ffd700';
            ctx.font = '13px "Courier New"';
            ctx.textAlign = 'center';
            const evDef = DungeonEvents.EVENTS[this._nearEvent.id];
            ctx.fillText('Press [E] ' + (evDef ? evDef.name : ''), r.canvas.width / 2, 557);
            ctx.textAlign = 'left';
            ctx.restore();
        }

        // ── Tutorial hint (top-center, non-blocking) ──
        if (this._tutorialHint) {
            const alpha = this._tutorialHint.timer < 0.3
                ? this._tutorialHint.timer / 0.3
                : this._tutorialHint.timer > 5 ? 1 - (this._tutorialHint.timer - 5) : 1;
            r.drawTutorialHint(this._tutorialHint.text, Math.max(0, alpha));
        }

        // ── Level-up pick overlay ──
        if (this.mode === 'levelUpPick' && this._levelUpPicks) {
            const ctx = r.getCtx();
            const cw = ctx.canvas.width;
            const ch = ctx.canvas.height;
            // Dim background
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, cw, ch);
            // Panel
            const pw = 400, ph = 240;
            const px = Math.floor((cw - pw) / 2);
            const py = Math.floor((ch - ph) / 2);
            ctx.fillStyle = '#0a0a1a';
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.fillRect(px, py, pw, ph);
            ctx.strokeRect(px, py, pw, ph);
            // Title
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('★ LEVEL UP! ★', px + pw / 2, py + 28);
            ctx.font = '12px monospace';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Choose an upgrade:', px + pw / 2, py + 48);
            // Options
            for (let i = 0; i < 3; i++) {
                const pick = this._levelUpPicks[i];
                const oy = py + 70 + i * 52;
                const selected = i === this._levelUpPickIndex;
                // Option background
                ctx.fillStyle = selected ? '#1a1a30' : '#0d0d18';
                ctx.strokeStyle = selected ? pick.color : '#333';
                ctx.lineWidth = selected ? 2 : 1;
                ctx.fillRect(px + 16, oy, pw - 32, 44);
                ctx.strokeRect(px + 16, oy, pw - 32, 44);
                // Label
                ctx.fillStyle = selected ? pick.color : '#888';
                ctx.font = selected ? 'bold 14px monospace' : '14px monospace';
                ctx.textAlign = 'left';
                const marker = selected ? '▸ ' : '  ';
                ctx.fillText(marker + pick.label, px + 28, oy + 18);
                // Description
                ctx.fillStyle = selected ? '#ccc' : '#555';
                ctx.font = '11px monospace';
                ctx.fillText('  ' + pick.desc, px + 28, oy + 36);
            }
            // Hint
            ctx.fillStyle = '#555';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[W/S] Choose  [Enter] Select', px + pw / 2, py + ph - 14);
            ctx.textAlign = 'left';
        }

        // ── Escape confirmation overlay ──
        if (this.mode === 'escapeConfirm') {
            r.drawEscapeConfirm(Game.state.currentFloor);
        }

        // ── Escape summary overlay ──
        if (this.mode === 'escapeSummary') {
            this._drawEscapeSummary(r.getCtx(), this._escapeSummaryTimer);
        }

        // ── Event prompt overlay (shrine, fountain, cursed chest) ──
        if (this.mode === 'eventPrompt' && this._eventTarget) {
            const evDef = DungeonEvents.EVENTS[this._eventTarget.id];
            r.drawEventPrompt(evDef);
        }

        // ── Merchant panel ──
        if (this.mode === 'merchant') {
            r.drawMerchantPanel(player, this._merchantItems, this._merchantIndex);
        }

        // ── Prisoner choice panel ──
        if (this.mode === 'prisonerChoice') {
            r.drawPrisonerPanel(this._prisonerIndex);
        }

        // ── Altar choice overlay (room-clear mini-event) ──
        if (this.mode === 'altarChoice' && this._altarOffering) {
            const ctx = r.ctx;
            const cw = ctx.canvas.width;
            const ch = ctx.canvas.height;
            // Dim background
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, cw, ch);
            // Panel
            const pw = 360, ph = 140;
            const px = Math.floor((cw - pw) / 2);
            const py = Math.floor((ch - ph) / 2);
            ctx.fillStyle = '#1a1020';
            ctx.strokeStyle = '#c080ff';
            ctx.lineWidth = 2;
            ctx.fillRect(px, py, pw, ph);
            ctx.strokeRect(px, py, pw, ph);
            // Title
            ctx.fillStyle = '#c080ff';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this._altarOffering.desc, px + pw / 2, py + 24);
            // Options
            for (let i = 0; i < this._altarOffering.options.length; i++) {
                const opt = this._altarOffering.options[i];
                const oy = py + 52 + i * 32;
                const selected = i === this._altarIndex;
                ctx.fillStyle = selected ? '#ffffff' : '#888888';
                ctx.font = selected ? 'bold 13px monospace' : '13px monospace';
                ctx.textAlign = 'left';
                const marker = selected ? '> ' : '  ';
                ctx.fillText(marker + opt.label, px + 20, oy);
            }
            // Hint
            ctx.fillStyle = '#666';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[W/S] Choose  [Enter] Accept  [Esc] Skip', px + pw / 2, py + ph - 12);
            ctx.textAlign = 'left';
        }

        // ── Pause menu overlay ──
        if (this.mode === 'paused') {
            r.drawPauseMenu(this._pauseIndex);
        }

        // ── Settings overlay ──
        if (this.mode === 'settings') {
            r.drawSettingsPanel(Game.settings, this._settingsIndex);
        }

        // ── Inventory / Character overlays ──
        if (UI.isOpen()) {
            if (UI.currentMenu === 'inventory') {
                r.drawInventoryPanel(player, UI.selectedIndex);
            } else if (UI.currentMenu === 'character') {
                r.drawCharacterPanel(player, UI.selectedIndex);
            }
        }
    },
};
