// Input Handler - tracks keyboard and mouse state
const Input = {
    keys: {},
    keyPressed: {},
    mouse: { x: 0, y: 0, clicked: false, button: 0 },

    init(canvas) {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.key]) {
                this.keyPressed[e.key] = true;
            }
            this.keys[e.key] = true;
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Tab','i','I','c','C','v','V','e','E','q','Q','m','M','p','P','Escape','F11'].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        canvas.addEventListener('mousedown', (e) => {
            this.mouse.clicked = true;
            this.mouse.button = e.button;
            e.preventDefault();
        });

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    isDown(key) {
        return !!this.keys[key];
    },

    wasPressed(key) {
        return !!this.keyPressed[key];
    },

    getMouseTile(renderer) {
        const col = Math.floor(this.mouse.x / renderer.cellW);
        const row = Math.floor(this.mouse.y / renderer.cellH);
        return { col, row };
    },

    endFrame() {
        this.keyPressed = {};
        this.mouse.clicked = false;
    }
};
