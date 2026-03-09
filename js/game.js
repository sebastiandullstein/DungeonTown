// Main Game Controller
const Game = {
    renderer: null,
    currentScene: null,
    scenes: {},
    lastTime: 0,
    running: false,

    // Hit stop (freeze frames)
    hitStopTimer: 0,

    // Settings (persisted separately from save)
    settings: {
        masterVolume: 0.7,
        sfxVolume: 0.8,
        musicVolume: 0.4,
        fullscreen: false,
        assistMode: false,
        tutorialSeen: {},
    },

    hitStop(duration) {
        this.hitStopTimer = Math.max(this.hitStopTimer, duration);
    },

    // Global game state
    state: {
        player: null,
        village: null,
        currentFloor: 1,
        maxFloorReached: 1,
        unlockedFloors: [1],
        notifications: [],
        gameStarted: false,
        victory: false,       // true when Demon Lord is slain
    },

    init() {
        // Migrate save key from old name
        const oldSave = localStorage.getItem('roguevillage_save');
        if (oldSave && !localStorage.getItem('dungeontown_save')) {
            localStorage.setItem('dungeontown_save', oldSave);
            localStorage.removeItem('roguevillage_save');
        }

        this.loadSettings();

        const canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(canvas, 25, 18);
        Input.init(canvas);
        canvas.focus();

        // Allow canvas to receive keyboard focus
        canvas.setAttribute('tabindex', '0');

        // Initialize scenes (they register themselves)
        this.scenes.title = TitleScene;
        this.scenes.village = VillageScene;
        this.scenes.dungeon = DungeonScene;
        this.scenes.shop = ShopScene;

        // Initialize all scenes
        Object.values(this.scenes).forEach(s => s.init && s.init());

        this.switchScene('title');
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    },

    switchScene(name, data) {
        if (this.currentScene && this.currentScene.exit) {
            this.currentScene.exit();
        }
        this.currentScene = this.scenes[name];
        if (this.currentScene.enter) {
            this.currentScene.enter(data);
        }
    },

    loop(timestamp) {
        if (!this.running) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // cap delta
        this.lastTime = timestamp;

        // Tick renderer animation clock
        this.renderer.tick(dt);

        // Mute toggle (global, works in any scene)
        if (Input.wasPressed('m') || Input.wasPressed('M')) {
            Audio.toggleMute();
            this.notify(Audio.muted ? 'Sound: OFF' : 'Sound: ON', '#888', 1);
        }

        // Fullscreen toggle (F11)
        if (Input.wasPressed('F11')) {
            this.toggleFullscreen();
        }

        // Hit stop: freeze game updates but keep rendering
        if (this.hitStopTimer > 0) {
            this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
        } else if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(dt);
        }

        // Render
        this.renderer.clear();
        if (this.currentScene && this.currentScene.render) {
            this.currentScene.render(this.renderer);
        }

        // Render notifications
        this.renderNotifications(this.renderer, dt);

        this.renderer.flush();

        Input.endFrame();
        requestAnimationFrame((t) => this.loop(t));
    },

    notify(text, color = '#ff0', duration = 2) {
        this.state.notifications.push({ text, color, duration, timer: 0 });
    },

    renderNotifications(r, dt) {
        const notifs = this.state.notifications;
        let slot = 0;
        for (let i = notifs.length - 1; i >= 0; i--) {
            notifs[i].timer += dt;
            if (notifs[i].timer >= notifs[i].duration) {
                notifs.splice(i, 1);
                continue;
            }
            const alpha = 1 - (notifs[i].timer / notifs[i].duration);
            r.drawNotification(notifs[i].text, notifs[i].color, alpha, slot);
            slot++;
        }
    },

    // Save/Load
    save() {
        const data = {
            player: Game.state.player.serialize(),
            village: Game.state.village.serialize(),
            currentFloor: Game.state.currentFloor,
            maxFloorReached: Game.state.maxFloorReached,
            unlockedFloors: Game.state.unlockedFloors,
            victory: Game.state.victory,
            totalDeaths: Game.state.totalDeaths || 0,
            milestones: Game.state.milestones || {},
            abilityCooldowns: Abilities.serialize(),
        };
        localStorage.setItem('dungeontown_save', JSON.stringify(data));
        Game.notify('Game Saved!', '#0f0');
    },

    load() {
        const raw = localStorage.getItem('dungeontown_save');
        if (!raw) return false;
        try {
            const data = JSON.parse(raw);
            Game.state.player.deserialize(data.player);
            Game.state.village.deserialize(data.village);
            Game.state.currentFloor = data.currentFloor;
            Game.state.maxFloorReached = data.maxFloorReached;
            Game.state.unlockedFloors = data.unlockedFloors || [1];
            Game.state.victory = data.victory || false;
            Game.state.totalDeaths = data.totalDeaths || 0;
            Game.state.milestones = data.milestones || {};
            if (data.abilityCooldowns) Abilities.deserialize(data.abilityCooldowns);
            return true;
        } catch (e) {
            console.error('Load failed:', e);
            return false;
        }
    },

    newGame() {
        Game.state.player = new Player();
        Game.state.village = new Village();
        Game.state.currentFloor = 1;
        Game.state.maxFloorReached = 1;
        Game.state.unlockedFloors = [1];
        Game.state.gameStarted = true;
        Game.state.victory = false;
        Game.state.totalDeaths = 0;
        Game.state.milestones = {};
    },

    toggleFullscreen() {
        if (window.electronAPI && window.electronAPI.toggleFullscreen) {
            window.electronAPI.toggleFullscreen().then(isFs => {
                this.settings.fullscreen = isFs;
                this.saveSettings();
            });
        } else {
            // Browser fallback
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                this.settings.fullscreen = true;
            } else {
                document.exitFullscreen().catch(() => {});
                this.settings.fullscreen = false;
            }
            this.saveSettings();
        }
    },

    loadSettings() {
        try {
            const raw = localStorage.getItem('dungeontown_settings');
            if (raw) {
                const saved = JSON.parse(raw);
                this.settings.masterVolume = saved.masterVolume ?? 0.7;
                this.settings.sfxVolume = saved.sfxVolume ?? 0.8;
                this.settings.musicVolume = saved.musicVolume ?? 0.4;
                this.settings.fullscreen = saved.fullscreen ?? false;
                this.settings.assistMode = saved.assistMode ?? false;
                this.settings.tutorialSeen = saved.tutorialSeen ?? {};
            }
        } catch (e) {
            console.error('Settings load failed:', e);
        }
        Audio.setVolume(this.settings.masterVolume, this.settings.sfxVolume, this.settings.musicVolume);
    },

    saveSettings() {
        localStorage.setItem('dungeontown_settings', JSON.stringify(this.settings));
    },
};

// Start on load
window.addEventListener('load', () => Game.init());
