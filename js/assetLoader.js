// Asset Loader — loads and manages sprite sheets and images
// Must be loaded BEFORE all renderer scripts in index.html

const Assets = {
    _images: {},       // { key: Image }
    _atlases: {},      // { key: { image: Image, regions: { name: {x,y,w,h} } } }
    _pending: [],      // [ { type, key, path, regions? } ]
    _loaded: false,
    _progress: 0,
    _total: 0,

    // Register a single image to be loaded
    register(key, path) {
        this._pending.push({ type: 'image', key, path });
    },

    // Register a sprite atlas (image + inline region map)
    registerAtlas(key, imagePath, regions) {
        this._pending.push({ type: 'atlas', key, path: imagePath, regions });
    },

    // Load all registered assets. Shows loading bar on canvas.
    // Returns a Promise that resolves when all assets are loaded.
    loadAll(canvas) {
        return new Promise((resolve) => {
            this._total = this._pending.length;
            if (this._total === 0) {
                this._loaded = true;
                resolve();
                return;
            }

            const ctx = canvas.getContext('2d');
            let completed = 0;

            const checkDone = () => {
                completed++;
                this._progress = completed;
                this._drawLoadingScreen(ctx, canvas.width, canvas.height);
                if (completed >= this._total) {
                    this._loaded = true;
                    this._pending = [];
                    resolve();
                }
            };

            // Draw initial loading screen
            this._drawLoadingScreen(ctx, canvas.width, canvas.height);

            for (const entry of this._pending) {
                const img = new Image();
                img.onload = () => {
                    if (entry.type === 'atlas') {
                        this._atlases[entry.key] = { image: img, regions: entry.regions };
                    } else {
                        this._images[entry.key] = img;
                    }
                    checkDone();
                };
                img.onerror = () => {
                    // Asset failed to load — skip silently, procedural fallback will handle it
                    console.warn(`[Assets] Failed to load: ${entry.path}`);
                    checkDone();
                };
                img.src = entry.path;
            }
        });
    },

    // Draw a loading progress bar
    _drawLoadingScreen(ctx, w, h) {
        ctx.fillStyle = '#0a0808';
        ctx.fillRect(0, 0, w, h);

        // Title
        ctx.fillStyle = '#c8a040';
        ctx.font = 'bold 18px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('DUNGEONTOWN', w / 2, h / 2 - 40);

        // Loading text
        ctx.fillStyle = '#8a6830';
        ctx.font = '12px "Courier New"';
        ctx.fillText(`Loading assets... ${this._progress}/${this._total}`, w / 2, h / 2 - 10);

        // Progress bar background
        const barW = 300, barH = 16;
        const barX = (w - barW) / 2, barY = h / 2 + 10;
        ctx.fillStyle = '#1a1208';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = '#5a3810';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        // Progress bar fill
        const pct = this._total > 0 ? this._progress / this._total : 0;
        if (pct > 0) {
            const grad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
            grad.addColorStop(0, '#c8a040');
            grad.addColorStop(0.5, '#e8c060');
            grad.addColorStop(1, '#a08030');
            ctx.fillStyle = grad;
            ctx.fillRect(barX + 1, barY + 1, (barW - 2) * pct, barH - 2);
        }

        ctx.textAlign = 'left';
    },

    // Get a loaded single image by key
    get(key) {
        return this._images[key] || null;
    },

    // Check if a single image is available
    has(key) {
        const img = this._images[key];
        return img && img.complete && img.naturalWidth > 0;
    },

    // Check if an atlas is available
    hasAtlas(key) {
        const atlas = this._atlases[key];
        return atlas && atlas.image && atlas.image.complete && atlas.image.naturalWidth > 0;
    },

    // Get a region definition from an atlas
    getRegion(atlasKey, regionName) {
        const atlas = this._atlases[atlasKey];
        if (!atlas || !atlas.regions[regionName]) return null;
        return { image: atlas.image, ...atlas.regions[regionName] };
    },

    // Draw a sprite from an atlas onto a context.
    // Returns true if drawn, false if atlas/region not available (caller should fallback).
    drawSprite(ctx, atlasKey, regionName, dx, dy, dw, dh) {
        const atlas = this._atlases[atlasKey];
        if (!atlas || !atlas.image || !atlas.image.complete || atlas.image.naturalWidth === 0) return false;
        const r = atlas.regions[regionName];
        if (!r) return false;
        ctx.drawImage(atlas.image, r.x, r.y, r.w, r.h, dx, dy, dw || r.w, dh || r.h);
        return true;
    },

    // Draw a single registered image (non-atlas)
    drawImage(ctx, key, dx, dy, dw, dh) {
        const img = this._images[key];
        if (!img || !img.complete || img.naturalWidth === 0) return false;
        if (dw !== undefined && dh !== undefined) {
            ctx.drawImage(img, dx, dy, dw, dh);
        } else {
            ctx.drawImage(img, dx, dy);
        }
        return true;
    },

    isLoaded() { return this._loaded; },
    getProgress() { return this._total > 0 ? this._progress / this._total : 0; },
};
