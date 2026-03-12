// TileRenderer — pure stateless canvas drawing functions for terrain tiles
// All functions take (ctx, x, y, w, h) where x/y = top-left pixel, w=h=32

// ─── Dungeon Floor Themes ────────────────────────────────────────────────────
const DUNGEON_THEMES = {
    stone: {
        wall1: '#4a3f30', wall2: '#3a2f20', wall3: '#251a0e',
        brick1: '#56473a', brick2: '#4e4030', mortar: '#1a1008',
        floor1: '#26190d', floor2: '#141008', floorCrack: '#332212',
        floorHighlight: 'rgba(255,200,120,0.04)',
        water1: '#0a1a3a', water2: '#050e20', waterRipple: 'rgba(40,120,200,0.5)',
        waterShimmer: [100, 180, 255],
        ambient: null,
        hasMoss: true,
    },
    frost: {
        wall1: '#3a4860', wall2: '#2a3850', wall3: '#1a2838',
        brick1: '#4a5870', brick2: '#3e4e62', mortar: '#101828',
        floor1: '#1a2030', floor2: '#101820', floorCrack: '#253040',
        floorHighlight: 'rgba(140,200,255,0.05)',
        water1: '#0a2840', water2: '#061828', waterRipple: 'rgba(80,180,255,0.6)',
        waterShimmer: [140, 210, 255],
        ambient: 'rgba(100,160,255,0.06)',
        hasMoss: true,
    },
    magma: {
        wall1: '#4a2020', wall2: '#3a1818', wall3: '#281010',
        brick1: '#5a2828', brick2: '#4e2020', mortar: '#1a0808',
        floor1: '#201008', floor2: '#180808', floorCrack: '#3a1810',
        floorHighlight: 'rgba(255,140,60,0.06)',
        water1: '#3a1000', water2: '#280800', waterRipple: 'rgba(255,100,20,0.6)',
        waterShimmer: [255, 120, 40],
        ambient: 'rgba(255,80,20,0.05)',
        hasMoss: false,
    },
    abyss: {
        wall1: '#302040', wall2: '#201830', wall3: '#141020',
        brick1: '#3a2850', brick2: '#302040', mortar: '#0a0818',
        floor1: '#140e1a', floor2: '#0e0a14', floorCrack: '#201830',
        floorHighlight: 'rgba(180,120,255,0.04)',
        water1: '#100828', water2: '#08041a', waterRipple: 'rgba(140,60,255,0.5)',
        waterShimmer: [160, 100, 255],
        ambient: 'rgba(120,60,200,0.05)',
        hasMoss: false,
    },
    infernal: {
        wall1: '#3a1820', wall2: '#2a1018', wall3: '#1a0810',
        brick1: '#4a2028', brick2: '#3e1820', mortar: '#140408',
        floor1: '#1a0c08', floor2: '#140808', floorCrack: '#301810',
        floorHighlight: 'rgba(200,255,80,0.05)',
        water1: '#281000', water2: '#1a0800', waterRipple: 'rgba(200,255,60,0.5)',
        waterShimmer: [200, 255, 80],
        ambient: 'rgba(180,255,40,0.04)',
        hasMoss: false,
    },
};

