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

        // Sprite-based HUD background
        Assets.drawImage(ctx, 'hud_bg', 0, 576, 800, 144);

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

        // Soul Shards
        ctx.fillStyle = '#c040ff';
        ctx.shadowColor = '#c040ff';
        ctx.shadowBlur = 3;
        ctx.font = '12px "Courier New"';
        ctx.fillText('✦', 400, HY + 67);
        ctx.font = 'bold 12px "Courier New"';
        ctx.fillText(`${player.soulShards || 0}`, 414, HY + 67);
        ctx.shadowBlur = 0;

        // ── Run progress line ──
        const runStats = Game.state.runStats;
        if (runStats) {
            ctx.fillStyle = '#6a8a6a';
            ctx.font = '11px "Courier New"';
            ctx.textAlign = 'right';
            let progressText = `Floor ${currentFloor}/50 · ${runStats.kills} kills`;
            if (Game.settings.assistMode) {
                const deaths = Game.state.totalDeaths || 0;
                const reduction = Math.min(80, 20 + deaths * 2);
                ctx.fillText(progressText, W - 110, HY + 67);
                ctx.fillStyle = '#a070d0';
                ctx.font = '10px "Courier New"';
                ctx.fillText(`ASSIST -${reduction}%`, W - 110, HY + 80);
            } else {
                ctx.fillText(progressText, W - 10, HY + 67);
            }
            ctx.textAlign = 'left';
        }

        // ── Ability Bar (moved up, no more control hints row) ──
        const abY = HY + 90;
        const abNames = ['dash', 'whirlwind', 'execute'];
        let abX = 8;
        for (let ai = 0; ai < abNames.length; ai++) {
            const ab = Abilities.list[abNames[ai]];
            const unlocked = player.level >= ab.unlockLevel;
            const onCooldown = ab.cooldown > 0;
            const icx = abX + 12, icy = abY + 12;

            // Slot background with gradient
            const slotGrad = ctx.createLinearGradient(abX, abY, abX, abY + 24);
            if (unlocked) {
                slotGrad.addColorStop(0, onCooldown ? '#1a1010' : '#241808');
                slotGrad.addColorStop(1, onCooldown ? '#0e0808' : '#160e04');
            } else {
                slotGrad.addColorStop(0, '#0e0808');
                slotGrad.addColorStop(1, '#080606');
            }
            this._roundRect(ctx, abX, abY, 24, 24, 3);
            ctx.fillStyle = slotGrad;
            ctx.fill();
            ctx.strokeStyle = unlocked ? (onCooldown ? '#5a2010' : '#8a5820') : '#2a2020';
            ctx.lineWidth = 1;
            this._roundRect(ctx, abX, abY, 24, 24, 3);
            ctx.stroke();

            if (unlocked) {
                ctx.save();
                ctx.globalAlpha = onCooldown ? 0.4 : 1.0;
                // Draw ability-specific icon
                if (ai === 0) this._drawDashIcon(ctx, icx, icy);
                else if (ai === 1) this._drawWhirlwindIcon(ctx, icx, icy);
                else if (ai === 2) this._drawExecuteIcon(ctx, icx, icy);
                ctx.restore();

                // Circular cooldown overlay (pie-chart style)
                if (onCooldown) {
                    const pct = ab.cooldown / ab.maxCooldown;
                    const r2 = 11;
                    const startAngle = -Math.PI / 2;
                    const endAngle = startAngle + Math.PI * 2 * pct;
                    ctx.save();
                    ctx.globalAlpha = 0.65;
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.moveTo(icx, icy);
                    ctx.arc(icx, icy, r2, startAngle, endAngle);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    ctx.fillStyle = '#ff8830';
                    ctx.font = 'bold 9px "Courier New"';
                    ctx.textAlign = 'center';
                    ctx.fillText(Math.ceil(ab.cooldown).toString(), icx, icy + 4);
                }
            } else {
                // Lock icon
                ctx.fillStyle = '#333';
                ctx.fillRect(icx - 3, icy - 1, 6, 5);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(icx, icy - 3, 3, Math.PI, 0);
                ctx.stroke();
            }
            // Key label
            ctx.fillStyle = unlocked ? '#9a7840' : '#3a3030';
            ctx.font = '8px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(ab.key, abX + 12, abY - 2);
            ctx.textAlign = 'left';
            abX += 32;
        }

        // ── Context hint (stairs, events, interact) ──
        const hintY = abY + 30;
        if (mapTile === 4) { // STAIRS_DOWN
            ctx.fillStyle = '#40e0e0';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 4;
            ctx.font = 'bold 11px "Courier New"';
            ctx.fillText('▼ [Enter] Descend to next floor', 8, hintY);
            ctx.shadowBlur = 0;
        } else if (mapTile === 5) { // STAIRS_UP
            ctx.fillStyle = '#40e0e0';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 4;
            ctx.font = 'bold 11px "Courier New"';
            ctx.fillText('▲ [Enter] Return to village', 8, hintY);
            ctx.shadowBlur = 0;
        } else if (mapTile >= 8 && mapTile <= 13) { // Event tiles (shrine, merchant, etc)
            ctx.fillStyle = '#e0c060';
            ctx.font = 'bold 11px "Courier New"';
            ctx.fillText('[E] Interact', 8, hintY);
        }

        // ── HUD separator ──
        ctx.fillStyle = '#4a2e10';
        ctx.fillRect(600, HY, 1, 144);
    },

    // ─── COMBAT LOG ──────────────────────────────────────────────────────────

    drawCombatLog(ctx, combatLog) {
        if (!combatLog || combatLog.length === 0) return;
        const LX = 604, LY = 8, LW = 190, LH = 148;

        // Parchment-dark background with subtle border
        ctx.save();
        ctx.globalAlpha = 0.78;
        const bg = ctx.createLinearGradient(LX, LY, LX, LY + LH);
        bg.addColorStop(0, '#1a1008');
        bg.addColorStop(1, '#0e0804');
        this._roundRect(ctx, LX, LY, LW, LH, 6);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = '#6a4010';
        ctx.lineWidth = 1.5;
        this._roundRect(ctx, LX, LY, LW, LH, 6);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Title banner
        ctx.fillStyle = '#8a5010';
        ctx.fillRect(LX + 1, LY + 1, LW - 2, 18);
        ctx.fillStyle = '#c8a040';
        ctx.shadowColor = '#ffc060';
        ctx.shadowBlur = 4;
        ctx.font = 'bold 9px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('⚔ COMBAT LOG', LX + LW / 2, LY + 13);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';

        // Divider
        ctx.strokeStyle = '#6a4010';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(LX + 4, LY + 20);
        ctx.lineTo(LX + LW - 4, LY + 20);
        ctx.stroke();

        // Entries (newest at bottom)
        const maxAge = 6.0;
        const entries = combatLog.slice(-7);
        const lineH = 17;
        for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            const fade = Math.max(0, 1 - e.age / maxAge);
            if (fade <= 0) continue;
            ctx.globalAlpha = Math.min(1, fade * 1.4);
            const ey = LY + 23 + i * lineH;
            // Row highlight for newest entry
            if (i === entries.length - 1 && e.age < 0.5) {
                ctx.fillStyle = 'rgba(180,120,20,0.15)';
                ctx.fillRect(LX + 3, ey - 12, LW - 6, 15);
            }
            ctx.fillStyle = e.color || '#ddd';
            ctx.font = (i === entries.length - 1 && e.age < 1.0) ? 'bold 10px "Courier New"' : '10px "Courier New"';
            // Truncate long text
            const maxChars = 22;
            const text = e.text.length > maxChars ? e.text.substring(0, maxChars) + '…' : e.text;
            ctx.fillText(text, LX + 7, ey);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    },

    // ─── MINIMAP ─────────────────────────────────────────────────────────────

    drawMinimap(ctx, dungeonMap, playerX, playerY) {
        const MX = 610, MY = 580, MW = 184, MH = 134;

        // Parchment background
        ctx.save();
        const parchment = ctx.createLinearGradient(MX, MY, MX + MW, MY + MH);
        parchment.addColorStop(0,   '#1e1208');
        parchment.addColorStop(0.4, '#160e06');
        parchment.addColorStop(1,   '#0e0a04');
        ctx.fillStyle = parchment;
        ctx.fillRect(MX, MY, MW, MH);

        // Outer border — double-line ornate
        ctx.strokeStyle = '#8a5820';
        ctx.lineWidth = 2;
        ctx.strokeRect(MX, MY, MW, MH);
        ctx.strokeStyle = '#4a2c08';
        ctx.lineWidth = 1;
        ctx.strokeRect(MX + 3, MY + 3, MW - 6, MH - 6);

        // Corner ornaments
        ctx.fillStyle = '#c8a030';
        const corners = [[MX + 3, MY + 3], [MX + MW - 3, MY + 3], [MX + 3, MY + MH - 3], [MX + MW - 3, MY + MH - 3]];
        for (const [cx2, cy2] of corners) {
            ctx.beginPath(); ctx.arc(cx2, cy2, 2, 0, Math.PI * 2); ctx.fill();
        }

        // Title
        ctx.fillStyle = '#a07830';
        ctx.shadowColor = '#c09020';
        ctx.shadowBlur = 3;
        ctx.font = 'bold 8px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('MAP', MX + MW / 2, MY + 12);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';

        // Subtle parchment texture lines
        ctx.strokeStyle = 'rgba(100,60,10,0.12)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(MX + 4, MY + 18 + i * 20);
            ctx.lineTo(MX + MW - 4, MY + 20 + i * 20);
            ctx.stroke();
        }

        // Draw explored tiles
        const mapW = dungeonMap.width, mapH = dungeonMap.height;
        const scale = Math.min((MW - 12) / mapW, (MH - 22) / mapH);
        const offX = MX + 6 + (MW - 12 - mapW * scale) / 2;
        const offY = MY + 16;

        for (let y = 0; y < mapH; y++) {
            for (let x = 0; x < mapW; x++) {
                if (!dungeonMap.explored[y] || !dungeonMap.explored[y][x]) continue;
                const tile = dungeonMap.get(x, y);
                let color = null;
                switch (tile) {
                    case 1: color = '#5a4030'; break; // wall — warm stone
                    case 2: color = '#c8a878'; break; // floor — parchment tan
                    case 3: color = '#8a6840'; break; // door — amber
                    case 4: case 5: color = '#40d0d0'; break; // stairs — cyan
                    case 6: color = '#3050c0'; break; // water
                    case 7: color = '#d0a020'; break; // chest — gold
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

        // Player dot — bright with glow
        ctx.fillStyle = '#ffff40';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(offX + playerX * scale, offY + playerY * scale, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Compass rose — bottom-right corner of minimap
        this._drawCompassRose(ctx, MX + MW - 18, MY + MH - 18, 11);

        ctx.restore();
    },

    _drawCompassRose(ctx, cx, cy, r) {
        ctx.save();
        const dirs = [
            { a: -Math.PI / 2, label: 'N', color: '#ff6040' },
            { a:  Math.PI / 2, label: 'S', color: '#a08060' },
            { a:  0,           label: 'E', color: '#a08060' },
            { a:  Math.PI,     label: 'W', color: '#a08060' },
        ];
        // Cardinal spokes
        for (const d of dirs) {
            ctx.strokeStyle = d.color;
            ctx.lineWidth = d.label === 'N' ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(d.a) * r, cy + Math.sin(d.a) * r);
            ctx.stroke();
        }
        // Center dot
        ctx.fillStyle = '#c8a030';
        ctx.beginPath(); ctx.arc(cx, cy, 1.5, 0, Math.PI * 2); ctx.fill();
        // N label
        ctx.fillStyle = '#ff8060';
        ctx.font = 'bold 6px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('N', cx, cy - r - 1);
        ctx.restore();
    },

    // ─── ABILITY ICONS ───────────────────────────────────────────────────────

    _drawDashIcon(ctx, cx, cy) {
        // Dash: lightning bolt / directional streak
        ctx.save();
        ctx.strokeStyle = '#60d0ff';
        ctx.shadowColor = '#40b8ff';
        ctx.shadowBlur = 5;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        // Three motion lines
        for (let i = -1; i <= 1; i++) {
            const y = cy + i * 3;
            ctx.globalAlpha = 1 - Math.abs(i) * 0.3;
            ctx.beginPath();
            ctx.moveTo(cx - 7, y);
            ctx.lineTo(cx + 5, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // Arrow head
        ctx.fillStyle = '#80e8ff';
        ctx.beginPath();
        ctx.moveTo(cx + 8, cy);
        ctx.lineTo(cx + 3, cy - 4);
        ctx.lineTo(cx + 3, cy + 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    _drawWhirlwindIcon(ctx, cx, cy) {
        // Whirlwind: spiral with blade tips
        ctx.save();
        ctx.strokeStyle = '#a0d8ff';
        ctx.shadowColor = '#80c0ff';
        ctx.shadowBlur = 5;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        // Outer spiral arc
        ctx.beginPath();
        ctx.arc(cx, cy, 7, -Math.PI * 0.2, Math.PI * 1.6);
        ctx.stroke();
        // Inner spiral arc
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, Math.PI * 0.3, Math.PI * 1.9);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Center dot
        ctx.fillStyle = '#c0e8ff';
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    _drawExecuteIcon(ctx, cx, cy) {
        // Execute: skull above crossed blades
        ctx.save();
        ctx.shadowColor = '#ff3000';
        ctx.shadowBlur = 5;
        // Crossed swords
        ctx.strokeStyle = '#cc8040';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy + 5); ctx.lineTo(cx + 5, cy - 4);
        ctx.moveTo(cx + 6, cy + 5); ctx.lineTo(cx - 5, cy - 4);
        ctx.stroke();
        // Skull
        ctx.fillStyle = '#e8d8b0';
        ctx.beginPath();
        ctx.arc(cx, cy - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        // Jaw
        ctx.fillStyle = '#d0c098';
        ctx.fillRect(cx - 2.5, cy - 2, 5, 2);
        // Eye sockets
        ctx.fillStyle = '#200a00';
        ctx.beginPath(); ctx.arc(cx - 1.5, cy - 6, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 1.5, cy - 6, 1.2, 0, Math.PI * 2); ctx.fill();
        // Glowing red eyes
        ctx.fillStyle = '#ff2000';
        ctx.shadowBlur = 3;
        ctx.beginPath(); ctx.arc(cx - 1.5, cy - 6, 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 1.5, cy - 6, 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
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

        // Soul Shards (after resources)
        ctx.fillStyle = '#c040ff';
        ctx.shadowColor = '#c040ff';
        ctx.shadowBlur = 2;
        ctx.font = '14px "Courier New"';
        ctx.fillText('✦', rx, HY + 20);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#8a6030';
        ctx.font = '9px "Courier New"';
        ctx.fillText('Shards', rx, HY + 32);
        ctx.fillStyle = '#c040ff';
        ctx.font = 'bold 12px "Courier New"';
        ctx.fillText(`${(player && player.soulShards) || 0}`, rx, HY + 44);

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

        // ── Row B: Key actions (contextual only) ──
        ctx.fillStyle = '#5a4028';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[E] Interact  [B] Build  [I] Inv  [C] Stats', 12, HY + 68);

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
        const menuStartY = 350;
        const options = ['New Game', 'Continue', 'Settings'];
        for (let i = 0; i < options.length; i++) {
            const selected = i === selectedOption;
            const disabled = i === 1 && !hasSave;
            this._drawMenuButton(ctx, W / 2 - 140, menuStartY + i * 65, 280, 48, options[i], selected, disabled);
        }

        // Controls hint
        ctx.fillStyle = '#3a2808';
        ctx.shadowBlur = 0;
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('[W / S]  Navigate      [Enter]  Select', W / 2, 570);

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

    // ─── SMITHY PANEL ──────────────────────────────────────────────────────────

    drawSmithyPanel(ctx, player, items, tab, selectedIndex) {
        ctx.fillStyle = '#0d0a06';
        ctx.fillRect(0, 0, 800, 720);

        const w = 640, h = 580;
        const x = (800 - w) / 2, y = (720 - h) / 2;
        this._drawPanel(ctx, x, y, w, h, 'The Forge');

        // Flavor text
        ctx.fillStyle = '#6a5030';
        ctx.font = 'italic 11px "Courier New"';
        ctx.fillText('The smith grunts as you enter. The forge burns eternal.', x + 20, y + 52);

        // Gold
        this._drawIcon(ctx, x + w - 90, y + 12, 'coin');
        ctx.fillStyle = '#ffd020';
        ctx.font = 'bold 15px "Courier New"';
        ctx.fillText(`${player.gold}`, x + w - 68, y + 28);

        // Tabs
        const tabs = ['Weapons', 'Armor', 'Upgrade'];
        let tx = x + 20;
        for (let i = 0; i < tabs.length; i++) {
            const active = i === tab;
            this._roundRect(ctx, tx, y + 60, 90, 22, 4);
            ctx.fillStyle = active ? '#5a3810' : '#2a1808';
            ctx.fill();
            ctx.strokeStyle = active ? '#c8a030' : '#4a2808';
            ctx.lineWidth = active ? 2 : 1;
            this._roundRect(ctx, tx, y + 60, 90, 22, 4);
            ctx.stroke();
            ctx.fillStyle = active ? '#ffd060' : '#6a4820';
            ctx.font = active ? 'bold 12px "Courier New"' : '12px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(tabs[i], tx + 45, y + 75);
            ctx.textAlign = 'left';
            tx += 100;
        }

        ctx.fillStyle = '#4a2808';
        ctx.fillRect(x + 20, y + 86, w - 40, 1);

        let listY = y + 94;
        if (tab === 0 || tab === 1) {
            const list = tab === 0 ? (items ? items.weapons : []) : (items ? items.armors : []);
            if (!list || list.length === 0) {
                ctx.fillStyle = '#4a3018';
                ctx.font = 'italic 13px "Courier New"';
                ctx.fillText('Nothing available.', x + 30, listY + 20);
            }
            for (let i = 0; i < (list ? list.length : 0); i++) {
                const item = list[i];
                const selected = i === selectedIndex;
                const canAfford = player.gold >= item.value;
                const bg = selected ? '#4a2e10' : '#1e1208';
                this._roundRect(ctx, x + 20, listY, w - 40, 30, 3);
                ctx.fillStyle = bg;
                ctx.fill();
                ctx.strokeStyle = selected ? '#c8a030' : '#2e1808';
                ctx.lineWidth = selected ? 2 : 1;
                ctx.stroke();

                ctx.fillStyle = item.fg || '#aaa';
                ctx.beginPath();
                ctx.arc(x + 36, listY + 15, 5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = canAfford ? (selected ? '#ffd060' : '#ccccaa') : '#5a4a38';
                ctx.font = selected ? 'bold 13px "Courier New"' : '13px "Courier New"';
                ctx.fillText(item.name, x + 50, listY + 20);

                ctx.fillStyle = '#6a5030';
                ctx.font = '11px "Courier New"';
                ctx.fillText(item.description || '', x + 200, listY + 20);

                ctx.fillStyle = canAfford ? '#ffd020' : '#6a4a20';
                ctx.font = 'bold 13px "Courier New"';
                ctx.textAlign = 'right';
                ctx.fillText(`${item.value}g`, x + w - 24, listY + 20);
                ctx.textAlign = 'left';
                listY += 34;
            }
        } else {
            // Upgrade tab
            const wep = player.equipment.weapon;
            ctx.fillStyle = '#c8a050';
            ctx.font = 'bold 13px "Courier New"';
            ctx.fillText('Upgrade Equipped Weapon', x + 30, listY + 16);
            listY += 30;

            if (!wep) {
                ctx.fillStyle = '#5a4030';
                ctx.font = 'italic 12px "Courier New"';
                ctx.fillText('No weapon equipped.', x + 30, listY + 14);
            } else {
                const selected = selectedIndex === 0;
                const goldCost = 10 + (wep.stats.atk || 0) * 5;
                const ironCost = 2 + Math.floor((wep.stats.atk || 0) / 2);
                const village = Game.state.village;
                const canAfford = player.gold >= goldCost && (village.resources.iron || 0) >= ironCost;

                const bg = selected ? '#4a2e10' : '#1e1208';
                this._roundRect(ctx, x + 20, listY, w - 40, 60, 4);
                ctx.fillStyle = bg;
                ctx.fill();
                ctx.strokeStyle = selected ? '#c8a030' : '#2e1808';
                ctx.lineWidth = selected ? 2 : 1;
                ctx.stroke();

                ctx.fillStyle = wep.fg || '#aaa';
                ctx.font = 'bold 14px "Courier New"';
                ctx.fillText(`${wep.name}  (ATK ${wep.stats.atk})`, x + 30, listY + 22);

                ctx.fillStyle = '#c8a050';
                ctx.font = '12px "Courier New"';
                ctx.fillText(`Upgrade to ATK ${(wep.stats.atk || 0) + 1}`, x + 30, listY + 42);

                ctx.fillStyle = canAfford ? '#ffd020' : '#6a4a20';
                ctx.textAlign = 'right';
                ctx.fillText(`${goldCost}g + ${ironCost} iron`, x + w - 24, listY + 42);
                ctx.textAlign = 'left';
            }
        }

        // Footer
        ctx.fillStyle = '#5a3810';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[W/S] Select  [Tab] Switch Tab  [Enter] Buy/Upgrade  [Esc] Leave', x + 20, y + h - 12);
    },

    // ─── TAVERN PANEL ────────────────────────────────────────────────────────

    drawTavernPanel(ctx, player, selectedIndex) {
        ctx.fillStyle = '#0d0a06';
        ctx.fillRect(0, 0, 800, 720);

        const w = 560, h = 480;
        const x = (800 - w) / 2, y = (720 - h) / 2;
        this._drawPanel(ctx, x, y, w, h, 'The Broken Flagon');

        // Flavor text
        ctx.fillStyle = '#6a5030';
        ctx.font = 'italic 11px "Courier New"';
        ctx.fillText("The barkeep eyes you suspiciously. You've died before.", x + 20, y + 52);
        ctx.fillText('Many times.', x + 20, y + 64);

        // Gold
        this._drawIcon(ctx, x + w - 90, y + 12, 'coin');
        ctx.fillStyle = '#ffd020';
        ctx.font = 'bold 15px "Courier New"';
        ctx.fillText(`${player.gold}`, x + w - 68, y + 28);

        ctx.fillStyle = '#4a2808';
        ctx.fillRect(x + 20, y + 72, w - 40, 1);

        // Buff list
        const buffKeys = Object.keys(TAVERN_BUFFS);
        let listY = y + 82;
        for (let i = 0; i < buffKeys.length; i++) {
            const key = buffKeys[i];
            const buff = TAVERN_BUFFS[key];
            const selected = i === selectedIndex;
            const owned = player.tavernBuffs && player.tavernBuffs.includes(key);
            const canAfford = player.gold >= buff.cost;

            const bg = selected ? '#4a2e10' : '#1e1208';
            this._roundRect(ctx, x + 20, listY, w - 40, 50, 4);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = selected ? '#c8a030' : '#2e1808';
            ctx.lineWidth = selected ? 2 : 1;
            ctx.stroke();

            // Name
            ctx.fillStyle = owned ? '#40a040' : (canAfford ? (selected ? '#ffd060' : '#ccccaa') : '#5a4a38');
            ctx.font = selected ? 'bold 14px "Courier New"' : '14px "Courier New"';
            ctx.fillText(owned ? `✓ ${buff.name}` : buff.name, x + 30, listY + 22);

            // Description
            ctx.fillStyle = '#8a6830';
            ctx.font = '11px "Courier New"';
            ctx.fillText(buff.desc, x + 30, listY + 40);

            // Price
            if (!owned) {
                ctx.fillStyle = canAfford ? '#ffd020' : '#6a4a20';
                ctx.font = 'bold 13px "Courier New"';
                ctx.textAlign = 'right';
                ctx.fillText(`${buff.cost}g`, x + w - 24, listY + 22);
                ctx.textAlign = 'left';
            } else {
                ctx.fillStyle = '#40a040';
                ctx.font = 'bold 11px "Courier New"';
                ctx.textAlign = 'right';
                ctx.fillText('ACTIVE', x + w - 24, listY + 22);
                ctx.textAlign = 'left';
            }
            listY += 56;
        }

        // Active buffs summary
        listY += 10;
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(x + 20, listY, w - 40, 1);
        listY += 14;
        ctx.fillStyle = '#8a6030';
        ctx.font = 'bold 11px "Courier New"';
        ctx.fillText('Active Buffs (until next death):', x + 20, listY);
        listY += 16;
        if (!player.tavernBuffs || player.tavernBuffs.length === 0) {
            ctx.fillStyle = '#4a3020';
            ctx.font = 'italic 11px "Courier New"';
            ctx.fillText('None', x + 20, listY);
        } else {
            ctx.font = '11px "Courier New"';
            for (const id of player.tavernBuffs) {
                const b = TAVERN_BUFFS[id];
                if (b) {
                    ctx.fillStyle = '#40a040';
                    ctx.fillText(`• ${b.name}`, x + 20, listY);
                    listY += 14;
                }
            }
        }

        // Footer
        ctx.fillStyle = '#5a3810';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[W/S] Select  [Enter] Purchase  [Esc] Leave', x + 20, y + h - 12);
    },

    // ─── TEMPLE PANEL ────────────────────────────────────────────────────────

    drawTemplePanel(ctx, player, selectedIndex) {
        ctx.fillStyle = '#0d0a06';
        ctx.fillRect(0, 0, 800, 720);

        const w = 580, h = 560;
        const x = (800 - w) / 2, y = (720 - h) / 2;
        this._drawPanel(ctx, x, y, w, h, 'The Obsidian Shrine');

        // Flavor text
        ctx.fillStyle = '#8040c0';
        ctx.font = 'italic 11px "Courier New"';
        ctx.fillText('The shrine hums with dark energy. Something watches you.', x + 20, y + 52);

        // Soul Shards display
        ctx.fillStyle = '#c040ff';
        ctx.shadowColor = '#c040ff';
        ctx.shadowBlur = 6;
        ctx.font = 'bold 15px "Courier New"';
        ctx.textAlign = 'right';
        ctx.fillText(`✦ ${player.soulShards || 0} Soul Shards`, x + w - 20, y + 28);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';

        ctx.fillStyle = '#4a2808';
        ctx.fillRect(x + 20, y + 60, w - 40, 1);

        // Blessings list
        const blessingKeys = Object.keys(TEMPLE_BLESSINGS);
        let listY = y + 70;
        for (let i = 0; i < blessingKeys.length; i++) {
            const key = blessingKeys[i];
            const blessing = TEMPLE_BLESSINGS[key];
            const selected = i === selectedIndex;
            const owned = player.blessings && player.blessings[key];
            const canAfford = (player.soulShards || 0) >= blessing.cost;

            const bg = owned ? '#1a1a20' : (selected ? '#2a1830' : '#1a1010');
            this._roundRect(ctx, x + 20, listY, w - 40, 54, 4);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = owned ? '#606080' : (selected ? '#a040d0' : '#2e1828');
            ctx.lineWidth = selected ? 2 : 1;
            ctx.stroke();

            // Name
            if (owned) {
                ctx.fillStyle = '#606080';
                ctx.font = '14px "Courier New"';
                ctx.fillText(`✓ ${blessing.name}`, x + 30, listY + 22);
            } else {
                ctx.fillStyle = canAfford ? (selected ? '#e0a0ff' : '#c8a0d0') : '#5a4060';
                ctx.font = selected ? 'bold 14px "Courier New"' : '14px "Courier New"';
                ctx.fillText(blessing.name, x + 30, listY + 22);
            }

            // Description
            ctx.fillStyle = owned ? '#404050' : '#8a6880';
            ctx.font = '11px "Courier New"';
            ctx.fillText(blessing.desc, x + 30, listY + 42);

            // Cost
            if (!owned) {
                ctx.fillStyle = canAfford ? '#c040ff' : '#5a3060';
                ctx.font = 'bold 13px "Courier New"';
                ctx.textAlign = 'right';
                ctx.fillText(`${blessing.cost} ✦`, x + w - 24, listY + 22);
                ctx.textAlign = 'left';
            } else {
                ctx.fillStyle = '#606080';
                ctx.font = 'bold 11px "Courier New"';
                ctx.textAlign = 'right';
                ctx.fillText('BLESSED', x + w - 24, listY + 22);
                ctx.textAlign = 'left';
            }
            listY += 60;
        }

        // Footer
        ctx.fillStyle = '#5a3810';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[W/S] Select  [Enter] Purchase  [Esc] Leave', x + 20, y + h - 12);
    },

    // ─── WAREHOUSE PANEL ─────────────────────────────────────────────────────

    drawWarehousePanel(ctx, player, village, selectedIndex) {
        ctx.fillStyle = '#0d0a06';
        ctx.fillRect(0, 0, 800, 720);

        const w = 640, h = 600;
        const x = (800 - w) / 2, y = (720 - h) / 2;
        this._drawPanel(ctx, x, y, w, h, 'The Stockpile');

        // Flavor text
        ctx.fillStyle = '#6a5030';
        ctx.font = 'italic 11px "Courier New"';
        ctx.fillText('Damp and dark. The smell of failure lingers here.', x + 20, y + 52);

        // Resources row
        let ry = y + 66;
        ctx.fillStyle = '#c8a050';
        ctx.font = 'bold 12px "Courier New"';
        ctx.fillText('Resources:', x + 20, ry);
        ry += 16;

        const resources = [
            { label: 'Gold', value: player.gold || 0, color: '#ffd020', icon: 'G' },
            { label: 'Iron', value: village.resources.iron || 0, color: '#8888cc', icon: '◆' },
            { label: 'Wood', value: village.resources.wood || 0, color: '#c87820', icon: '▮' },
            { label: 'Soul Shards', value: player.soulShards || 0, color: '#c040ff', icon: '✦' },
        ];
        let rx = x + 20;
        for (const res of resources) {
            ctx.fillStyle = res.color;
            ctx.font = '13px "Courier New"';
            ctx.fillText(res.icon, rx, ry);
            ctx.font = 'bold 12px "Courier New"';
            ctx.fillText(`${res.value}`, rx + 16, ry);
            ctx.fillStyle = '#6a5030';
            ctx.font = '9px "Courier New"';
            ctx.fillText(res.label, rx, ry + 12);
            rx += 145;
        }

        ry += 24;
        ctx.fillStyle = '#4a2808';
        ctx.fillRect(x + 20, ry, w - 40, 1);
        ry += 8;

        // Equipment section
        ctx.fillStyle = '#c8a050';
        ctx.font = 'bold 12px "Courier New"';
        ctx.fillText('── Equipment ──', x + 20, ry);
        ry += 16;

        const slots = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'];
        for (const slot of slots) {
            const item = player.equipment[slot];
            ctx.fillStyle = '#2a1808';
            ctx.fillRect(x + 20, ry, w - 40, 18);
            ctx.strokeStyle = '#5a3010';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 20, ry, w - 40, 18);

            ctx.fillStyle = '#6a5030';
            ctx.font = '10px "Courier New"';
            ctx.fillText(slot.padEnd(8), x + 24, ry + 13);

            ctx.fillStyle = item ? (item.fg || '#aaa') : '#444';
            ctx.fillText(item ? `${item.name}  ${item.description || ''}` : '(empty)', x + 96, ry + 13);
            ry += 20;
        }

        ry += 6;
        ctx.fillStyle = '#4a2808';
        ctx.fillRect(x + 20, ry, w - 40, 1);
        ry += 8;

        // Inventory section
        ctx.fillStyle = '#c8a050';
        ctx.font = 'bold 12px "Courier New"';
        ctx.fillText(`── Backpack (${player.inventory.length}/${player.maxInventory}) ──`, x + 20, ry);
        ry += 16;

        const maxVisible = 8;
        const scrollOffset = Math.max(0, selectedIndex - maxVisible + 1);

        for (let i = 0; i < maxVisible && i + scrollOffset < player.inventory.length; i++) {
            const idx = i + scrollOffset;
            const item = player.inventory[idx];
            const selected = idx === selectedIndex;
            const bg = selected ? '#4a2e10' : '#1e1008';

            this._roundRect(ctx, x + 20, ry, w - 40, 22, 3);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = selected ? '#c8a030' : '#3a2008';
            ctx.lineWidth = selected ? 2 : 1;
            ctx.stroke();

            ctx.fillStyle = item.fg || '#aaa';
            ctx.fillRect(x + 26, ry + 5, 4, 12);

            ctx.fillStyle = selected ? '#ffd060' : (item.fg || '#aaa');
            ctx.font = selected ? 'bold 12px "Courier New"' : '12px "Courier New"';
            ctx.fillText(item.name, x + 36, ry + 15);

            if (item.description) {
                ctx.fillStyle = '#888060';
                ctx.font = '10px "Courier New"';
                ctx.textAlign = 'right';
                ctx.fillText(item.description, x + w - 24, ry + 15);
                ctx.textAlign = 'left';
            }
            ry += 24;
        }

        if (player.inventory.length === 0) {
            ctx.fillStyle = '#444428';
            ctx.font = 'italic 12px "Courier New"';
            ctx.fillText('Your pack is empty.', x + 20, ry + 14);
        }

        // Active tavern buffs
        ry = y + h - 60;
        ctx.fillStyle = '#4a2808';
        ctx.fillRect(x + 20, ry, w - 40, 1);
        ry += 12;
        ctx.fillStyle = '#8a6030';
        ctx.font = 'bold 10px "Courier New"';
        ctx.fillText('Tavern Buffs:', x + 20, ry);
        if (player.tavernBuffs && player.tavernBuffs.length > 0) {
            let bx = x + 110;
            for (const id of player.tavernBuffs) {
                const b = TAVERN_BUFFS[id];
                if (b) {
                    ctx.fillStyle = '#40a040';
                    ctx.fillText(b.name, bx, ry);
                    bx += ctx.measureText(b.name).width + 16;
                }
            }
        } else {
            ctx.fillStyle = '#4a3020';
            ctx.fillText('None', x + 110, ry);
        }

        // Footer
        ctx.fillStyle = '#5a3810';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[W/S] Select  [Enter] Equip/Use  [X] Drop  [Esc] Leave', x + 20, y + h - 12);
    },

    // ─── Phase 1: Dungeon Event Panels ──────────────────────────────────────

    drawFloorSelectPanel(ctx, floors, selectedIndex) {
        const cw = 800, ch = 720;
        const w = 360, h = 340;
        const x = (cw - w) / 2, y = (ch - h) / 2;

        // Backdrop
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, cw, ch);

        // Panel
        ctx.fillStyle = '#0a0608';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#4a2020';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Title
        ctx.fillStyle = '#ff4040';
        ctx.font = 'bold 20px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('Choose Your Descent', x + w / 2, y + 32);

        ctx.fillStyle = '#886060';
        ctx.font = '11px "Courier New"';
        ctx.fillText('Deeper floors have deadlier foes but richer spoils', x + w / 2, y + 52);

        // Floor list
        let fy = y + 76;
        for (let i = 0; i < floors.length; i++) {
            const sel = i === selectedIndex;
            ctx.fillStyle = sel ? '#301010' : 'transparent';
            if (sel) ctx.fillRect(x + 20, fy - 14, w - 40, 24);

            ctx.fillStyle = sel ? '#ff6040' : '#886060';
            ctx.font = (sel ? 'bold ' : '') + '14px "Courier New"';
            ctx.textAlign = 'left';
            ctx.fillText('► Floor ' + floors[i], x + 40, fy);

            // Difficulty hint
            ctx.textAlign = 'right';
            ctx.fillStyle = sel ? '#aa6040' : '#554040';
            ctx.font = '11px "Courier New"';
            if (floors[i] === 1) ctx.fillText('Safe start', x + w - 40, fy);
            else if (floors[i] >= 40) ctx.fillText('Suicidal', x + w - 40, fy);
            else if (floors[i] >= 20) ctx.fillText('Dangerous', x + w - 40, fy);
            else if (floors[i] >= 10) ctx.fillText('Challenging', x + w - 40, fy);
            else ctx.fillText('Moderate', x + w - 40, fy);

            fy += 28;
        }

        // Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#665050';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[W/S] Select  [Enter] Descend  [Esc] Floor 1', x + w / 2, y + h - 16);
        ctx.textAlign = 'left';
    },

    drawEscapeConfirm(ctx, floor) {
        const cw = 800, ch = 720;
        const w = 380, h = 120;
        const x = (cw - w) / 2, y = (ch - h) / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, cw, ch);

        ctx.fillStyle = '#0a0808';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#40e0e0';
        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('Return to Village?', x + w / 2, y + 30);

        ctx.fillStyle = '#88bbbb';
        ctx.font = '12px "Courier New"';
        ctx.fillText('You keep all gold and items.', x + w / 2, y + 54);
        ctx.fillText('Floor ' + floor + ' progress will be saved.', x + w / 2, y + 72);

        ctx.fillStyle = '#668888';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[Enter/Y] Escape    [Esc/N] Stay', x + w / 2, y + h - 14);
        ctx.textAlign = 'left';
    },

    drawEventPrompt(ctx, evDef) {
        if (!evDef) return;
        const cw = 800, ch = 720;
        const w = 420, h = 130;
        const x = (cw - w) / 2, y = (ch - h) / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, cw, ch);

        ctx.fillStyle = '#0a0608';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#885020';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#ffa040';
        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(evDef.name, x + w / 2, y + 28);

        ctx.fillStyle = '#aa8860';
        ctx.font = '12px "Courier New"';
        ctx.fillText(evDef.desc, x + w / 2, y + 52);

        ctx.fillStyle = '#ffd080';
        ctx.font = '13px "Courier New"';
        ctx.fillText(evDef.prompt, x + w / 2, y + 80);

        ctx.fillStyle = '#666050';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[Enter/Y] Accept    [Esc/N] Decline', x + w / 2, y + h - 14);
        ctx.textAlign = 'left';
    },

    drawMerchantPanel(ctx, player, items, selectedIndex) {
        const cw = 800, ch = 720;
        const w = 440, h = 280;
        const x = (cw - w) / 2, y = (ch - h) / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, cw, ch);

        ctx.fillStyle = '#0a0800';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('Wandering Merchant', x + w / 2, y + 28);
        ctx.fillStyle = '#8a7040';
        ctx.font = 'italic 11px "Courier New"';
        ctx.fillText('"Rare wares, friend... prices may vary."', x + w / 2, y + 46);

        // Gold
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd020';
        ctx.font = 'bold 12px "Courier New"';
        ctx.fillText('Gold: ' + (player.gold || 0), x + w - 20, y + 28);

        // Items
        let iy = y + 70;
        ctx.textAlign = 'left';
        if (items.length === 0) {
            ctx.fillStyle = '#554';
            ctx.font = '13px "Courier New"';
            ctx.fillText('Sold out...', x + 30, iy);
        }
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const sel = i === selectedIndex;
            if (sel) {
                ctx.fillStyle = '#1a1400';
                ctx.fillRect(x + 10, iy - 14, w - 20, 50);
            }

            ctx.fillStyle = item.fg || '#ccc';
            ctx.font = 'bold 14px "Courier New"';
            ctx.fillText(item.name, x + 30, iy);

            ctx.fillStyle = '#888';
            ctx.font = '11px "Courier New"';
            const statsStr = item.stats ? Object.entries(item.stats).map(([k,v]) => `${k}:${v > 0 ? '+' : ''}${v}`).join(' ') : '';
            ctx.fillText(statsStr, x + 30, iy + 16);

            ctx.textAlign = 'right';
            ctx.fillStyle = player.gold >= item.value ? '#ffd020' : '#ff4040';
            ctx.font = 'bold 13px "Courier New"';
            ctx.fillText(item.value + 'g', x + w - 30, iy);
            ctx.textAlign = 'left';

            iy += 55;
        }

        // Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#665';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[W/S] Select  [Enter] Buy  [Esc] Leave', x + w / 2, y + h - 14);
        ctx.textAlign = 'left';
    },

    drawPrisonerPanel(ctx, selectedIndex) {
        const cw = 800, ch = 720;
        const w = 420, h = 260;
        const x = (cw - w) / 2, y = (ch - h) / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, cw, ch);

        ctx.fillStyle = '#0a000a';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('Imprisoned Soul', x + w / 2, y + 28);
        ctx.fillStyle = '#aaaaaa';
        ctx.font = 'italic 11px "Courier New"';
        ctx.fillText('"Choose wisely... my power is yours."', x + w / 2, y + 48);

        const choices = [
            { name: '+3 STR permanently', desc: 'Raw strength courses through you' },
            { name: '+4 VIT, +20 max HP permanently', desc: 'Your body hardens against the abyss' },
            { name: '+50% potion effectiveness (this run)', desc: 'Healing magic intensifies' },
        ];

        let cy = y + 80;
        ctx.textAlign = 'left';
        for (let i = 0; i < choices.length; i++) {
            const sel = i === selectedIndex;
            if (sel) {
                ctx.fillStyle = '#1a0a1a';
                ctx.fillRect(x + 10, cy - 14, w - 20, 42);
            }
            ctx.fillStyle = sel ? '#ffffff' : '#888888';
            ctx.font = (sel ? 'bold ' : '') + '14px "Courier New"';
            ctx.fillText((sel ? '► ' : '  ') + choices[i].name, x + 24, cy);
            ctx.fillStyle = sel ? '#bbbbbb' : '#666666';
            ctx.font = 'italic 11px "Courier New"';
            ctx.fillText('  ' + choices[i].desc, x + 24, cy + 18);
            cy += 50;
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[W/S] Select  [Enter] Choose  [Esc] Decline', x + w / 2, y + h - 14);
        ctx.textAlign = 'left';
    },

    // ─── Pause Menu ─────────────────────────────────────────────────────────

    drawPauseMenu(ctx, selectedIndex, customOptions) {
        const cw = 800;
        const ch = 720;

        // Dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, cw, ch);

        // Panel — height adapts to option count
        const options = customOptions || ['Resume', 'Settings', 'Main Menu'];
        const pw = 280, ph = 140 + options.length * 40;
        const px = (cw - pw) / 2, py = (ch - ph) / 2 - 20;
        ctx.fillStyle = 'rgba(15,10,20,0.92)';
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, pw, ph);

        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 24px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', cw / 2, py + 40);
        ctx.font = '16px "Courier New"';
        for (let i = 0; i < options.length; i++) {
            const oy = py + 80 + i * 40;
            const sel = i === selectedIndex;
            if (sel) {
                ctx.fillStyle = 'rgba(255,215,0,0.1)';
                ctx.fillRect(px + 20, oy - 14, pw - 40, 28);
            }
            ctx.fillStyle = sel ? '#ffd700' : '#888';
            ctx.font = (sel ? 'bold ' : '') + '16px "Courier New"';
            ctx.fillText((sel ? '► ' : '  ') + options[i], cw / 2, oy + 4);
        }

        // Hint
        ctx.fillStyle = '#555';
        ctx.font = '11px "Courier New"';
        ctx.fillText('[Esc] Resume', cw / 2, py + ph - 14);
        ctx.textAlign = 'left';
    },

    // ─── Settings Panel ───────────────────────────────────────────────────────

    drawSettingsPanel(ctx, settings, selectedIndex) {
        const cw = 800;
        const ch = 720;

        // Dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, cw, ch);

        // Panel
        const pw = 360, ph = 310;
        const px = (cw - pw) / 2, py = (ch - ph) / 2 - 20;
        ctx.fillStyle = 'rgba(15,10,20,0.92)';
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, pw, ph);

        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 22px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('SETTINGS', cw / 2, py + 38);

        // Items
        const items = [
            { label: 'Master Volume', value: settings.masterVolume, type: 'slider' },
            { label: 'SFX Volume',    value: settings.sfxVolume,    type: 'slider' },
            { label: 'Music Volume',  value: settings.musicVolume,  type: 'slider' },
            { label: 'Fullscreen',    value: settings.fullscreen,   type: 'toggle' },
            { label: 'Assist Mode',  value: settings.assistMode,   type: 'toggle' },
        ];

        ctx.textAlign = 'left';
        for (let i = 0; i < items.length; i++) {
            const iy = py + 72 + i * 40;
            const sel = i === selectedIndex;
            const item = items[i];

            if (sel) {
                ctx.fillStyle = 'rgba(255,215,0,0.08)';
                ctx.fillRect(px + 10, iy - 12, pw - 20, 32);
            }

            ctx.fillStyle = sel ? '#ffd700' : '#aaa';
            ctx.font = (sel ? 'bold ' : '') + '14px "Courier New"';
            ctx.fillText((sel ? '► ' : '  ') + item.label, px + 20, iy + 6);

            if (item.type === 'slider') {
                // Volume bar
                const barX = px + 210, barW = 120, barH = 10;
                const barY = iy - 2;
                ctx.fillStyle = '#222';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.fillStyle = sel ? '#ffd700' : '#888';
                ctx.fillRect(barX, barY, barW * item.value, barH);
                ctx.strokeStyle = '#444';
                ctx.strokeRect(barX, barY, barW, barH);
                // Percentage
                ctx.textAlign = 'right';
                ctx.fillStyle = sel ? '#fff' : '#888';
                ctx.font = '12px "Courier New"';
                ctx.fillText(Math.round(item.value * 100) + '%', px + pw - 16, iy + 6);
                ctx.textAlign = 'left';
            } else {
                // Toggle
                ctx.textAlign = 'right';
                ctx.fillStyle = item.value ? '#40ff40' : '#ff4040';
                ctx.font = 'bold 14px "Courier New"';
                ctx.fillText(item.value ? 'ON' : 'OFF', px + pw - 16, iy + 6);
                ctx.textAlign = 'left';
            }
        }

        // Assist mode info line
        if (settings.assistMode) {
            const deaths = (Game.state && Game.state.totalDeaths) || 0;
            const reduction = Math.min(80, 20 + deaths * 2);
            ctx.fillStyle = '#c080ff';
            ctx.font = 'italic 11px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(`Damage reduced by ${reduction}% (grows per death)`, cw / 2, py + ph - 34);
        }

        // Hint
        ctx.fillStyle = '#555';
        ctx.font = '11px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('[A/D] Adjust  [Esc] Back', cw / 2, py + ph - 14);
        ctx.textAlign = 'left';
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

    // ─── TUTORIAL HINT ──────────────────────────────────────────────────────────

    drawTutorialHint(ctx, text, alpha) {
        if (alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        const w = Math.min(text.length * 9 + 40, 600);
        const x = (800 - w) / 2;
        const y = 10;
        const h = 32;
        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255,220,80,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        // Text
        ctx.fillStyle = '#ffd850';
        ctx.font = '13px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(text, 400, y + 20);
        ctx.textAlign = 'left';
        ctx.restore();
    },
};
