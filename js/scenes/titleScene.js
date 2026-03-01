// Title Screen Scene
const TitleScene = {
    selectedOption: 0,
    options: ['New Game', 'Continue', 'Settings'],
    hasSave: false,
    titleAnim: 0,
    _settingsMode: false,
    _settingsIndex: 0,

    init() {},

    enter() {
        this.hasSave = !!localStorage.getItem('dungeontown_save');
        this.selectedOption = 0;
        this.titleAnim = 0;
        this._settingsMode = false;
    },

    exit() {},

    update(dt) {
        this.titleAnim += dt;

        // Settings overlay
        if (this._settingsMode) {
            const items = ['masterVolume', 'sfxVolume', 'musicVolume', 'fullscreen'];
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
                this._settingsMode = false;
            }
            return;
        }

        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
        }
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
            this.selectedOption = Math.min(this.options.length - 1, this.selectedOption + 1);
        }

        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            if (this.selectedOption === 0) {
                // New Game
                Game.newGame();
                Game.switchScene('village');
            } else if (this.selectedOption === 1 && this.hasSave) {
                Game.newGame();
                if (!Game.load()) {
                    Game.notify('Save corrupted — starting fresh.', '#f00');
                }
                Game.switchScene('village');
            } else if (this.selectedOption === 2) {
                this._settingsMode = true;
                this._settingsIndex = 0;
            }
        }
    },

    render(r) {
        r.drawTitleScreen(this.titleAnim, this.selectedOption, this.hasSave);
        if (this._settingsMode) {
            r.drawSettingsPanel(Game.settings, this._settingsIndex);
        }
    },
};
