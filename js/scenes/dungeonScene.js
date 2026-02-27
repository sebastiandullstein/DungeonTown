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
    // Phase 1: Escape + Events
    mode: 'play', // 'play','floorSelect','escapeConfirm','eventPrompt','merchant','prisonerChoice'
    floorEvents: [],
    _floorOptions: [],
    _floorSelectIndex: 0,
    _eventTarget: null,
    _merchantItems: [],
    _merchantIndex: 0,
    _prisonerIndex: 0,

    init() {},

    enter(data) {
        // Floor select mode
        if (data && data.floorSelect && Game.state.maxFloorReached >= 5) {
            this.mode = 'floorSelect';
            this._floorOptions = [1];
            for (let f = 5; f <= Game.state.maxFloorReached; f += 5) {
                this._floorOptions.push(f);
            }
            this._floorSelectIndex = 0;
            return;
        }
        this.mode = 'play';
        const floor = Game.state.currentFloor;
        this.map = DungeonGenerator.generate(floor);
        const p = Game.state.player;
        p.x = this.map.playerStart.x;
        p.y = this.map.playerStart.y;
        p.attacking = false;
        p.invulnTimer = 0;
        this.deathTimer = 0;
        this.victoryTimer = 0;
        this.chestAnims = [];
        this._abilityUnlockAnim = null;
        this._trackedLevel = p.level;
        // Run stats tracking
        if (!Game.state.runStats || floor === 1) {
            Game.state.runStats = { kills: 0, floorsReached: floor, goldAtStart: p.gold };
        }
        Game.state.runStats.floorsReached = Math.max(Game.state.runStats.floorsReached, floor);
        // Generate floor events
        this.floorEvents = DungeonEvents.generate(floor, this.map);
        // Clear run bonuses on floor 1
        if (floor === 1) p._runBonuses = {};

        Audio.startMusic('dungeon');

        if (floor === 50) {
            Audio.play('bossEncounter');
            Game.notify('Floor 50 — The Demon Lord awaits!', '#ff2020');
            Game.notify('Rescue your children. End this.', '#ff8040');
        } else if (floor % 10 === 0) {
            Audio.play('bossEncounter');
            Game.notify(`Floor ${floor} — MAJOR BOSS FLOOR!`, '#ff4400');
        } else if (floor % 5 === 0) {
            Game.notify(`Floor ${floor} — Mini-Boss lurks ahead...`, '#ff8800');
        } else {
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
                this.mode = 'play';
                this.returnToVillage();
                return;
            }
            if (Input.wasPressed('Escape') || Input.wasPressed('n') || Input.wasPressed('N')) {
                this.mode = 'play';
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
            if (this.deathTimer <= 0) {
                const p = Game.state.player;
                p.hp = p.maxHp;
                p.mp = p.maxMp;
                // Lose gold on death (reduced by Death's Embrace blessing)
                const savePercent = p.getDeathGoldSavePercent ? p.getDeathGoldSavePercent() : 0;
                const lossPercent = 0.5 * (1 - savePercent);
                const goldLost = Math.floor((p.gold || 0) * lossPercent);
                p.gold = (p.gold || 0) - goldLost;
                // Clear tavern buffs on death
                if (p.clearTavernBuffs) p.clearTavernBuffs();
                Game.state.currentFloor = 1;
                Game.switchScene('village', { fromDeath: true });
            }
            return;
        }

        // UI menus take priority
        if (UI.isOpen()) {
            UI.update(dt);
            return;
        }

        if (Input.wasPressed('i') || Input.wasPressed('I')) { UI.toggle('inventory'); return; }
        if (Input.wasPressed('c') || Input.wasPressed('C')) { UI.toggle('character'); return; }
        if (Input.wasPressed('Escape')) { this.returnToVillage(); return; }

        const player = Game.state.player;

        // Ability cooldowns and input
        Abilities.update(dt);
        if (Input.wasPressed('Shift')) {
            Abilities.tryActivate('dash', player, this.map, this.map.enemies);
        }
        if (Input.wasPressed('q') || Input.wasPressed('Q')) {
            Abilities.tryActivate('whirlwind', player, this.map, this.map.enemies);
        }
        if ((Input.wasPressed('e') || Input.wasPressed('E')) && !this._nearEvent) {
            Abilities.tryActivate('execute', player, this.map, this.map.enemies);
        }

        player.update(dt, this.map);
        const fovRadius = 6 + (player.getFOVBonus ? player.getFOVBonus() : 0);
        this.map.revealAround(player.x, player.y, fovRadius);

        // Stairs
        if (this.map.get(player.x, player.y) === TILE.STAIRS_DOWN) {
            if (Input.wasPressed('Enter') || Input.wasPressed('>') || Input.wasPressed('.')) {
                Game.state.currentFloor++;
                if (Game.state.currentFloor > Game.state.maxFloorReached)
                    Game.state.maxFloorReached = Game.state.currentFloor;
                this.enter();
                return;
            }
        }
        if (this.map.get(player.x, player.y) === TILE.STAIRS_UP) {
            if (Input.wasPressed('Enter') || Input.wasPressed('<') || Input.wasPressed(',')) {
                if (Game.state.currentFloor > 1) {
                    this.mode = 'escapeConfirm';
                    return;
                }
                this.returnToVillage();
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
                    Game.notify(`+${item.value} Gold`, '#ffd020');
                    this.map.items.splice(i, 1);
                } else {
                    if (player.addToInventory(item)) {
                        Game.notify(`Picked up ${item.name}`, '#40c0e0');
                        this.map.items.splice(i, 1);
                    } else {
                        Game.notify('Inventory full!', '#f00');
                    }
                }
            }
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
        // Remove fully-dead enemies (after death animation)
        this.map.enemies = this.map.enemies.filter(e => e.hp > 0 || (e.deathTimer !== undefined && e.deathTimer > 0));

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

        // Death check
        if (player.hp <= 0) {
            this.deathTimer = 3.0;
            Audio.play('playerDeath');
            Game.renderer.shake(15, 0.8);
            Game.notify('YOUR SOUL IS CLAIMED', '#ff0000');
        }
    },

    _findEvent(x, y) {
        for (const ev of this.floorEvents) {
            if (ev.x === x && ev.y === y) return ev;
        }
        return null;
    },

    returnToVillage() {
        const escaped = Game.state.currentFloor > 1;
        if (escaped && Math.random() < 0.3) {
            Game.state.village.resolveRaid(Game.state.currentFloor);
        }
        Game.state.village.refreshRecruits();
        Audio.startMusic('village');
        if (escaped) {
            Game.notify('Escaped the dungeon safely.', '#40e0e0');
            Game.save();
        }
        Game.switchScene('village');
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

        // ── Items (only in FOV) ──
        for (const item of this.map.items) {
            if (this.map.isInFOV(player.x, player.y, item.x, item.y)) {
                r.putItem(item.x - this.viewX, item.y - this.viewY, item);
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

        // ── Attack tiles ──
        if (player.attacking) {
            const tiles = player.getAttackTiles();
            const progress = player.attackFrame / 3.0;
            for (const t of tiles) {
                r.putAttack(t.x - this.viewX, t.y - this.viewY, progress);
            }
        }

        // ── Player ──
        r.putPlayer(player.x - this.viewX, player.y - this.viewY, player);

        // ── Combat floating text / particles ──
        Combat.render(r, this.viewX, this.viewY);

        // ── Ability visual effects ──
        // Dash ghost trails
        if (Abilities._dashGhosts && Abilities._dashGhosts.length > 0) {
            const ctx = r.getCtx();
            for (const ghost of Abilities._dashGhosts) {
                const gx = (ghost.x - this.viewX) * 32;
                const gy = (ghost.y - this.viewY) * 32;
                if (gx >= 0 && gx < 800 && gy >= 0 && gy < 576) {
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

        // ── Vignette (dark edge overlay over viewport, under HUD) ──
        r.drawVignette(0.55);

        // ── HUD ──
        r.drawHUD(player, Game.state.currentFloor,
            this.map.get(player.x, player.y),
            player.gold || 0);
        r.drawMinimap(this.map, player.x, player.y);

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

        // ── Death overlay with run summary ──
        if (this.deathTimer > 0) {
            const ctx = r.getCtx();
            const deathFade = Math.min(1, (3.0 - this.deathTimer) / 1.5);
            // Red vignette
            const vg = ctx.createRadialGradient(r.canvas.width/2, r.canvas.height/2, 50, r.canvas.width/2, r.canvas.height/2, r.canvas.width/2);
            vg.addColorStop(0, 'rgba(40,0,0,' + (0.3 * deathFade) + ')');
            vg.addColorStop(1, 'rgba(120,0,0,' + (0.8 * deathFade) + ')');
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, r.canvas.width, r.canvas.height);
            ctx.save();
            ctx.globalAlpha = deathFade;
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#ff2020';
            ctx.font = 'bold 64px "Courier New"';
            ctx.textAlign = 'center';
            const cx = r.canvas.width / 2;
            ctx.fillText('YOU DIED', cx, r.canvas.height / 2 - 60);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#cc4444';
            ctx.font = 'italic 16px "Courier New"';
            ctx.fillText('The dungeon claims another soul...', cx, r.canvas.height / 2 - 20);

            // Run summary
            const stats = Game.state.runStats || { kills: 0, floorsReached: 1, goldAtStart: 0 };
            const player = Game.state.player;
            const savePercent = player.getDeathGoldSavePercent ? player.getDeathGoldSavePercent() : 0;
            const goldLost = Math.floor((player.gold || 0) * 0.5 * (1 - savePercent));

            const summaryFade = Math.min(1, (3.0 - this.deathTimer) / 2.5);
            ctx.globalAlpha = summaryFade;

            // Summary box
            ctx.fillStyle = 'rgba(10,4,2,0.7)';
            ctx.fillRect(cx - 160, r.canvas.height / 2, 320, 100);
            ctx.strokeStyle = '#6a2020';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx - 160, r.canvas.height / 2, 320, 100);

            ctx.font = '13px "Courier New"';
            let sy = r.canvas.height / 2 + 22;
            ctx.fillStyle = '#aa6666';
            ctx.fillText(`Floors Reached: ${stats.floorsReached}`, cx, sy);
            sy += 20;
            ctx.fillText(`Enemies Slain: ${stats.kills}`, cx, sy);
            sy += 20;
            ctx.fillStyle = '#cc6644';
            ctx.fillText(`Gold Lost: ${goldLost}`, cx, sy);
            sy += 20;
            if (savePercent > 0) {
                ctx.fillStyle = '#c040ff';
                ctx.font = '11px "Courier New"';
                ctx.fillText(`(Death's Embrace saved ${Math.floor(savePercent * 100)}%)`, cx, sy);
            }

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

        // ── Escape confirmation overlay ──
        if (this.mode === 'escapeConfirm') {
            r.drawEscapeConfirm(Game.state.currentFloor);
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
