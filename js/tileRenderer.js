// TileRenderer — pure stateless canvas drawing functions for terrain tiles
// All functions take (ctx, x, y, w, h) where x/y = top-left pixel, w=h=32

const TileRenderer = {

    // ─── Helpers ────────────────────────────────────────────────────────────

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    // ─── VOID ───────────────────────────────────────────────────────────────

    drawVoid(ctx, x, y, w, h) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, w, h);
    },

    // ─── WALL ───────────────────────────────────────────────────────────────

    drawWall(ctx, x, y, w, h) {
        // Base stone gradient
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0,   '#4a3f30');
        grad.addColorStop(0.5, '#3a2f20');
        grad.addColorStop(1,   '#251a0e');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // Two rows of bricks (offset pattern)
        // Top row
        ctx.fillStyle = '#56473a';
        ctx.fillRect(x + 2,  y + 2,  13, 11);
        ctx.fillRect(x + 17, y + 2,  13, 11);
        // Bottom row (offset by half)
        ctx.fillStyle = '#4e4030';
        ctx.fillRect(x + 2,  y + 17, 7,  11);
        ctx.fillRect(x + 11, y + 17, 11, 11);
        ctx.fillRect(x + 24, y + 17, 6,  11);

        // Mortar (dark lines)
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(x,      y + 14, w,  2);   // horizontal mortar
        ctx.fillRect(x + 15, y + 2,  2,  12);  // top row vertical
        ctx.fillRect(x + 9,  y + 17, 2,  12);  // bottom row V1
        ctx.fillRect(x + 22, y + 17, 2,  12);  // bottom row V2

        // Edge shadows for depth
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(x, y, w, 2);
        ctx.fillRect(x, y + h - 2, w, 2);
        ctx.fillRect(x, y, 2, h);

        // Highlight top-left brick edge
        ctx.fillStyle = 'rgba(255,220,160,0.06)';
        ctx.fillRect(x + 2, y + 2, 13, 2);
        ctx.fillRect(x + 2, y + 2, 2, 11);
    },

    // ─── FLOOR ──────────────────────────────────────────────────────────────

    drawFloor(ctx, x, y, w, h, dimFactor = 1.0) {
        // Base worn stone
        const bright = dimFactor >= 1.0;
        ctx.fillStyle = bright ? '#26190d' : '#141008';
        ctx.fillRect(x, y, w, h);

        if (!bright) return; // skip details for dim tiles (performance)

        // Stone slab edge lines
        ctx.fillStyle = '#332212';
        ctx.fillRect(x + 2, y + 15, w - 4, 1);  // horizontal crack
        ctx.fillRect(x + 14, y + 2, 1, 13);     // vertical crack

        // Worn corner shading
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x, y, 4, 4);
        ctx.fillRect(x + w - 4, y + h - 4, 4, 4);

        // Deterministic speckle (based on position to avoid flickering)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        const seed = ((x * 7 + y * 13) & 0xffff) % 8;
        const speckles = [[3,4],[8,12],[20,6],[25,22],[12,26],[28,10],[6,20],[18,28]];
        const sp = speckles[seed];
        ctx.fillRect(x + sp[0], y + sp[1], 2, 2);

        // Subtle highlight in center
        ctx.fillStyle = 'rgba(255,200,120,0.04)';
        ctx.fillRect(x + 8, y + 8, 16, 16);
    },

    // ─── DOOR ───────────────────────────────────────────────────────────────

    drawDoor(ctx, x, y, w, h) {
        // Floor base
        this.drawFloor(ctx, x, y, w, h);

        // Stone door frame
        ctx.fillStyle = '#4a3a28';
        ctx.fillRect(x,         y,     4, h);
        ctx.fillRect(x + w - 4, y,     4, h);
        ctx.fillRect(x,         y,     w, 4);

        // Wooden door planks
        ctx.fillStyle = '#7a5028';
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

        // Plank lines
        ctx.fillStyle = '#5a3818';
        for (let dy = 0; dy < 3; dy++) {
            ctx.fillRect(x + 4, y + 4 + dy * 9, w - 8, 1);
        }
        // Vertical grain
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + w / 2 - 1, y + 4, 2, h - 8);

        // Door handle
        ctx.fillStyle = '#c8a030';
        ctx.beginPath();
        ctx.arc(x + w - 9, y + h / 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Gold door frame highlight
        ctx.strokeStyle = '#c8a030';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
    },

    // ─── STAIRS DOWN ────────────────────────────────────────────────────────

    drawStairsDown(ctx, x, y, w, h) {
        this.drawFloor(ctx, x, y, w, h);

        // Stair steps
        const steps = 4;
        for (let i = 0; i < steps; i++) {
            const sy = y + 4 + i * 6;
            const indent = i * 3;
            ctx.fillStyle = `rgb(${40 - i * 5}, ${30 - i * 4}, ${20 - i * 3})`;
            ctx.fillRect(x + 4 + indent, sy, w - 8 - indent * 2, 5);
            // Step highlight
            ctx.fillStyle = 'rgba(255,220,120,0.15)';
            ctx.fillRect(x + 4 + indent, sy, w - 8 - indent * 2, 1);
        }

        // Down arrow overlay
        ctx.fillStyle = 'rgba(0,200,200,0.7)';
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h - 5);
        ctx.lineTo(x + w / 2 - 5, y + h - 12);
        ctx.lineTo(x + w / 2 + 5, y + h - 12);
        ctx.closePath();
        ctx.fill();

        // Glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    // ─── STAIRS UP ──────────────────────────────────────────────────────────

    drawStairsUp(ctx, x, y, w, h) {
        this.drawFloor(ctx, x, y, w, h);

        // Stair steps (ascending)
        const steps = 4;
        for (let i = 0; i < steps; i++) {
            const sy = y + 4 + i * 6;
            const indent = (steps - 1 - i) * 3;
            ctx.fillStyle = `rgb(${30 + i * 5}, ${24 + i * 4}, ${16 + i * 3})`;
            ctx.fillRect(x + 4 + indent, sy, w - 8 - indent * 2, 5);
            ctx.fillStyle = 'rgba(255,220,120,0.15)';
            ctx.fillRect(x + 4 + indent, sy, w - 8 - indent * 2, 1);
        }

        // Up arrow
        ctx.fillStyle = 'rgba(0,200,200,0.7)';
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + 5);
        ctx.lineTo(x + w / 2 - 5, y + 12);
        ctx.lineTo(x + w / 2 + 5, y + 12);
        ctx.closePath();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    // ─── WATER ──────────────────────────────────────────────────────────────

    drawWater(ctx, x, y, w, h, time = 0) {
        // Deep water base
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0,   '#0a1a3a');
        grad.addColorStop(1,   '#050e20');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // Animated ripple lines
        const waveOffset = (time * 1.5) % 1;
        ctx.strokeStyle = 'rgba(40,120,200,0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const wy = y + ((i / 3 + waveOffset) % 1) * h;
            const amp = 2 * Math.sin(time * 2 + i);
            ctx.beginPath();
            ctx.moveTo(x, wy + amp);
            ctx.quadraticCurveTo(x + w / 4, wy - amp, x + w / 2, wy + amp);
            ctx.quadraticCurveTo(x + 3 * w / 4, wy - amp, x + w, wy + amp);
            ctx.stroke();
        }

        // Shimmer highlight
        const shimmer = 0.05 + 0.03 * Math.sin(time * 3);
        ctx.fillStyle = `rgba(100,180,255,${shimmer})`;
        ctx.fillRect(x + 6, y + 4, 8, 3);
    },

    // ─── CHEST ──────────────────────────────────────────────────────────────

    drawChest(ctx, x, y, w, h) {
        this.drawFloor(ctx, x, y, w, h);

        const cx = x + w / 2, cy = y + h / 2 + 2;
        const cw = 20, ch = 14;

        // Chest shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(cx - cw / 2 + 2, cy - ch / 2 + 14, cw, 4);

        // Chest body (lower half)
        const bodyGrad = ctx.createLinearGradient(cx, cy, cx, cy + ch / 2);
        bodyGrad.addColorStop(0, '#7a4820');
        bodyGrad.addColorStop(1, '#4a2810');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(cx - cw / 2, cy, cw, ch / 2);

        // Chest lid (upper half, slightly wider)
        const lidGrad = ctx.createLinearGradient(cx, cy - ch / 2, cx, cy);
        lidGrad.addColorStop(0, '#9a5828');
        lidGrad.addColorStop(1, '#7a4020');
        ctx.fillStyle = lidGrad;
        this._roundRect(ctx, cx - cw / 2 - 1, cy - ch / 2, cw + 2, ch / 2 + 2, 3);
        ctx.fill();

        // Metal bands (horizontal)
        ctx.fillStyle = '#c8a030';
        ctx.fillRect(cx - cw / 2, cy - 1, cw, 2);
        ctx.fillRect(cx - cw / 2, cy - ch / 2 + 3, cw, 2);
        ctx.fillRect(cx - cw / 2, cy + ch / 2 - 3, cw, 2);

        // Vertical band
        ctx.fillRect(cx - 1, cy - ch / 2, 2, ch);

        // Lock
        ctx.fillStyle = '#ffd030';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Gold glow
        ctx.shadowColor = '#ffa020';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    // ─── VILLAGE TILES ──────────────────────────────────────────────────────

    drawGrass(ctx, x, y, w, h, variant = 0) {
        // Base green
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, '#1e3d10');
        grad.addColorStop(1, '#162d0c');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // Subtle texture dots
        ctx.fillStyle = 'rgba(60,100,20,0.3)';
        const seed = variant % 6;
        const dots = [[5,8],[12,18],[22,6],[26,24],[9,28],[20,14]];
        ctx.fillRect(x + dots[seed][0], y + dots[seed][1], 2, 2);

        // Grass tufts (short vertical strokes)
        ctx.strokeStyle = '#2a6016';
        ctx.lineWidth = 1;
        const tufts = [
            [4, 24], [10, 20], [18, 26], [24, 16], [8, 12], [28, 22],
        ];
        const tuftsToShow = 2 + (variant % 3);
        for (let i = 0; i < tuftsToShow && i < tufts.length; i++) {
            const [tx, ty] = tufts[(i + variant) % tufts.length];
            ctx.beginPath();
            ctx.moveTo(x + tx,     y + ty);
            ctx.lineTo(x + tx - 1, y + ty - 5);
            ctx.moveTo(x + tx,     y + ty);
            ctx.lineTo(x + tx + 2, y + ty - 4);
            ctx.stroke();
        }
    },

    drawPath(ctx, x, y, w, h) {
        // Dirt base
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#5a3e22');
        grad.addColorStop(1, '#3e2a14');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // Pebbles
        ctx.fillStyle = '#6a4e32';
        ctx.fillRect(x + 6,  y + 8,  3, 2);
        ctx.fillRect(x + 18, y + 20, 2, 3);
        ctx.fillRect(x + 24, y + 12, 3, 2);
        ctx.fillRect(x + 10, y + 26, 2, 2);

        // Subtle rut lines
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + w / 3, y + 2, 1, h - 4);
    },

    drawTree(ctx, x, y, w, h) {
        const cx = x + w / 2;
        const ty = y + 4;

        // Trunk
        const trunkGrad = ctx.createLinearGradient(cx - 4, 0, cx + 4, 0);
        trunkGrad.addColorStop(0, '#6a4020');
        trunkGrad.addColorStop(0.5, '#8a5828');
        trunkGrad.addColorStop(1, '#4a2810');
        ctx.fillStyle = trunkGrad;
        ctx.fillRect(cx - 4, y + h - 12, 8, 12);

        // Roots
        ctx.fillStyle = '#5a3818';
        ctx.fillRect(cx - 7, y + h - 5, 4, 5);
        ctx.fillRect(cx + 3, y + h - 5, 4, 5);

        // Canopy — 3 layered circles for depth
        ctx.fillStyle = '#1a4808';
        ctx.beginPath();
        ctx.arc(cx, ty + 14, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#22580e';
        ctx.beginPath();
        ctx.arc(cx - 4, ty + 10, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2c6814';
        ctx.beginPath();
        ctx.arc(cx + 3, ty + 8, 9, 0, Math.PI * 2);
        ctx.fill();

        // Highlight (sunlit top)
        ctx.fillStyle = 'rgba(80,200,40,0.12)';
        ctx.beginPath();
        ctx.arc(cx - 2, ty + 6, 6, 0, Math.PI * 2);
        ctx.fill();
    },

    // Ground tile under buildings — flat grassy dirt
    drawBuildingGround(ctx, x, y, w, h) {
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, '#1a3510');
        grad.addColorStop(1, '#14280c');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
        // Subtle dirt patches
        ctx.fillStyle = 'rgba(80,60,30,0.15)';
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    },

    // Building — drawn at 3×3 tile size (96×96) in second pass
    drawBuilding(ctx, x, y, w, h, def, level) {
        const cx = x + w / 2;
        const roofColor = def ? def.fg : '#888888';

        // Foundation (stone base, bottom 60%)
        const baseGrad = ctx.createLinearGradient(x, y + h * 0.35, x, y + h);
        baseGrad.addColorStop(0, '#4a4038');
        baseGrad.addColorStop(0.5, '#3a3228');
        baseGrad.addColorStop(1, '#28221a');
        ctx.fillStyle = baseGrad;
        const baseY = Math.floor(y + h * 0.38);
        const baseH = h - (baseY - y);
        ctx.fillRect(x + 6, baseY, w - 12, baseH);

        // Stone block texture
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let by = baseY + 4; by < y + h - 6; by += 12) {
            let offset = ((by - baseY) / 12) % 2 === 0 ? 0 : 8;
            for (let bx = x + 8 + offset; bx < x + w - 10; bx += 16) {
                ctx.fillRect(bx, by, 14, 10);
            }
        }
        // Stone block highlights
        ctx.fillStyle = 'rgba(255,220,160,0.06)';
        for (let by = baseY + 4; by < y + h - 6; by += 12) {
            let offset = ((by - baseY) / 12) % 2 === 0 ? 0 : 8;
            for (let bx = x + 8 + offset; bx < x + w - 10; bx += 16) {
                ctx.fillRect(bx, by, 14, 1);
            }
        }

        // Base outline
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 6, baseY, w - 12, baseH);

        // Roof (coloured triangle)
        const roofY = y + 4;
        const roofBase = baseY + 4;
        const roofGrad = ctx.createLinearGradient(cx, roofY, cx, roofBase);
        roofGrad.addColorStop(0, roofColor);
        roofGrad.addColorStop(0.6, this._darken(roofColor, 0.3));
        roofGrad.addColorStop(1, this._darken(roofColor, 0.5));
        ctx.fillStyle = roofGrad;
        ctx.beginPath();
        ctx.moveTo(x + 2,     roofBase);
        ctx.lineTo(cx,         roofY);
        ctx.lineTo(x + w - 2, roofBase);
        ctx.closePath();
        ctx.fill();

        // Roof outline
        ctx.strokeStyle = this._darken(roofColor, 0.6);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Roof ridge highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, roofY + 2);
        ctx.lineTo(x + 10, roofBase - 2);
        ctx.stroke();

        // Roof shadow underline
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x + 4, roofBase - 1, w - 8, 4);

        // Door (arched)
        const dw = Math.floor(w * 0.2);
        const dh = Math.floor(h * 0.32);
        const dx = cx - dw / 2;
        const dy = y + h - dh;
        ctx.fillStyle = '#2a1808';
        ctx.beginPath();
        ctx.moveTo(dx, y + h);
        ctx.lineTo(dx, dy + dw / 2);
        ctx.quadraticCurveTo(dx, dy, dx + dw / 2, dy);
        ctx.quadraticCurveTo(dx + dw, dy, dx + dw, dy + dw / 2);
        ctx.lineTo(dx + dw, y + h);
        ctx.closePath();
        ctx.fill();

        // Door frame
        ctx.strokeStyle = '#5a3818';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Warm light inside door
        const doorGlow = ctx.createRadialGradient(cx, dy + dh / 2, 2, cx, dy + dh / 2, dw);
        doorGlow.addColorStop(0, 'rgba(255,180,80,0.3)');
        doorGlow.addColorStop(1, 'rgba(255,100,20,0)');
        ctx.fillStyle = doorGlow;
        ctx.beginPath();
        ctx.moveTo(dx + 2, y + h);
        ctx.lineTo(dx + 2, dy + dw / 2);
        ctx.quadraticCurveTo(dx + 2, dy + 2, cx, dy + 2);
        ctx.quadraticCurveTo(dx + dw - 2, dy + 2, dx + dw - 2, dy + dw / 2);
        ctx.lineTo(dx + dw - 2, y + h);
        ctx.closePath();
        ctx.fill();

        // Windows (two pairs)
        const winY = baseY + 10;
        const winW = 10, winH = 12;
        const winLeft  = x + 14;
        const winRight = x + w - 24;
        for (const wx of [winLeft, winRight]) {
            // Window recess
            ctx.fillStyle = '#1a1008';
            ctx.fillRect(wx, winY, winW, winH);
            // Warm glow
            ctx.fillStyle = 'rgba(255,200,80,0.35)';
            ctx.fillRect(wx + 1, winY + 1, winW - 2, winH - 2);
            // Cross bars
            ctx.fillStyle = '#5a4020';
            ctx.fillRect(wx + winW / 2 - 1, winY, 2, winH);
            ctx.fillRect(wx, winY + winH / 2 - 1, winW, 2);
            // Frame
            ctx.strokeStyle = '#6a5030';
            ctx.lineWidth = 1;
            ctx.strokeRect(wx, winY, winW, winH);
        }

        // Level badge
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x + w - 22, y + 6, 18, 12);
        ctx.strokeStyle = '#aa8030';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + w - 22, y + 6, 18, 12);
        ctx.fillStyle = '#ffd060';
        ctx.font = 'bold 10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`L${level}`, x + w - 13, y + 15);
        ctx.textAlign = 'left';

        // Building name below roof
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '8px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(def ? def.name : '', cx, roofBase + 12);
        ctx.textAlign = 'left';
    },

    // Empty plot — dashed outline on cleared ground
    drawEmptyPlot(ctx, x, y, w, h, def) {
        // Cleared ground
        ctx.fillStyle = '#1e3510';
        ctx.fillRect(x, y, w, h);

        // Pegged corners / construction stakes
        ctx.fillStyle = '#5a3818';
        const s = 6;
        ctx.fillRect(x + 4,     y + 4,     s, s);
        ctx.fillRect(x + w - 4 - s, y + 4,     s, s);
        ctx.fillRect(x + 4,     y + h - 4 - s, s, s);
        ctx.fillRect(x + w - 4 - s, y + h - 4 - s, s, s);

        // Dashed border
        ctx.strokeStyle = 'rgba(200,160,80,0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);
        ctx.setLineDash([]);

        // Label
        if (def) {
            ctx.fillStyle = 'rgba(200,160,80,0.6)';
            ctx.font = '9px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(def.name, x + w / 2, y + h / 2 - 4);
            ctx.fillStyle = 'rgba(200,160,80,0.4)';
            ctx.font = '8px Courier New';
            ctx.fillText('[Enter] Build', x + w / 2, y + h / 2 + 8);
            ctx.textAlign = 'left';
        }
    },

    drawDungeonEntrance(ctx, x, y, w, h) {
        // Stone arch base
        this.drawPath(ctx, x, y, w, h);

        // Dark portal inner
        ctx.fillStyle = '#080408';
        ctx.beginPath();
        ctx.moveTo(x + 4,     y + h);
        ctx.lineTo(x + 4,     y + h / 3);
        ctx.quadraticCurveTo(x + 4,     y + 2, x + w / 2, y + 2);
        ctx.quadraticCurveTo(x + w - 4, y + 2, x + w - 4, y + h / 3);
        ctx.lineTo(x + w - 4, y + h);
        ctx.closePath();
        ctx.fill();

        // Red glow inside
        const portalGrad = ctx.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, w / 2);
        portalGrad.addColorStop(0,   'rgba(180,20,20,0.5)');
        portalGrad.addColorStop(0.5, 'rgba(100,10,10,0.3)');
        portalGrad.addColorStop(1,   'rgba(50,0,0,0)');
        ctx.fillStyle = portalGrad;
        ctx.beginPath();
        ctx.moveTo(x + 4,     y + h);
        ctx.lineTo(x + 4,     y + h / 3);
        ctx.quadraticCurveTo(x + 4,     y + 2, x + w / 2, y + 2);
        ctx.quadraticCurveTo(x + w - 4, y + 2, x + w - 4, y + h / 3);
        ctx.lineTo(x + w - 4, y + h);
        ctx.closePath();
        ctx.fill();

        // Stone pillars
        ctx.fillStyle = '#5a4a38';
        ctx.fillRect(x,         y + h / 3, 4, h * 2 / 3);
        ctx.fillRect(x + w - 4, y + h / 3, 4, h * 2 / 3);

        // Arch top
        ctx.strokeStyle = '#6a5a48';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + h / 3);
        ctx.quadraticCurveTo(x + 4,     y + 2, x + w / 2, y + 2);
        ctx.quadraticCurveTo(x + w - 4, y + 2, x + w - 4, y + h / 3);
        ctx.stroke();

        // Skull above arch
        ctx.fillStyle = '#e8d8c0';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.fillRect(x + w / 2 - 2, y + 3, 2, 2);
        ctx.fillRect(x + w / 2 + 1, y + 3, 2, 2);
    },

    // ─── Internal helper ────────────────────────────────────────────────────

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

    // ─── Dispatch by TILE constant ──────────────────────────────────────────

    drawTile(ctx, x, y, w, h, tileType, dimFactor = 1.0, time = 0, variant = 0) {
        if (dimFactor <= 0) {
            this.drawVoid(ctx, x, y, w, h);
            return;
        }

        // Save/restore alpha for dimming
        if (dimFactor < 1.0) {
            ctx.save();
            ctx.globalAlpha = dimFactor;
        }

        switch (tileType) {
            case 0: this.drawVoid(ctx, x, y, w, h); break;         // VOID
            case 1: this.drawWall(ctx, x, y, w, h); break;         // WALL
            case 2: this.drawFloor(ctx, x, y, w, h, dimFactor); break; // FLOOR
            case 3: this.drawDoor(ctx, x, y, w, h); break;         // DOOR
            case 4: this.drawStairsDown(ctx, x, y, w, h); break;   // STAIRS_DOWN
            case 5: this.drawStairsUp(ctx, x, y, w, h); break;     // STAIRS_UP
            case 6: this.drawWater(ctx, x, y, w, h, time); break;  // WATER
            case 7: this.drawChest(ctx, x, y, w, h); break;        // CHEST
            default: this.drawVoid(ctx, x, y, w, h);
        }

        if (dimFactor < 1.0) {
            ctx.restore();
        }
    },
};
