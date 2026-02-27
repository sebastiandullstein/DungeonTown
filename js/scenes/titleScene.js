// Title Screen Scene
const TitleScene = {
    selectedOption: 0,
    options: ['New Game', 'Continue'],
    hasSave: false,
    titleAnim: 0,

    init() {},

    enter() {
        this.hasSave = !!localStorage.getItem('dungeontown_save');
        this.selectedOption = 0;
        this.titleAnim = 0;
    },

    exit() {},

    update(dt) {
        this.titleAnim += dt;

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
                if (Game.load()) {
                    Game.switchScene('village');
                }
            }
        }
    },

    render(r) {
        r.drawTitleScreen(this.titleAnim, this.selectedOption, this.hasSave);
    },
};