const TileRenderer = {

    currentTheme: DUNGEON_THEMES.stone,

    setTheme(floor) {
        if (floor <= 10)      this.currentTheme = DUNGEON_THEMES.stone;
        else if (floor <= 20) this.currentTheme = DUNGEON_THEMES.frost;
        else if (floor <= 30) this.currentTheme = DUNGEON_THEMES.magma;
        else if (floor <= 40) this.currentTheme = DUNGEON_THEMES.abyss;
        else                  this.currentTheme = DUNGEON_THEMES.infernal;
    },

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
        const t = this.currentTheme;
        const seed = ((x * 7 + y * 13) & 0xffff) % 8;

        // Base stone gradient
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0,   t.wall1);
        grad.addColorStop(0.5, t.wall2);
        grad.addColorStop(1,   t.wall3);
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // --- 3 rows of varied bricks ---
        // Parse base brick colors for per-brick variation
        const b1 = t.brick1, b2 = t.brick2;

        // Row definitions: [yStart, height, brickWidths[]]
        const rows = [
            { yOff: 2,  bh: 8,  widths: [14, 14] },           // row 0
            { yOff: 12, bh: 8,  widths: [8, 12, 8] },         // row 1 (offset)
            { yOff: 22, bh: 8,  widths: [10, 10, 8] },        // row 2
        ];

        // Vary brick widths slightly based on seed
        const wVar = [0, 1, -1, 2, -1, 0, 1, -2];
        let brickIndex = 0;

        for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            let bx = x + 2;
            for (let b = 0; b < row.widths.length; b++) {
                const bw = Math.max(4, row.widths[b] + wVar[(brickIndex + seed) % 8]);
                const by = y + row.yOff;

                // Per-brick color variation: parse hex and adjust brightness
                const baseBrick = (r + b) % 2 === 0 ? b1 : b2;
                const bSeed = ((brickIndex * 3 + seed * 5) & 0xff) % 8;
                const brightShift = [-8, 4, -4, 8, 0, -6, 6, -2][bSeed];
                // Apply brightness shift to brick color
                const bHex = baseBrick.replace('#', '');
                const br = Math.min(255, Math.max(0, parseInt(bHex.slice(0,2),16) + brightShift));
                const bg = Math.min(255, Math.max(0, parseInt(bHex.slice(2,4),16) + brightShift));
                const bb = Math.min(255, Math.max(0, parseInt(bHex.slice(4,6),16) + brightShift));
                ctx.fillStyle = `rgb(${br},${bg},${bb})`;
                ctx.fillRect(bx, by, bw, row.bh);

                // Individual brick highlight — subtle lighter line on top edge
                ctx.fillStyle = 'rgba(255,220,160,0.08)';
                ctx.fillRect(bx, by, bw, 1);

                // Moss patches (stone and frost themes only, ~30% of bricks)
                if (t.hasMoss && (bSeed < 3)) {
                    ctx.fillStyle = 'rgba(42,80,32,0.4)';
                    // Small moss patch at bottom-left or bottom-right of brick
                    const mossX = bSeed === 0 ? bx : bx + bw - 3;
                    ctx.fillRect(mossX, by + row.bh - 3, 3, 3);
                    if (bSeed === 2) {
                        ctx.fillRect(bx + 1, by + row.bh - 2, 4, 2);
                    }
                }

                bx += bw + 2; // 2px mortar gap
                brickIndex++;
            }
        }

        // Mortar lines (dark)
        ctx.fillStyle = t.mortar;
        ctx.fillRect(x, y + 10, w, 2);    // horizontal mortar row 0-1
        ctx.fillRect(x, y + 20, w, 2);    // horizontal mortar row 1-2

        // Vertical mortar for row 0
        ctx.fillRect(x + 16 + wVar[seed % 8], y + 2, 2, 8);
        // Vertical mortar for row 1
        ctx.fillRect(x + 10 + wVar[(seed+1) % 8], y + 12, 2, 8);
        ctx.fillRect(x + 24 + wVar[(seed+2) % 8], y + 12, 2, 8);
        // Vertical mortar for row 2
        ctx.fillRect(x + 12 + wVar[(seed+3) % 8], y + 22, 2, 8);
        ctx.fillRect(x + 24 + wVar[(seed+4) % 8], y + 22, 2, 8);

        // Crack details — thin dark diagonal lines across 1-2 bricks
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        if (seed < 4) {
            // Crack on first area
            const cx1 = x + 4 + seed * 3;
            const cy1 = y + 3 + seed * 2;
            ctx.beginPath();
            ctx.moveTo(cx1, cy1);
            ctx.lineTo(cx1 + 6, cy1 + 8);
            ctx.stroke();
        }
        if (seed >= 3 && seed < 7) {
            // Second crack
            const cx2 = x + 18 + (seed - 3) * 2;
            const cy2 = y + 14 + (seed - 3) * 2;
            ctx.beginPath();
            ctx.moveTo(cx2, cy2);
            ctx.lineTo(cx2 + 5, cy2 + 6);
            ctx.stroke();
        }

        // Deeper edge shadows: 3px top, 2px left
        const topShadow = ctx.createLinearGradient(x, y, x, y + 3);
        topShadow.addColorStop(0, 'rgba(0,0,0,0.5)');
        topShadow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topShadow;
        ctx.fillRect(x, y, w, 3);

        const leftShadow = ctx.createLinearGradient(x, y, x + 2, y);
        leftShadow.addColorStop(0, 'rgba(0,0,0,0.5)');
        leftShadow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = leftShadow;
        ctx.fillRect(x, y, 2, h);

        // Bottom edge shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(x, y + h - 2, w, 2);

        // Wall cap — slightly lighter 2px strip at very top suggesting a ledge
        ctx.fillStyle = 'rgba(255,220,160,0.1)';
        ctx.fillRect(x, y, w, 2);
    },

    // ─── FLOOR ──────────────────────────────────────────────────────────────

    drawFloor(ctx, x, y, w, h, dimFactor = 1.0) {
        const t = this.currentTheme;
        // Base worn stone
        const bright = dimFactor >= 1.0;
        ctx.fillStyle = bright ? t.floor1 : t.floor2;
        ctx.fillRect(x, y, w, h);

        if (!bright) return; // skip details for dim tiles (performance)

        const seed = ((x * 7 + y * 13) & 0xffff) % 8;

        // Sub-tile grid: faint mortar lines suggesting 16x16 stone blocks
        ctx.fillStyle = t.floorCrack;
        ctx.fillRect(x, y + 15, w, 1);           // horizontal mortar
        ctx.fillRect(x + 15, y, 1, h);           // vertical mortar
        // Secondary faint lines for added texture
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(x, y + 16, w, 1);
        ctx.fillRect(x + 16, y, 1, h);

        // Edge weathering: faint dark line along top or left edge
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        if (seed % 2 === 0) {
            ctx.fillRect(x, y, w, 1);   // top edge wear
        } else {
            ctx.fillRect(x, y, 1, h);   // left edge wear
        }

        // Improved corner shadows: 6px triangular gradient shadows at two corners
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        // Top-left triangle shadow
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 6, y);
        ctx.lineTo(x, y + 6);
        ctx.closePath();
        ctx.fill();
        // Bottom-right triangle shadow
        ctx.beginPath();
        ctx.moveTo(x + w, y + h);
        ctx.lineTo(x + w - 6, y + h);
        ctx.lineTo(x + w, y + h - 6);
        ctx.closePath();
        ctx.fill();

        // Multiple speckle points: 3-4 speckles per tile, varying sizes
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        const speckleData = [
            [[3,4,1],[8,12,2],[20,6,1]],
            [[5,18,2],[25,8,1],[14,26,1],[28,3,2]],
            [[10,5,1],[22,20,2],[4,28,1]],
            [[7,10,2],[26,14,1],[15,24,1],[2,20,2]],
            [[12,3,1],[20,22,2],[6,16,1]],
            [[28,10,1],[8,26,2],[18,6,1],[24,28,1]],
            [[4,14,2],[22,4,1],[14,20,1]],
            [[16,8,1],[6,24,2],[26,18,1],[10,2,2]],
        ];
        const speckles = speckleData[seed];
        for (let i = 0; i < speckles.length; i++) {
            ctx.fillRect(x + speckles[i][0], y + speckles[i][1], speckles[i][2], speckles[i][2]);
        }

        // Stone debris: small dark rectangles, 1-2 per tile
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        const debrisData = [
            [[18,10,1,2]],
            [[6,22,2,1],[24,4,1,2]],
            [[14,28,2,1]],
            [[22,16,1,2],[8,6,2,1]],
            [[4,20,2,1]],
            [[20,26,1,2],[10,8,2,1]],
            [[26,12,2,1]],
            [[12,18,1,2],[28,24,2,1]],
        ];
        const debris = debrisData[seed];
        for (let i = 0; i < debris.length; i++) {
            ctx.fillRect(x + debris[i][0], y + debris[i][1], debris[i][2], debris[i][3]);
        }

        // Subtle highlight in center
        ctx.fillStyle = t.floorHighlight;
        ctx.fillRect(x + 8, y + 8, 16, 16);

        // Subtle per-tile brightness variation (increased range)
        const brightOffsets = [-0.06, 0, 0.04, -0.03, 0.05, 0, -0.05, 0.06];
        const brightVar = brightOffsets[seed];
        if (brightVar > 0) {
            ctx.fillStyle = `rgba(255,200,100,${brightVar})`;
            ctx.fillRect(x, y, w, h);
        } else if (brightVar < 0) {
            ctx.fillStyle = `rgba(0,0,0,${-brightVar})`;
            ctx.fillRect(x, y, w, h);
        }

        // --- Theme-specific floor effects ---
        // Magma: occasional orange-red crack veins
        if (t === DUNGEON_THEMES.magma) {
            if (seed < 4) {
                ctx.strokeStyle = 'rgba(255,64,32,0.08)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 2 + seed * 4, y + 4 + seed * 3);
                ctx.lineTo(x + 14 + seed * 3, y + 18 + seed * 2);
                ctx.stroke();
                if (seed < 2) {
                    ctx.beginPath();
                    ctx.moveTo(x + 18 + seed * 3, y + 6);
                    ctx.lineTo(x + 28, y + 20 + seed * 3);
                    ctx.stroke();
                }
            }
        }

        // Abyss: purple mist wisp arcs
        if (t === DUNGEON_THEMES.abyss) {
            if (seed >= 3 && seed <= 6) {
                ctx.strokeStyle = 'rgba(96,32,160,0.1)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x + 10 + seed * 2, y + 14 + seed, 8, 0, Math.PI * 0.8);
                ctx.stroke();
            }
        }

        // Infernal: tiny ember sparkles
        if (t === DUNGEON_THEMES.infernal) {
            if (seed < 5) {
                ctx.fillStyle = 'rgba(255,128,32,0.15)';
                ctx.fillRect(x + 6 + seed * 4, y + 8 + seed * 3, 2, 2);
                if (seed < 3) {
                    ctx.fillRect(x + 22 - seed * 2, y + 22 + seed, 2, 2);
                }
            }
        }
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
        const t = this.currentTheme;
        // Deep water base
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0,   t.water1);
        grad.addColorStop(1,   t.water2);
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // Animated ripple lines
        const waveOffset = (time * 1.5) % 1;
        ctx.strokeStyle = t.waterRipple;
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
        const ws = t.waterShimmer;
        ctx.fillStyle = `rgba(${ws[0]},${ws[1]},${ws[2]},${shimmer})`;
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
            case 8: this.drawShrine(ctx, x, y, w, h, time); break;  // SHRINE
            case 9: this.drawMerchant(ctx, x, y, w, h, time); break;// MERCHANT
            case 10: this.drawCursedChest(ctx, x, y, w, h, time); break; // CURSED_CHEST
            case 11: this.drawFountain(ctx, x, y, w, h, time); break;   // FOUNTAIN
            case 12: this.drawFountainDry(ctx, x, y, w, h); break;      // FOUNTAIN_DRY
            case 13: this.drawPrisoner(ctx, x, y, w, h, time); break;   // PRISONER
            default: this.drawVoid(ctx, x, y, w, h);
        }

        if (dimFactor < 1.0) {
            ctx.restore();
        }
    },

    // --- Event Tiles ---

    drawShrine(ctx, x, y, w, h, time) {
        ctx.fillStyle = '#300';
        ctx.fillRect(x, y, w, h);
        // Pulsing red glow
        const pulse = 0.6 + Math.sin(time * 3) * 0.3;
        ctx.fillStyle = `rgba(255,32,32,${pulse * 0.15})`;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#ff2020';
        ctx.font = `bold ${h * 0.7}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('†', x + w / 2, y + h / 2 + 1);
    },

    drawMerchant(ctx, x, y, w, h, time) {
        ctx.fillStyle = '#1a1000';
        ctx.fillRect(x, y, w, h);
        const flicker = 0.7 + Math.sin(time * 5) * 0.15;
        ctx.fillStyle = `rgba(255,215,0,${flicker})`;
        ctx.font = `bold ${h * 0.7}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', x + w / 2, y + h / 2 + 1);
    },

    drawCursedChest(ctx, x, y, w, h, time) {
        ctx.fillStyle = '#200030';
        ctx.fillRect(x, y, w, h);
        const pulse = 0.5 + Math.sin(time * 2) * 0.4;
        ctx.fillStyle = `rgba(192,64,255,${pulse * 0.2})`;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#c040ff';
        ctx.font = `bold ${h * 0.7}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', x + w / 2, y + h / 2 + 1);
    },

    drawFountain(ctx, x, y, w, h, time) {
        ctx.fillStyle = '#001828';
        ctx.fillRect(x, y, w, h);
        const shimmer = 0.6 + Math.sin(time * 4) * 0.25;
        ctx.fillStyle = `rgba(64,255,255,${shimmer * 0.15})`;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#40ffff';
        ctx.font = `bold ${h * 0.7}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('~', x + w / 2, y + h / 2 + 1);
    },

    drawFountainDry(ctx, x, y, w, h) {
        ctx.fillStyle = '#111';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#555';
        ctx.font = `bold ${h * 0.7}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('~', x + w / 2, y + h / 2 + 1);
    },

    drawPrisoner(ctx, x, y, w, h, time) {
        ctx.fillStyle = '#1a001a';
        ctx.fillRect(x, y, w, h);
        const flicker = 0.5 + Math.sin(time * 2.5) * 0.4;
        ctx.fillStyle = `rgba(255,255,255,${flicker})`;
        ctx.font = `bold ${h * 0.6}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('@', x + w / 2, y + h / 2 + 1);
        // Prison bars
        ctx.strokeStyle = `rgba(128,128,128,0.5)`;
        ctx.lineWidth = 1;
        for (let bx = x + w * 0.2; bx < x + w * 0.9; bx += w * 0.2) {
            ctx.beginPath();
            ctx.moveTo(bx, y + 2);
            ctx.lineTo(bx, y + h - 2);
            ctx.stroke();
        }
    },
};
