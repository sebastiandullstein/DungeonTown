// Renderer — 3-layer 2D canvas renderer
// Canvas: 800×720  (25×18 tile viewport @ 32px + 144px HUD)

class Renderer {
    constructor(canvas, viewportCols = 25, viewportRows = 18) {
        this.canvas  = canvas;
        this.ctx     = canvas.getContext('2d');
        this.tileW   = 32;
        this.tileH   = 32;
        this.viewportCols = viewportCols;  // 25
        this.viewportRows = viewportRows;  // 18
        this.hudHeight    = 144;

        canvas.width  = this.tileW * viewportCols;   // 800
        canvas.height = this.tileH * viewportRows + this.hudHeight; // 720

        // Camera (world tile coords of top-left)
        this.viewX = 0;
        this.viewY = 0;

        // Expose for old scene code compatibility
        this.cols = viewportCols;
        this.rows = viewportRows;
        this.viewW = viewportCols;
        this.viewH = viewportRows;

        // Animation clock
        this.time  = 0;
        this.frame = 0;

        // Screen shake
        this._shakeTimer = 0;
        this._shakeIntensity = 0;
        this._shakeDuration = 0;

        // Off-screen layer canvases
        this._tileLayer   = this._makeLayer(canvas.width, this.tileH * viewportRows);
        this._entityLayer = this._makeLayer(canvas.width, this.tileH * viewportRows);
        this._uiLayer     = this._makeLayer(canvas.width, canvas.height);
    }

