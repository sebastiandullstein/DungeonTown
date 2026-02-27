// UIRenderer — all HUD, panel, modal, title, and shop drawing

const UIRenderer = {

    // ─── Helpers ────────────────────────────────────────────────────────────

    _roundRect(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x,     y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x,     y,     x + r, y);
        ctx.closePath();
    },

    _drawPanel(ctx, x, y, w, h, title = '') {
        // Drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        this._roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 10);
        ctx.fillStyle = '#2a1a08';
        ctx.fill();
        ctx.restore();

        // Panel body (dark wood)
        const panelGrad = ctx.createLinearGradient(x, y, x, y + h);
        panelGrad.addColorStop(0,   '#2e1e0c');
        panelGrad.addColorStop(0.5, '#221608');
        panelGrad.addColorStop(1,   '#181004');
        this._roundRect(ctx, x, y, w, h, 8);
        ctx.fillStyle = panelGrad;
        ctx.fill();

        // Inner decorative border
        ctx.strokeStyle = '#6a4820';
        ctx.lineWidth = 2;
        this._roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 6);
        ctx.stroke();

        // Corner ornaments
        ctx.fillStyle = '#c8a030';
        const corners = [[x + 5, y + 5], [x + w - 5, y + 5], [x + 5, y + h - 5], [x + w - 5, y + h - 5]];
        for (const [cx2, cy2] of corners) {
            ctx.beginPath();
            ctx.arc(cx2, cy2, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Title banner
        if (title) {
            const bannerGrad = ctx.createLinearGradient(x + 5, y + 5, x + 5, y + 38);
            bannerGrad.addColorStop(0, '#5a3010');
            bannerGrad.addColorStop(1, '#321808');
            this._roundRect(ctx, x + 5, y + 5, w - 10, 33, 6);
            ctx.fillStyle = bannerGrad;
            ctx.fill();

            ctx.strokeStyle = '#8a5020';
            ctx.lineWidth = 1;
            this._roundRect(ctx, x + 5, y + 5, w - 10, 33, 6);
            ctx.stroke();

            // Divider line
            ctx.fillStyle = '#8a5020';
            ctx.fillRect(x + 5, y + 38, w - 10, 1);

            // Title text
            ctx.shadowColor = '#ffa040';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ffd060';
            ctx.font = 'bold 16px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(title, x + w / 2, y + 28);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
        }
    },

    _drawStatBar(ctx, x, y, w, h, current, max, fillColor, emptyColor, label, borderColor) {
        const pct = Math.max(0, Math.min(1, current / max));

        // Border
        this._roundRect(ctx, x - 1, y - 1, w + 2, h + 2, 4);
        ctx.fillStyle = borderColor || '#2a1008';
        ctx.fill();

        // Empty bg
        this._roundRect(ctx, x, y, w, h, 3);
        ctx.fillStyle = emptyColor;
        ctx.fill();

        // Fill
        if (pct > 0) {
            ctx.save();
            this._roundRect(ctx, x, y, w, h, 3);
            ctx.clip();

            const fillGrad = ctx.createLinearGradient(x, y, x, y + h);
            const c = fillColor;
            fillGrad.addColorStop(0,   this._lighten(c, 0.35));
            fillGrad.addColorStop(0.5, c);
            fillGrad.addColorStop(1,   this._darken(c, 0.3));
            ctx.fillStyle = fillGrad;
            ctx.fillRect(x, y, Math.floor(w * pct), h);

            // Gloss
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(x, y, Math.floor(w * pct), Math.floor(h * 0.45));

            ctx.restore();
        }

        // Label
        if (label) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.floor(h * 0.7)}px "Courier New"`;
            ctx.textAlign = 'center';
            ctx.fillText(`${current}/${max}`, x + w / 2, y + h - 3);
            ctx.textAlign = 'left';
        }
    },

    _drawIcon(ctx, x, y, type) {
        const cx = x + 8, cy = y + 8;
        ctx.save();
        switch (type) {
            case 'heart':
                ctx.fillStyle = '#e03030';
                ctx.shadowColor = '#ff4040';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.moveTo(cx, cy + 5);
                ctx.bezierCurveTo(cx - 10, cy - 2, cx - 14, cy - 8, cx - 8, cy - 10);
                ctx.bezierCurveTo(cx - 4, cy - 12, cx, cy - 8, cx, cy - 5);
                ctx.bezierCurveTo(cx, cy - 8, cx + 4, cy - 12, cx + 8, cy - 10);
                ctx.bezierCurveTo(cx + 14, cy - 8, cx + 10, cy - 2, cx, cy + 5);
                ctx.fill();
                break;
            case 'star':
                ctx.fillStyle = '#4060ee';
                ctx.shadowColor = '#6080ff';
                ctx.shadowBlur = 4;
                for (let i = 0; i < 5; i++) {
                    const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
                    const a2 = a + 2 * Math.PI / 5;
                    if (i === 0) ctx.beginPath();
                    ctx.lineTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8);
                    ctx.lineTo(cx + Math.cos(a2) * 4, cy + Math.sin(a2) * 4);
                }
                ctx.closePath();
                ctx.fill();
                break;
            case 'xp':
                ctx.fillStyle = '#c0a010';
                ctx.shadowColor = '#ffcc20';
                ctx.shadowBlur = 4;
                ctx.font = 'bold 11px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('XP', cx, cy + 4);
                ctx.textAlign = 'left';
                break;
            case 'coin':
                ctx.fillStyle = '#ffc020';
                ctx.shadowColor = '#ffdd40';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.arc(cx, cy, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#a07010';
                ctx.font = 'bold 7px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('G', cx, cy + 3);
                ctx.textAlign = 'left';
                break;
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    },

    // ─── DUNGEON HUD ─────────────────────────────────────────────────────────

    _getFloorName(floor) {
        if (floor <= 5)  return 'The Depths';
        if (floor <= 10) return 'Stone Caverns';
        if (floor <= 15) return 'The Labyrinth';
        if (floor <= 20) return 'The Abyss';
        if (floor <= 25) return 'Forgotten Tombs';
        if (floor <= 30) return 'Shadow Realm';
        if (floor <= 35) return 'Infernal Pits';
        if (floor <= 40) return 'Daemon Halls';
        if (floor <= 45) return 'Hellfire Warrens';
        return 'The Final Dark';
    },

    drawHUD(ctx, player, currentFloor, mapTile, gold, time = 0) {
        const HY = 576, W = 800;

        // Panel background (wood grain)
        const bgGrad = ctx.createLinearGradient(0, HY, 0, HY + 144);
        bgGrad.addColorStop(0,   '#3a2212');
        bgGrad.addColorStop(0.3, '#2a180a');
        bgGrad.addColorStop(1,   '#1a0e06');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, HY, W, 144);

        // Wood grain lines
        ctx.strokeStyle = 'rgba(80,40,10,0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(0, HY + i * 18 + 2);
            ctx.lineTo(W, HY + i * 18 + 8);
            ctx.stroke();
        }

        // Top gold border line
        ctx.fillStyle = '#8a5820';
        ctx.fillRect(0, HY, W, 3);
        ctx.fillStyle = '#c8a030';
        ctx.fillRect(0, HY + 1, W, 1);

        // ── Row A: HP / MP / XP bars ──
        this._drawIcon(ctx, 8, HY + 8, 'heart');
        // HP pulse glow when below 25%
        if (player.hp / player.maxHp < 0.25) {
            const pulse = 0.5 + 0.5 * Math.sin(time * 8);
            ctx.save();
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 6 + pulse * 14;
            ctx.fillStyle = `rgba(255,0,0,${0.12 + pulse * 0.18})`;
            ctx.fillRect(30, HY + 12, 180, 22);
            ctx.restore();
        }
        this._drawStatBar(ctx, 30, HY + 12, 180, 22,
            player.hp, player.maxHp,
            '#b03030', '#3a0a0a', true, '#600010');

        this._drawIcon(ctx, 218, HY + 8, 'star');
        this._drawStatBar(ctx, 240, HY + 12, 130, 22,
            player.mp, player.maxMp,
            '#2848c0', '#0a0a3a', true, '#081040');

        this._drawIcon(ctx, 378, HY + 8, 'xp');
        // XP flash on gain
        if (player._xpFlash > 0) {
            const flashAlpha = Math.min(1, player._xpFlash * 1.8);
            ctx.save();
            ctx.shadowColor = '#ffff40';
            ctx.shadowBlur = 10 * flashAlpha;
            ctx.fillStyle = `rgba(255,240,0,${0.28 * flashAlpha})`;
            ctx.fillRect(400, HY + 12, 130, 22);
            ctx.restore();
        }
        this._drawStatBar(ctx, 400, HY + 12, 130, 22,
            player.xp, player.xpToLevel,
            '#b09010', '#302400', true, '#504000');

        // Level badge
        ctx.fillStyle = '#2a1808';
        this._roundRect(ctx, 540, HY + 10, 56, 24, 5);
        ctx.fill();
        ctx.strokeStyle = '#c8a030';
        ctx.lineWidth = 1;
        this._roundRect(ctx, 540, HY + 10, 56, 24, 5);
        ctx.stroke();
        ctx.shadowColor = '#ffd060';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ffd060';
        ctx.font = 'bold 15px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv.${player.level}`, 568, HY + 27);
        ctx.shadowBlur = 0;

        // Floor — atmospheric two-line indicator
        ctx.fillStyle = '#40b8b8';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 4;
        ctx.font = 'bold 12px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(`Floor ${currentFloor}`, 610, HY + 21);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#2a7878';
        ctx.font = '9px "Courier New"';
        ctx.fillText(this._getFloorName(currentFloor), 610, HY + 33);
        ctx.textAlign = 'left';

        // ── Row B: Weapon / stats / gold ──
        const wep = player.equipment.weapon;
        ctx.fillStyle = wep ? (wep.fg || '#aaaaaa') : '#666666';
        ctx.font = '13px "Courier New"';
        ctx.fillText(`⚔ ${wep ? wep.name : 'Bare Hands'}`, 8, HY + 58);

        ctx.fillStyle = '#fa8020';
        ctx.fillText(`ATK:${player.getAtk()}  DEF:${player.getDef()}`, 8, HY + 76);

        // Gold
        this._drawIcon(ctx, 300, HY + 52, 'coin');
        ctx.fillStyle = '#ffd020';
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 3;
        ctx.font = 'bold 14px "Courier New"';
        ctx.fillText(`${gold}`, 322, HY + 67);
        ctx.shadowBlur = 0;

        // ── Row C: Controls ──
        ctx.fillStyle = '#5a4028';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[WASD] Move  [Space] Atk  [Shift] Dash  [Q] Whirl  [E] Exec  [1] HP  [2] MP  [I] Inv  [C] Stats', 8, HY + 98);

        // ── Row D: Stair / context hint ──
        if (mapTile === 4) { // STAIRS_DOWN
            ctx.fillStyle = '#40e0e0';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 4;
            ctx.font = 'bold 12px "Courier New"';
            ctx.fillText('▼  [Enter] Descend to next floor', 8, HY + 118);
            ctx.shadowBlur = 0;
        } else if (mapTile === 5) { // STAIRS_UP
            ctx.fillStyle = '#40e0e0';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 4;
            ctx.font = 'bold 12px "Courier New"';
            ctx.fillText('▲  [Enter] Return to village', 8, HY + 118);
            ctx.shadowBlur = 0;
        }

        // ── Ability Bar ──
        const abY = HY + 112;
        const abNames = ['dash', 'whirlwind', 'execute'];
        const abIcons = ['→', '⚡', '☠'];
        let abX = 8;
        for (let ai = 0; ai < abNames.length; ai++) {
            const ab = Abilities.list[abNames[ai]];
            const unlocked = player.level >= ab.unlockLevel;
            // Slot background
            ctx.fillStyle = unlocked ? '#1a1208' : '#0a0808';
            ctx.fillRect(abX, abY, 24, 24);
            ctx.strokeStyle = unlocked ? '#6a4820' : '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(abX, abY, 24, 24);
            if (unlocked) {
                // Icon
                ctx.fillStyle = ab.cooldown > 0 ? '#666' : '#ffd040';
                ctx.font = 'bold 13px "Courier New"';
                ctx.textAlign = 'center';
                ctx.fillText(abIcons[ai], abX + 12, abY + 17);
                // Circular cooldown overlay (pie-chart style)
                if (ab.cooldown > 0) {
                    const pct = ab.cooldown / ab.maxCooldown;
                    const cx2 = abX + 12, cy2 = abY + 12, r2 = 11;
                    const startAngle = -Math.PI / 2;
                    const endAngle = startAngle + Math.PI * 2 * pct;
                    ctx.save();
                    ctx.globalAlpha = 0.65;
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.moveTo(cx2, cy2);
                    ctx.arc(cx2, cy2, r2, startAngle, endAngle);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    ctx.fillStyle = '#ff8830';
                    ctx.font = 'bold 9px "Courier New"';
                    ctx.textAlign = 'center';
                    ctx.fillText(Math.ceil(ab.cooldown).toString(), abX + 12, abY + 16);
                }
            } else {
                ctx.fillStyle = '#444';
                ctx.font = '11px "Courier New"';
                ctx.textAlign = 'center';
                ctx.fillText('🔒', abX + 12, abY + 17);
            }
            // Key label
            ctx.fillStyle = unlocked ? '#8a6830' : '#444';
            ctx.font = '8px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(ab.key, abX + 12, abY - 2);
            ctx.textAlign = 'left';
            abX += 32;
        }

        // ── HUD separator ──
        ctx.fillStyle = '#4a2e10';
        ctx.fillRect(600, HY, 1, 144);
    },

    // ─── MINIMAP ─────────────────────────────────────────────────────────────

    drawMinimap(ctx, dungeonMap, playerX, playerY) {
        const MX = 610, MY = 580, MW = 184, MH = 134;

        // Panel
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(MX, MY, MW, MH);
        ctx.strokeStyle = '#5a3810';
        ctx.lineWidth = 2;
        ctx.strokeRect(MX, MY, MW, MH);

        // Title
        ctx.fillStyle = '#8a6030';
        ctx.font = '9px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('MAP', MX + MW / 2, MY + 10);
        ctx.textAlign = 'left';

        // Draw explored tiles as 2×2 pixel squares
        const tileSize = 2;
        const mapW = dungeonMap.width, mapH = dungeonMap.height;
        const scale = Math.min((MW - 8) / mapW, (MH - 16) / mapH);
        const offX = MX + 4 + (MW - 8 - mapW * scale) / 2;
        const offY = MY + 14;

        for (let y = 0; y < mapH; y++) {
            for (let x = 0; x < mapW; x++) {
                if (!dungeonMap.explored[y] || !dungeonMap.explored[y][x]) continue;
                const tile = dungeonMap.get(x, y);
                let color = null;
                switch (tile) {
                    case 1: color = '#4a3828'; break; // wall
                    case 2: color = '#3a2a18'; break; // floor
                    case 3: color = '#6a4a18'; break; // door
                    case 4: case 5: color = '#00cccc'; break; // stairs
                    case 6: color = '#1020a0'; break; // water
                    case 7: color = '#c0a010'; break; // chest
                    default: continue;
                }
                ctx.fillStyle = color;
                ctx.fillRect(
                    offX + x * scale,
                    offY + y * scale,
                    Math.max(1, scale),
                    Math.max(1, scale)
                );
            }
        }

        // Player dot
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(offX + playerX * scale, offY + playerY * scale, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    // ─── INVENTORY PANEL ─────────────────────────────────────────────────────

    drawInventoryPanel(ctx, player, selectedIndex) {
        // Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, 800, 720);

        const w = 480, h = 530;
        const x = (800 - w) / 2, y = (720 - h) / 2;
        this._drawPanel(ctx, x, y, w, h, 'Inventory');

        // Equipment section
        let ey = y + 52;
        ctx.fillStyle = '#c8a050';
        ctx.font = 'bold 12px "Courier New"';
        ctx.fillText('── Equipment ──', x + 20, ey);
        ey += 16;

        const slots = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'];
        for (const slot of slots) {
            const item = player.equipment[slot];
            const itemColor = item ? (item.fg || '#aaa') : '#444444';
            const label = item ? `${item.name}` : '(empty)';

            ctx.fillStyle = '#2a1808';
            ctx.fillRect(x + 20, ey, w - 40, 20);
            ctx.strokeStyle = '#5a3010';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 20, ey, w - 40, 20);

            ctx.fillStyle = '#6a5030';
            ctx.font = '11px "Courier New"';
            ctx.fillText(slot.padEnd(8), x + 24, ey + 14);

            ctx.fillStyle = itemColor;
            ctx.fillText(label, x + 100, ey + 14);

            if (item && item.description) {
                ctx.fillStyle = '#888060';
                ctx.font = '10px "Courier New"';
                ctx.textAlign = 'right';
                ctx.fillText(item.description, x + w - 24, ey + 14);
                ctx.textAlign = 'left';
            }
            ey += 22;
        }

        // Backpack section
        ey += 6;
        ctx.fillStyle = '#8a6030';
        ctx.fillRect(x + 20, ey, w - 40, 1);
        ey += 8;
        ctx.fillStyle = '#c8a050';
        ctx.font = 'bold 12px "Courier New"';
        ctx.fillText(`── Backpack  (${player.inventory.length}/${player.maxInventory}) ──`, x + 20, ey);
        ey += 16;

        const visibleItems = 10;
        const scrollOffset = Math.max(0, selectedIndex - visibleItems + 1);

        for (let i = 0; i < visibleItems && i + scrollOffset < player.inventory.length; i++) {
            const idx = i + scrollOffset;
            const item = player.inventory[idx];
            const selected = idx === selectedIndex;
            const bg = selected ? '#4a2e10' : '#1e1008';
            const border = selected ? '#c8a030' : '#3a2008';

            this._roundRect(ctx, x + 20, ey, w - 40, 22, 3);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = border;
            ctx.lineWidth = selected ? 2 : 1;
            ctx.stroke();

            // Item mini-icon (draw a tiny version)
            if (item.type === 'potion') {
                ctx.fillStyle = item.subtype === 'health' ? '#cc2020' : '#2020cc';
            } else {
                ctx.fillStyle = item.fg || '#aaaaaa';
            }
            ctx.fillRect(x + 26, ey + 5, 4, 12);

            // Name
            ctx.fillStyle = selected ? '#ffd060' : (item.fg || '#aaaaaa');
            ctx.font = selected ? 'bold 12px "Courier New"' : '12px "Courier New"';
            ctx.fillText(item.name, x + 36, ey + 15);

            // Stats
            if (item.description) {
                ctx.fillStyle = '#888060';
                ctx.font = '10px "Courier New"';
                ctx.textAlign = 'right';
                ctx.fillText(item.description, x + w - 24, ey + 15);
                ctx.textAlign = 'left';
            }
            ey += 24;
        }

        if (player.inventory.length === 0) {
            ctx.fillStyle = '#444428';
            ctx.font = 'italic 12px "Courier New"';
            ctx.fillText('Your pack is empty.', x + 20, ey + 14);
        }

        // Footer controls
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(x + 5, y + h - 28, w - 10, 1);
        ctx.fillStyle = '#5a4020';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[Enter] Use/Equip    [X] Drop    [Esc] Close', x + 20, y + h - 10);
    },

    // ─── CHARACTER PANEL ─────────────────────────────────────────────────────

    drawCharacterPanel(ctx, player, selectedIndex) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, 800, 720);

        const w = 360, h = 380;
        const x = (800 - w) / 2, y = (720 - h) / 2;
        this._drawPanel(ctx, x, y, w, h, 'Character');

        let ry = y + 52;
        ctx.font = '13px "Courier New"';

        // Basic info
        ctx.fillStyle = '#ffd060';
        ctx.fillText(`Level ${player.level}`, x + 20, ry);
        ctx.fillStyle = '#aaaaaa';
        ctx.textAlign = 'right';
        ctx.fillText(`XP: ${player.xp} / ${player.xpToLevel}`, x + w - 20, ry);
        ctx.textAlign = 'left';
        ry += 20;

        // HP / MP
        this._drawStatBar(ctx, x + 20, ry, 140, 16, player.hp, player.maxHp, '#b03030', '#2a0808', true, '#500010');
        this._drawStatBar(ctx, x + 180, ry, 140, 16, player.mp, player.maxMp, '#2848c0', '#080820', true, '#080840');
        ry += 26;

        // Divider
        ctx.fillStyle = '#5a3010';
        ctx.fillRect(x + 20, ry, w - 40, 1);
        ry += 10;

        // Stat points banner
        if (player.statPoints > 0) {
            ctx.fillStyle = '#2a3808';
            this._roundRect(ctx, x + 20, ry, w - 40, 22, 4);
            ctx.fill();
            ctx.strokeStyle = '#60a020';
            ctx.lineWidth = 1;
            this._roundRect(ctx, x + 20, ry, w - 40, 22, 4);
            ctx.stroke();
            ctx.shadowColor = '#80ff20';
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#80e030';
            ctx.font = 'bold 12px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(`★ ${player.statPoints} Stat Point${player.statPoints > 1 ? 's' : ''} Available! ★`, x + w / 2, ry + 15);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
            ry += 28;
        } else {
            ry += 6;
        }

        // Stats
        const stats = [
            { key: 'str', label: 'STR', desc: 'Attack power', color: '#e05030' },
            { key: 'dex', label: 'DEX', desc: 'Movement & attack speed', color: '#30b050' },
            { key: 'vit', label: 'VIT', desc: 'Health & defense', color: '#3060e0' },
            { key: 'int', label: 'INT', desc: 'Mana pool', color: '#9030d0' },
        ];

        for (let i = 0; i < stats.length; i++) {
            const s = stats[i];
            const selected = i === selectedIndex && player.statPoints > 0;
            const bg = selected ? '#3a2008' : '#1a1004';
            const border = selected ? '#c8a030' : '#3a2008';

            this._roundRect(ctx, x + 20, ry, w - 40, 36, 4);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = border;
            ctx.lineWidth = selected ? 2 : 1;
            ctx.stroke();

            // Stat label
            ctx.fillStyle = s.color;
            ctx.shadowColor = selected ? s.color : 'transparent';
            ctx.shadowBlur = selected ? 6 : 0;
            ctx.font = 'bold 14px "Courier New"';
            ctx.fillText(s.label, x + 30, ry + 24);
            ctx.shadowBlur = 0;

            // Value
            ctx.fillStyle = selected ? '#ffd060' : '#ccccaa';
            ctx.font = 'bold 16px "Courier New"';
            ctx.fillText(`${player.stats[s.key]}`, x + 80, ry + 25);

            // Bar
            const barVal = Math.min(player.stats[s.key], 30);
            this._drawStatBar(ctx, x + 110, ry + 12, 100, 10, barVal, 30, s.color, '#1a1008', false, '#0a0804');

            // Description
            ctx.fillStyle = '#6a5030';
            ctx.font = '10px "Courier New"';
            ctx.fillText(s.desc, x + 220, ry + 14);

            if (selected) {
                ctx.fillStyle = '#80e030';
                ctx.font = 'bold 12px "Courier New"';
                ctx.textAlign = 'right';
                ctx.fillText('[Enter]+1', x + w - 24, ry + 25);
                ctx.textAlign = 'left';
            }

            ry += 40;
        }

        // ATK / DEF summary
        ry += 4;
        ctx.fillStyle = '#5a3010';
        ctx.fillRect(x + 20, ry, w - 40, 1);
        ry += 12;
        ctx.fillStyle = '#fa8020';
        ctx.font = 'bold 13px "Courier New"';
        ctx.fillText(`Total ATK: ${player.getAtk()}    Total DEF: ${player.getDef()}`, x + 20, ry);
    },

    // ─── VILLAGE HUD ─────────────────────────────────────────────────────────

    drawVillageHUD(ctx, village, player) {
        const HY = 576, W = 800;

        // Background — same wood strip as dungeon HUD
        const bgGrad = ctx.createLinearGradient(0, HY, 0, HY + 144);
        bgGrad.addColorStop(0, '#3a2212');
        bgGrad.addColorStop(0.4, '#2a180a');
        bgGrad.addColorStop(1,   '#1a0e06');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, HY, W, 144);

        // Wood-grain lines
        ctx.strokeStyle = 'rgba(80,40,10,0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(0, HY + i * 18 + 2);
            ctx.lineTo(W, HY + i * 18 + 8);
            ctx.stroke();
        }

        // Gold top border
        ctx.fillStyle = '#8a5820';
        ctx.fillRect(0, HY, W, 3);
        ctx.fillStyle = '#c8a030';
        ctx.fillRect(0, HY + 1, W, 1);

        // ── Row A: Player gold (personal wallet) ──
        ctx.fillStyle = '#ffd020';
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 5;
        ctx.font = 'bold 14px "Courier New"';
        this._drawIcon(ctx, 8, HY + 8, 'coin');
        ctx.fillText(`${(player && player.gold) || 0}`, 30, HY + 23);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#8a6030';
        ctx.font = '9px "Courier New"';
        ctx.fillText('Your Gold', 8, HY + 34);

        // ── Row A: Village resources (wood, stone, food, iron, herbs) ──
        const res = village.resources;
        const resItems = [
            { label: 'Wood', value: res.wood,  color: '#c87820', icon: '▮' },
            { label: 'Stone',value: res.stone, color: '#aaaaaa', icon: '■' },
            { label: 'Food', value: res.food,  color: '#40c040', icon: '✦' },
            { label: 'Iron', value: res.iron,  color: '#8888cc', icon: '◆' },
            { label: 'Herbs',value: res.herbs, color: '#a040d0', icon: '❋' },
        ];

        let rx = 100;
        for (const item of resItems) {
            ctx.fillStyle = item.color;
            ctx.shadowColor = item.color;
            ctx.shadowBlur = 2;
            ctx.font = '14px "Courier New"';
            ctx.fillText(item.icon, rx, HY + 20);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#8a6030';
            ctx.font = '9px "Courier New"';
            ctx.fillText(item.label, rx, HY + 32);
            ctx.fillStyle = item.color;
            ctx.font = 'bold 12px "Courier New"';
            ctx.fillText(`${item.value}`, rx, HY + 44);
            rx += 130;
        }

        // Villager count (right side)
        ctx.fillStyle = '#aaaaaa';
        ctx.shadowColor = '#ccccff';
        ctx.shadowBlur = 2;
        ctx.font = 'bold 12px "Courier New"';
        ctx.textAlign = 'right';
        ctx.fillText(`Villagers: ${village.villagers.length} / ${village.maxVillagers}`, W - 12, HY + 22);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';

        // ── Row B separator ──
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(0, HY + 52, W, 1);

        // ── Row B: Controls ──
        ctx.fillStyle = '#5a4028';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[WASD]Move  [Enter]Interact  [B]Build  [R]Recruit  [I]Inventory  [C]Stats  [F5]Save', 12, HY + 68);

        // ── Row C: Production timer ──
        ctx.fillStyle = '#4a3010';
        ctx.font = '10px "Courier New"';
        ctx.fillText('Production:', 12, HY + 90);

        const timerPct = village.productionTimer / village.productionInterval;
        ctx.fillStyle = '#2a1808';
        this._roundRect(ctx, 90, HY + 80, 250, 10, 3);
        ctx.fill();
        ctx.fillStyle = timerPct > 0.8 ? '#80d020' : '#40a020';
        this._roundRect(ctx, 90, HY + 80, Math.floor(250 * timerPct), 10, 3);
        ctx.fill();

        // Next tick label
        const remaining = Math.ceil(village.productionInterval - village.productionTimer);
        ctx.fillStyle = '#688048';
        ctx.font = '10px "Courier New"';
        ctx.fillText(`${remaining}s`, 348, HY + 90);

        // ── Active buff indicators ──
        if (player && player.activeBuffs && player.activeBuffs.length > 0) {
            let bx = 440;
            ctx.font = '10px "Courier New"';
            for (const buff of player.activeBuffs) {
                ctx.fillStyle = '#0f8';
                ctx.shadowColor = '#0f8';
                ctx.shadowBlur = 3;
                ctx.fillText(`+${buff.amount}${buff.stat.toUpperCase()} (${Math.ceil(buff.remaining)}s)`, bx, HY + 90);
                ctx.shadowBlur = 0;
                bx += 120;
                if (bx > 760) break;
            }
        }
    },

    // ─── SHOP PANEL ──────────────────────────────────────────────────────────

    drawShopPanel(ctx, data) {
        const { buildingType, building, items: buyItems, sellItems, selectedIndex, mode, gold } = data;
        const items = mode === 'sell' ? (sellItems || []) : (buyItems || []);
        const def = typeof BUILDING_DEFS !== 'undefined' ? BUILDING_DEFS[buildingType] : null;
        const shopName = def ? `${def.name}` : 'Shop';
        const level = building ? building.level : 1;

        ctx.fillStyle = '#0d0a06';
        ctx.fillRect(0, 0, 800, 720);

        const w = 620, h = 580;
        const x = (800 - w) / 2, y = (720 - h) / 2;
        this._drawPanel(ctx, x, y, w, h, `${shopName}  (Level ${level})`);

        // Gold indicator top right
        this._drawIcon(ctx, x + w - 90, y + 12, 'coin');
        ctx.fillStyle = '#ffd020';
        ctx.font = 'bold 15px "Courier New"';
        ctx.fillText(`${gold}`, x + w - 68, y + 28);

        // Tab bar
        const buyActive = mode === 'buy';
        ['Buy', 'Sell'].forEach((tab, i) => {
            const active = (i === 0 && buyActive) || (i === 1 && !buyActive);
            const tx = x + 20 + i * 90;
            this._roundRect(ctx, tx, y + 44, 80, 22, 4);
            ctx.fillStyle = active ? '#5a3810' : '#2a1808';
            ctx.fill();
            ctx.strokeStyle = active ? '#c8a030' : '#4a2808';
            ctx.lineWidth = active ? 2 : 1;
            this._roundRect(ctx, tx, y + 44, 80, 22, 4);
            ctx.stroke();
            ctx.fillStyle = active ? '#ffd060' : '#6a4820';
            ctx.font = active ? 'bold 13px "Courier New"' : '13px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(tab, tx + 40, y + 59);
            ctx.textAlign = 'left';
        });

        ctx.fillStyle = '#4a2808';
        ctx.fillRect(x + 20, y + 68, w - 40, 1);

        // Column headers
        ctx.fillStyle = '#7a5030';
        ctx.font = '11px "Courier New"';
        ctx.fillText('Item', x + 50, y + 82);
        ctx.textAlign = 'right';
        ctx.fillText('Stats', x + w - 80);
        ctx.fillText('Price', x + w - 20, y + 82);
        ctx.textAlign = 'left';

        // Item list
        let listY = y + 92;
        const maxVisible = 16;
        const scrollOffset = Math.max(0, selectedIndex - maxVisible + 1);

        if (!items || items.length === 0) {
            ctx.fillStyle = '#4a3018';
            ctx.font = 'italic 13px "Courier New"';
            ctx.fillText(mode === 'buy' ? 'Nothing available for sale.' : 'Nothing to sell.', x + 30, listY + 20);
        }

        for (let i = 0; i < maxVisible && items && i + scrollOffset < items.length; i++) {
            const idx = i + scrollOffset;
            const item = items[idx];
            const selected = idx === selectedIndex;
            const price = mode === 'buy' ? item.value : Math.floor(item.value * 0.5);
            const canAfford = mode === 'buy' ? gold >= price : true;

            const bg = selected ? '#4a2e10' : '#1e1208';
            const border = selected ? '#c8a030' : '#2e1808';
            const rowH = 28;

            this._roundRect(ctx, x + 20, listY, w - 40, rowH, 3);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = border;
            ctx.lineWidth = selected ? 2 : 1;
            ctx.stroke();

            // Item color dot
            ctx.fillStyle = item.fg || '#aaaaaa';
            ctx.beginPath();
            ctx.arc(x + 34, listY + rowH / 2, 5, 0, Math.PI * 2);
            ctx.fill();

            // Name
            ctx.fillStyle = canAfford ? (selected ? '#ffd060' : '#ccccaa') : '#5a4a38';
            ctx.font = selected ? 'bold 13px "Courier New"' : '13px "Courier New"';
            ctx.fillText(item.name, x + 48, listY + 19);

            // Stats
            if (item.description) {
                ctx.fillStyle = '#6a5030';
                ctx.font = '11px "Courier New"';
                ctx.textAlign = 'right';
                ctx.fillText(item.description, x + w - 75, listY + 18);
                ctx.textAlign = 'left';
            }

            // Price
            ctx.fillStyle = canAfford ? '#ffd020' : '#6a4a20';
            ctx.font = 'bold 13px "Courier New"';
            ctx.textAlign = 'right';
            ctx.fillText(`${price}g`, x + w - 24, listY + 19);
            ctx.textAlign = 'left';

            listY += rowH + 2;
        }

        // Selected item details
        if (items && items.length > 0 && selectedIndex < items.length) {
            const item = items[selectedIndex];
            const detY = y + h - 48;
            ctx.fillStyle = '#4a2808';
            ctx.fillRect(x + 20, detY, w - 40, 1);
            ctx.fillStyle = '#8a6030';
            ctx.font = '12px "Courier New"';
            ctx.fillText(`${item.name}  —  ${item.description || ''}  ${item.slot ? '[ ' + item.slot + ' ]' : ''}`, x + 24, detY + 18);
        }

        // Footer
        ctx.fillStyle = '#5a3810';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[W/S] Select    [Enter] Buy/Sell    [Tab] Switch Mode    [Esc] Leave', x + 20, y + h - 12);
    },

    // ─── TITLE SCREEN ────────────────────────────────────────────────────────

    drawTitleScreen(ctx, titleAnim, selectedOption, hasSave) {
        const W = 800, H = 720;

        // Background: deep dark radial
        const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 520);
        bgGrad.addColorStop(0,   '#1a1208');
        bgGrad.addColorStop(0.5, '#0e0904');
        bgGrad.addColorStop(1,   '#000000');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Perspective corridor lines (vanishing point center)
        const vx = W / 2, vy = H / 2 - 60;
        ctx.strokeStyle = '#2a1808';
        ctx.lineWidth = 1;
        const cornerPts = [[0, 0], [W, 0], [W, H], [0, H]];
        for (const [cx2, cy2] of cornerPts) {
            ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(vx, vy); ctx.stroke();
        }
        // Horizontal receding lines
        for (let i = 1; i < 7; i++) {
            const t = i / 7;
            const lx = W * (0.5 - 0.5 * t);
            const rx = W * (0.5 + 0.5 * t);
            const ly = H * (0.5 + (0.5 - vy / H) * t) + vy * (1 - t);
            ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ly); ctx.stroke();
        }

        // Animated torches
        const flicker = 0.85 + Math.sin(titleAnim * 7.3) * 0.15;
        this._drawTorch(ctx, 110, 300, flicker);
        this._drawTorch(ctx, W - 110, 300, flicker * 0.9 + 0.1);

        // Torch light ambient glow on walls
        ctx.fillStyle = `rgba(200,100,20,${0.04 * flicker})`;
        ctx.beginPath(); ctx.arc(110, 300, 180, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(W - 110, 300, 180, 0, Math.PI * 2); ctx.fill();

        // ── Game Title ──
        const glowAmt = 10 + Math.sin(titleAnim * 1.5) * 5;

        ctx.save();
        ctx.shadowColor = '#c05010';
        ctx.shadowBlur = glowAmt * 2;
        ctx.fillStyle = '#e06820';
        ctx.font = 'bold 72px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('Dungeon', W / 2, 170);
        ctx.restore();

        ctx.save();
        ctx.shadowColor = '#a03800';
        ctx.shadowBlur = glowAmt;
        ctx.fillStyle = '#c05010';
        ctx.font = 'bold 72px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('Town', W / 2, 248);
        ctx.restore();

        // Subtitle
        ctx.fillStyle = '#8a6030';
        ctx.shadowColor = '#c08020';
        ctx.shadowBlur = 4;
        ctx.font = '20px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('Descend. Die. Build. Repeat.', W / 2, 290);
        ctx.shadowBlur = 0;

        // Decorative separator
        ctx.strokeStyle = '#5a3010';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(W / 2 - 180, 305);
        ctx.lineTo(W / 2 + 180, 305);
        ctx.stroke();
        ctx.setLineDash([]);

        // ── Menu Buttons ──
        const menuStartY = 360;
        const options = ['New Game', 'Continue'];
        for (let i = 0; i < options.length; i++) {
            const selected = i === selectedOption;
            const disabled = i === 1 && !hasSave;
            this._drawMenuButton(ctx, W / 2 - 140, menuStartY + i * 80, 280, 55, options[i], selected, disabled);
        }

        // Controls hint
        ctx.fillStyle = '#3a2808';
        ctx.shadowBlur = 0;
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('[W / S]  Navigate      [Enter]  Select', W / 2, 560);

        // Tip (rotating)
        const tips = [
            'Explore dungeons, slay monsters, collect loot!',
            'Build your village and recruit helpers!',
            'Upgrade buildings to unlock better gear.',
            'Beware of raids while you are away...',
        ];
        const tipIdx = Math.floor(titleAnim / 4) % tips.length;
        ctx.fillStyle = '#4a3018';
        ctx.fillText(tips[tipIdx], W / 2, 590);

        ctx.textAlign = 'left';
    },

    _drawTorch(ctx, x, y, flicker) {
        // Sconce
        ctx.fillStyle = '#4a3020';
        ctx.fillRect(x - 5, y + 18, 10, 28);
        ctx.fillStyle = '#6a4828';
        ctx.fillRect(x - 7, y + 18, 14, 6);

        // Flame (multi-layer)
        const fh = 28 * flicker;
        const flameGrad = ctx.createRadialGradient(x, y - fh / 3, 2, x, y - fh / 2, fh);
        flameGrad.addColorStop(0,   `rgba(255,255,180,0.95)`);
        flameGrad.addColorStop(0.2, `rgba(255,180,20,0.85)`);
        flameGrad.addColorStop(0.6, `rgba(255,60,0,0.6)`);
        flameGrad.addColorStop(1,   `rgba(200,0,0,0)`);
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.ellipse(x, y - fh / 3, 9 * flicker, fh / 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        ctx.fillStyle = `rgba(255,255,220,${0.6 * flicker})`;
        ctx.beginPath();
        ctx.ellipse(x, y - 2, 4, 7 * flicker, 0, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawMenuButton(ctx, x, y, w, h, label, selected, disabled) {
        // Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        this._roundRect(ctx, x, y, w, h, 8);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.restore();

        // Background
        const bg = selected ? '#5a3010' : (disabled ? '#1a1008' : '#2a1808');
        this._roundRect(ctx, x, y, w, h, 8);
        ctx.fillStyle = bg;
        ctx.fill();

        // Border
        ctx.strokeStyle = selected ? '#c8a030' : (disabled ? '#2a1808' : '#4a2808');
        ctx.lineWidth = selected ? 2 : 1;
        this._roundRect(ctx, x, y, w, h, 8);
        ctx.stroke();

        // Gloss
        if (selected) {
            const gloss = ctx.createLinearGradient(x, y, x, y + h / 2);
            gloss.addColorStop(0, 'rgba(255,200,100,0.12)');
            gloss.addColorStop(1, 'rgba(255,200,100,0)');
            this._roundRect(ctx, x, y, w, h / 2, 8);
            ctx.fillStyle = gloss;
            ctx.fill();
        }

        // Label
        ctx.shadowColor = selected ? '#ffaa30' : 'transparent';
        ctx.shadowBlur = selected ? 8 : 0;
        ctx.fillStyle = disabled ? '#3a2818' : (selected ? '#ffd060' : '#9a7040');
        ctx.font = `bold ${selected ? 22 : 19}px "Courier New"`;
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, y + h / 2 + 8);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';

        // Selection arrows
        if (selected && !disabled) {
            ctx.fillStyle = '#ffd060';
            ctx.font = '16px "Courier New"';
            ctx.fillText('▶', x + 8, y + h / 2 + 6);
            ctx.textAlign = 'right';
            ctx.fillText('◀', x + w - 8, y + h / 2 + 6);
            ctx.textAlign = 'left';
        }
    },

    // ─── NOTIFICATIONS ────────────────────────────────────────────────────────

    drawNotification(ctx, text, color, alpha, slot) {
        if (alpha <= 0) return;
        const W = 800;
        const tw = ctx.measureText(text).width + 30;
        const nx = (W - tw) / 2;
        const ny = 30 + slot * 36;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Pill background
        this._roundRect(ctx, nx, ny, tw, 26, 13);
        ctx.fillStyle = 'rgba(10,6,2,0.85)';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        this._roundRect(ctx, nx, ny, tw, 26, 13);
        ctx.stroke();

        // Text
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        ctx.font = 'bold 14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(text, W / 2, ny + 18);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';

        ctx.restore();
    },

    // ─── Village menus (overlay panels) ─────────────────────────────────────

    drawBuildMenu(ctx, buildList, selectedOption, village) {
        if (!buildList || buildList.length === 0) return;
        const w = 460, h = Math.min(520, buildList.length * 42 + 80);
        const x = 40, y = 60;
        this._drawPanel(ctx, x, y, w, h, 'Build / Upgrade');

        let ry = y + 52;
        for (let i = 0; i < buildList.length; i++) {
            const item = buildList[i];
            const selected = i === selectedOption;
            const canAfford = village.canAfford(item.cost);
            const bg = selected ? '#4a2e10' : '#1e1008';
            const border = selected ? '#c8a030' : '#2e1808';

            this._roundRect(ctx, x + 12, ry, w - 24, 36, 4);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = border;
            ctx.lineWidth = selected ? 2 : 1;
            this._roundRect(ctx, x + 12, ry, w - 24, 36, 4);
            ctx.stroke();

            const action = item.action === 'upgrade' ? 'Upgrade' : 'Build';
            ctx.fillStyle = selected ? '#ffd060' : (canAfford ? '#c8a050' : '#5a4030');
            ctx.font = selected ? 'bold 13px "Courier New"' : '13px "Courier New"';
            ctx.fillText(`${action} ${item.def.name} → L${item.level}`, x + 20, ry + 16);

            if (item.cost) {
                const costStr = Object.entries(item.cost).map(([k, v]) => `${k}:${v}`).join('  ');
                ctx.fillStyle = canAfford ? '#808040' : '#5a3020';
                ctx.font = '10px "Courier New"';
                ctx.fillText(costStr, x + 20, ry + 30);
            }
            ry += 42;
        }

        ctx.fillStyle = '#5a3010';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[W/S] Select   [Enter] Build   [B/Esc] Close', x + 16, y + h - 12);
    },

    drawManageMenu(ctx, target, options, selectedOption) {
        if (!target) return;
        const w = 340, h = options.length * 36 + 110;
        const x = (800 - w) / 2, y = (720 - h) / 2;
        this._drawPanel(ctx, x, y, w, h, target.def.name);

        ctx.fillStyle = '#8a6030';
        ctx.font = '11px "Courier New"';
        ctx.fillText(`Level: ${target.building.level} / ${target.def.maxLevel}`, x + 20, y + 58);
        ctx.fillStyle = '#5a4020';
        ctx.fillText(target.def.description, x + 20, y + 72);

        if (target.building.villager) {
            ctx.fillStyle = '#40a040';
            ctx.fillText(`Worker: ${target.building.villager}`, x + 20, y + 86);
        } else if (target.def.job) {
            ctx.fillStyle = '#c05020';
            ctx.fillText('No worker assigned', x + 20, y + 86);
        }

        let ry = y + 100;
        for (let i = 0; i < options.length; i++) {
            const selected = i === selectedOption;
            const bg = selected ? '#4a2e10' : '#1e1008';
            this._roundRect(ctx, x + 12, ry, w - 24, 30, 4);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = selected ? '#c8a030' : '#2e1808';
            ctx.lineWidth = selected ? 2 : 1;
            this._roundRect(ctx, x + 12, ry, w - 24, 30, 4);
            ctx.stroke();
            ctx.fillStyle = selected ? '#ffd060' : '#a08050';
            ctx.font = selected ? 'bold 14px "Courier New"' : '13px "Courier New"';
            ctx.fillText(options[i].label, x + 24, ry + 21);
            ry += 36;
        }
    },

    drawAssignMenu(ctx, villagers, selectedOption) {
        const w = 380, h = Math.min(420, villagers.length * 30 + 80);
        const x = (800 - w) / 2, y = (720 - h) / 2;
        this._drawPanel(ctx, x, y, w, h, 'Assign Worker');

        if (villagers.length === 0) {
            ctx.fillStyle = '#c05020';
            ctx.font = '13px "Courier New"';
            ctx.fillText('No villagers available!', x + 20, y + 60);
            return;
        }

        let ry = y + 52;
        for (let i = 0; i < villagers.length; i++) {
            const v = villagers[i];
            const selected = i === selectedOption;
            const bg = selected ? '#4a2e10' : '#1e1008';
            this._roundRect(ctx, x + 12, ry, w - 24, 26, 3);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = selected ? '#c8a030' : '#2e1808';
            ctx.lineWidth = selected ? 2 : 1;
            this._roundRect(ctx, x + 12, ry, w - 24, 26, 3);
            ctx.stroke();
            ctx.fillStyle = selected ? '#ffd060' : '#a08050';
            ctx.font = selected ? 'bold 12px "Courier New"' : '12px "Courier New"';
            ctx.fillText(`${v.name}  (${v.job})`, x + 22, ry + 18);
            ctx.fillStyle = '#6a5030';
            ctx.textAlign = 'right';
            ctx.fillText(`Skill ${(v.productivity * 100).toFixed(0)}%`, x + w - 18, ry + 18);
            ctx.textAlign = 'left';
            ry += 30;
        }
    },

    drawRecruitMenu(ctx, recruits, villagers, maxVillagers, selectedOption, gold) {
        const w = 420, h = Math.max(160, recruits.length * 36 + 100);
        const x = (800 - w) / 2, y = (720 - h) / 2;
        this._drawPanel(ctx, x, y, w, h, 'Recruit Villagers');

        ctx.fillStyle = '#8a6030';
        ctx.font = '12px "Courier New"';
        ctx.fillText(`Villagers: ${villagers.length} / ${maxVillagers}`, x + 20, y + 58);
        ctx.fillStyle = '#8fc040';
        ctx.textAlign = 'right';
        ctx.fillText(`Food: ${gold}`, x + w - 20, y + 58);
        ctx.textAlign = 'left';

        if (recruits.length === 0) {
            ctx.fillStyle = '#5a4020';
            ctx.font = 'italic 12px "Courier New"';
            ctx.fillText('No recruits available.', x + 20, y + 84);
            return;
        }

        let ry = y + 70;
        for (let i = 0; i < recruits.length; i++) {
            const rec = recruits[i];
            const selected = i === selectedOption;
            const canAfford = gold >= rec.cost; // gold param is actually food now
            const bg = selected ? '#4a2e10' : '#1e1008';
            this._roundRect(ctx, x + 12, ry, w - 24, 30, 3);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = selected ? '#c8a030' : '#2e1808';
            ctx.lineWidth = selected ? 2 : 1;
            this._roundRect(ctx, x + 12, ry, w - 24, 30, 3);
            ctx.stroke();
            ctx.fillStyle = selected ? '#ffd060' : (canAfford ? '#c8a050' : '#5a4030');
            ctx.font = selected ? 'bold 12px "Courier New"' : '12px "Courier New"';
            ctx.fillText(`${rec.name}  —  Skill: ${(rec.productivity * 100).toFixed(0)}%`, x + 22, ry + 20);
            ctx.fillStyle = canAfford ? '#8fc040' : '#6a4020';
            ctx.textAlign = 'right';
            ctx.fillText(`${rec.cost} food`, x + w - 18, ry + 20);
            ctx.textAlign = 'left';
            ry += 36;
        }
    },

    drawInfoTooltip(ctx, text, lines, x, y) {
        const w = 240, h = lines.length * 18 + 20;
        // Clamp to screen
        const px = Math.min(x, 800 - w - 8);
        const py = Math.min(y, 720 - h - 8);
        this._drawPanel(ctx, px, py, w, h, '');
        ctx.fillStyle = '#c8a050';
        ctx.font = 'bold 12px "Courier New"';
        ctx.fillText(text, px + 12, py + 18);
        ctx.font = '11px "Courier New"';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillStyle = '#8a6030';
            ctx.fillText(lines[i], px + 12, py + 34 + i * 18);
        }
    },

    // ─── Color helpers ────────────────────────────────────────────────────────

    _darken(hex, factor) {
        try {
            let h = hex.replace('#', '');
            if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
            const r = Math.floor(parseInt(h.slice(0,2),16) * (1-factor));
            const g = Math.floor(parseInt(h.slice(2,4),16) * (1-factor));
            const b = Math.floor(parseInt(h.slice(4,6),16) * (1-factor));
            return `rgb(${r},${g},${b})`;
        } catch(e) { return hex; }
    },

    _lighten(hex, factor) {
        try {
            let h = hex.replace('#', '');
            if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
            const r = Math.min(255, Math.floor(parseInt(h.slice(0,2),16) + (255-parseInt(h.slice(0,2),16))*factor));
            const g = Math.min(255, Math.floor(parseInt(h.slice(2,4),16) + (255-parseInt(h.slice(2,4),16))*factor));
            const b = Math.min(255, Math.floor(parseInt(h.slice(4,6),16) + (255-parseInt(h.slice(4,6),16))*factor));
            return `rgb(${r},${g},${b})`;
        } catch(e) { return hex; }
    },
};
