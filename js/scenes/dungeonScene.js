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

    init() {},

    enter() {
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
                // Lose half personal gold on death
                p.gold = Math.floor((p.gold || 0) * 0.5);
                Game.state.currentFloor = 1;
                Game.notify('You died! Lost half your gold...', '#ff4040');
                Game.switchScene('village');
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
        if (Input.wasPressed('e') || Input.wasPressed('E')) {
            Abilities.tryActivate('execute', player, this.map, this.map.enemies);
        }

        player.update(dt, this.map);
        this.map.revealAround(player.x, player.y);

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
                this.returnToVillage();
                return;
            }
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

    returnToVillage() {
        if (Game.state.currentFloor > 1 && Math.random() < 0.3) {
            Game.state.village.resolveRaid(Game.state.currentFloor);
        }
        Game.state.village.refreshRecruits();
        Audio.startMusic('village');
        Game.switchScene('village');
    },

    render(r) {
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

        // ── Death overlay ──
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
            ctx.fillText('YOU DIED', r.canvas.width / 2, r.canvas.height / 2 - 40);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#cc4444';
            ctx.font = 'italic 18px "Courier New"';
            ctx.fillText('The dungeon claims another soul...', r.canvas.width / 2, r.canvas.height / 2 + 10);
            ctx.fillStyle = '#884444';
            ctx.font = '14px "Courier New"';
            ctx.fillText('Half your gold is lost to the abyss.', r.canvas.width / 2, r.canvas.height / 2 + 45);
            ctx.textAlign = 'left';
            ctx.restore();
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