    _makeLayer(w, h) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return { canvas: c, ctx: c.getContext('2d') };
    }

    getCtx() { return this.ctx; }

    setViewport(vx, vy) {
        this.viewX = vx;
        this.viewY = vy;
    }

    tick(dt) {
        this.time  += dt;
        this.frame  = Math.floor(this.time * 8);
        if (this._shakeTimer > 0) this._shakeTimer = Math.max(0, this._shakeTimer - dt);
    }

    shake(intensity, duration) {
        this._shakeIntensity = Math.max(this._shakeIntensity, intensity);
        this._shakeDuration = Math.max(this._shakeDuration, duration);
        this._shakeTimer = Math.max(this._shakeTimer, duration);
    }

    // ── Frame management ───────────────────────────────────────────────────

    clear() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this._tileLayer.ctx.clearRect(0, 0, this._tileLayer.canvas.width, this._tileLayer.canvas.height);
        this._entityLayer.ctx.clearRect(0, 0, this._entityLayer.canvas.width, this._entityLayer.canvas.height);
        this._uiLayer.ctx.clearRect(0, 0, this._uiLayer.canvas.width, this._uiLayer.canvas.height);
    }

    flush() {
        // Screen shake: exponential decay offset
        let sx = 0, sy = 0;
        if (this._shakeTimer > 0 && this._shakeDuration > 0) {
            const t = this._shakeTimer / this._shakeDuration;
            const mag = this._shakeIntensity * t * t; // exponential decay
            sx = (Math.random() * 2 - 1) * mag;
            sy = (Math.random() * 2 - 1) * mag;
        } else {
            this._shakeIntensity = 0;
            this._shakeDuration = 0;
        }

        this.ctx.save();
        this.ctx.translate(sx, sy);
        this.ctx.drawImage(this._tileLayer.canvas,   0, 0);
        this.ctx.drawImage(this._entityLayer.canvas, 0, 0);
        // Ambient tint from dungeon theme
        if (TileRenderer.currentTheme && TileRenderer.currentTheme.ambient) {
            this.ctx.fillStyle = TileRenderer.currentTheme.ambient;
            this.ctx.fillRect(0, 0, this._tileLayer.canvas.width, this._tileLayer.canvas.height);
        }
        this.ctx.restore();
        // UI layer drawn without shake so HUD stays stable
        this.ctx.drawImage(this._uiLayer.canvas,     0, 0);

        // Ornate border frame overlay (drawn last, on top of everything)
        Assets.drawImage(this.ctx, 'ui_frame', 0, 0, 800, 720);
    }

    // ── Tile layer ─────────────────────────────────────────────────────────

    putTile(col, row, tileType, options = {}) {
        if (col < 0 || col >= this.viewportCols || row < 0 || row >= this.viewportRows) return;
        const { dimFactor = 1.0 } = options;
        const px = col * this.tileW;
        const py = row * this.tileH;
        TileRenderer.drawTile(this._tileLayer.ctx, px, py, this.tileW, this.tileH, tileType, dimFactor, this.time);
    }

    putVillageTile(col, row, tileInfo) {
        if (col < 0 || col >= this.viewportCols || row < 0 || row >= this.viewportRows) return;
        const px = col * this.tileW;
        const py = row * this.tileH;
        const ctx = this._tileLayer.ctx;
        switch (tileInfo.type) {
            case 'grass':           TileRenderer.drawGrass(ctx, px, py, this.tileW, this.tileH, tileInfo.variant || 0); break;
            case 'path':            TileRenderer.drawPath(ctx, px, py, this.tileW, this.tileH); break;
            case 'tree':            TileRenderer.drawTree(ctx, px, py, this.tileW, this.tileH); break;
            case 'dungeon_entrance': TileRenderer.drawDungeonEntrance(ctx, px, py, this.tileW, this.tileH); break;
            case 'building_ground': TileRenderer.drawBuildingGround(ctx, px, py, this.tileW, this.tileH); break;
            case 'building':        TileRenderer.drawBuildingGround(ctx, px, py, this.tileW, this.tileH); break;
            case 'empty_plot':      TileRenderer.drawBuildingGround(ctx, px, py, this.tileW, this.tileH); break;
            default:                TileRenderer.drawGrass(ctx, px, py, this.tileW, this.tileH, 0); break;
        }
    }

    // Draw a built building spanning 3×3 tiles (called in second pass)
    putBuilding(col, row, def, level) {
        // col,row is the top-left of the 3×3 area
        const px = col * this.tileW;
        const py = row * this.tileH;
        const w = this.tileW * 3;
        const h = this.tileH * 3;
        TileRenderer.drawBuilding(this._tileLayer.ctx, px, py, w, h, def, level);
    }

    // Draw an empty/unlocked plot spanning 3×3 tiles
    putEmptyPlot(col, row, def) {
        const px = col * this.tileW;
        const py = row * this.tileH;
        const w = this.tileW * 3;
        const h = this.tileH * 3;
        TileRenderer.drawEmptyPlot(this._tileLayer.ctx, px, py, w, h, def);
    }

    // ── Entity layer ───────────────────────────────────────────────────────

    putPlayer(col, row, player) {
        if (col < 0 || col >= this.viewportCols || row < 0 || row >= this.viewportRows) return;
        const px = col * this.tileW;
        const py = row * this.tileH;
        SpriteRenderer.drawPlayer(this._entityLayer.ctx, px, py, this.tileW, this.tileH, player, this.time);
    }

    putEnemy(col, row, enemy) {
        if (col < 0 || col >= this.viewportCols || row < 0 || row >= this.viewportRows) return;
        const px = col * this.tileW;
        const py = row * this.tileH;
        SpriteRenderer.drawEnemy(this._entityLayer.ctx, px, py, this.tileW, this.tileH, enemy, this.time);
    }

    putItem(col, row, item) {
        if (col < 0 || col >= this.viewportCols || row < 0 || row >= this.viewportRows) return;
        const px = col * this.tileW;
        const py = row * this.tileH;
        if (item.type === 'gold') {
            SpriteRenderer.drawGold(this._entityLayer.ctx, px, py, this.tileW, this.tileH);
        } else {
            SpriteRenderer.drawItem(this._entityLayer.ctx, px, py, this.tileW, this.tileH, item);
        }
    }

    putAttack(col, row, progress) {
        if (col < 0 || col >= this.viewportCols || row < 0 || row >= this.viewportRows) return;
        const px = col * this.tileW;
        const py = row * this.tileH;
        const ctx = this._entityLayer.ctx;
        const alpha = (1 - progress) * 0.6;
        ctx.save();
        ctx.globalAlpha = alpha;
        const swingGrad = ctx.createRadialGradient(px + 16, py + 16, 2, px + 16, py + 16, 20);
        swingGrad.addColorStop(0,   'rgba(255,240,100,0.9)');
        swingGrad.addColorStop(0.5, 'rgba(255,160,20,0.6)');
        swingGrad.addColorStop(1,   'rgba(255,80,0,0)');
        ctx.fillStyle = swingGrad;
        ctx.fillRect(px, py, this.tileW, this.tileH);
        ctx.restore();
    }

    // Chest opening animation
    putChestAnim(col, row, progress) {
        if (col < 0 || col >= this.viewportCols || row < 0 || row >= this.viewportRows) return;
        const px = col * this.tileW;
        const py = row * this.tileH;
        SpriteRenderer.drawChestOpening(this._entityLayer.ctx, px, py, this.tileW, this.tileH, progress);
    }

    // Cursor ring for village
    putCursor(col, row) {
        if (col < 0 || col >= this.viewportCols || row < 0 || row >= this.viewportRows) return;
        const px = col * this.tileW;
        const py = row * this.tileH;
        const ctx = this._entityLayer.ctx;
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
        ctx.save();
        ctx.strokeStyle = `rgba(255,220,80,${0.5 + pulse * 0.5})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffcc20';
        ctx.shadowBlur = 6 + pulse * 4;
        ctx.strokeRect(px + 1, py + 1, this.tileW - 2, this.tileH - 2);
        ctx.restore();
    }

    // Vignette overlay drawn on UI layer (over tiles+entities, under nothing)
    drawVignette(alpha = 0.55) {
        const ctx = this._uiLayer.ctx;
        const w = this.canvas.width;
        const h = this.tileH * this.viewportRows; // viewport area only (not HUD)
        const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, w * 0.72);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.65, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${alpha})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    // Wall-cast shadow on floor tiles immediately below a wall
    putWallShadow(col, row) {
        if (col < 0 || col >= this.viewportCols || row < 0 || row >= this.viewportRows) return;
        const px = col * this.tileW;
        const py = row * this.tileH;
        const ctx = this._tileLayer.ctx;
        const grad = ctx.createLinearGradient(px, py, px, py + 9);
        grad.addColorStop(0, 'rgba(0,0,0,0.55)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(px, py, this.tileW, 9);
    }

    // ── UI layer delegates ─────────────────────────────────────────────────

    drawHUD(player, currentFloor, mapTile, gold) {
        UIRenderer.drawHUD(this._uiLayer.ctx, player, currentFloor, mapTile, gold, this.time);
    }

    drawMinimap(dungeonMap, px, py) {
        UIRenderer.drawMinimap(this._uiLayer.ctx, dungeonMap, px, py);
    }

    drawCombatLog(combatLog) {
        UIRenderer.drawCombatLog(this._uiLayer.ctx, combatLog);
    }

    drawInventoryPanel(player, selectedIndex) {
        UIRenderer.drawInventoryPanel(this._uiLayer.ctx, player, selectedIndex);
    }

    drawCharacterPanel(player, selectedIndex) {
        UIRenderer.drawCharacterPanel(this._uiLayer.ctx, player, selectedIndex);
    }

    drawVillageHUD(village, player) {
        UIRenderer.drawVillageHUD(this._uiLayer.ctx, village, player);
    }

    drawShopPanel(data) {
        UIRenderer.drawShopPanel(this._uiLayer.ctx, data);
    }

    drawTitleScreen(titleAnim, selectedOption, hasSave) {
        UIRenderer.drawTitleScreen(this._uiLayer.ctx, titleAnim, selectedOption, hasSave);
    }

    drawNotification(text, color, alpha, slot) {
        UIRenderer.drawNotification(this._uiLayer.ctx, text, color, alpha, slot);
    }

    drawBuildMenu(buildList, selectedOption, village) {
        UIRenderer.drawBuildMenu(this._uiLayer.ctx, buildList, selectedOption, village);
    }

    drawManageMenu(target, options, selectedOption) {
        UIRenderer.drawManageMenu(this._uiLayer.ctx, target, options, selectedOption);
    }

    drawAssignMenu(villagers, selectedOption) {
        UIRenderer.drawAssignMenu(this._uiLayer.ctx, villagers, selectedOption);
    }

    drawRecruitMenu(recruits, villagers, maxVillagers, selectedOption, gold) {
        UIRenderer.drawRecruitMenu(this._uiLayer.ctx, recruits, villagers, maxVillagers, selectedOption, gold);
    }

    drawSmithyPanel(player, items, tab, selectedIndex) {
        UIRenderer.drawSmithyPanel(this._uiLayer.ctx, player, items, tab, selectedIndex);
    }

    drawTavernPanel(player, selectedIndex) {
        UIRenderer.drawTavernPanel(this._uiLayer.ctx, player, selectedIndex);
    }

    drawTemplePanel(player, selectedIndex) {
        UIRenderer.drawTemplePanel(this._uiLayer.ctx, player, selectedIndex);
    }

    drawWarehousePanel(player, village, selectedIndex) {
        UIRenderer.drawWarehousePanel(this._uiLayer.ctx, player, village, selectedIndex);
    }

    // Phase 1: Dungeon event panels
    drawFloorSelectPanel(floors, selectedIndex) {
        UIRenderer.drawFloorSelectPanel(this._uiLayer.ctx, floors, selectedIndex);
    }
    drawEscapeConfirm(floor) {
        UIRenderer.drawEscapeConfirm(this._uiLayer.ctx, floor);
    }
    drawEventPrompt(evDef) {
        UIRenderer.drawEventPrompt(this._uiLayer.ctx, evDef);
    }
    drawMerchantPanel(player, items, selectedIndex) {
        UIRenderer.drawMerchantPanel(this._uiLayer.ctx, player, items, selectedIndex);
    }
    drawPrisonerPanel(selectedIndex) {
        UIRenderer.drawPrisonerPanel(this._uiLayer.ctx, selectedIndex);
    }

    drawPauseMenu(selectedIndex, options) {
        UIRenderer.drawPauseMenu(this._uiLayer.ctx, selectedIndex, options);
    }
    drawSettingsPanel(settings, selectedIndex) {
        UIRenderer.drawSettingsPanel(this._uiLayer.ctx, settings, selectedIndex);
    }
    drawTutorialHint(text, alpha) {
        UIRenderer.drawTutorialHint(this._uiLayer.ctx, text, alpha);
    }

    drawInfoTooltip(text, lines, col, row) {
        // Convert tile coords to pixel coords, offset below+right of cursor
        const px = (col + 1) * this.tileW + 4;
        const py = (row + 1) * this.tileH + 4;
        UIRenderer.drawInfoTooltip(this._uiLayer.ctx, text, lines, px, py);
    }

    // ── Backward-compat no-op shims ────────────────────────────────────────
    put() {}
    writeString() {}
    drawBar() {}
    drawBox() {}
}
