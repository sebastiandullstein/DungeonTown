// Input Handler - tracks keyboard, mouse, and touch state
const Input = {
    keys: {},
    keyPressed: {},
    mouse: { x: 0, y: 0, clicked: false, button: 0 },
    _isTouchDevice: false,
    _dpadAngle: -1,      // -1 = no touch, 0-7 = 8 directions
    _dpadTouchId: null,

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
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        });

        canvas.addEventListener('mousedown', (e) => {
            this.mouse.clicked = true;
            this.mouse.button = e.button;
            e.preventDefault();
        });

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Touch-to-click on canvas (for menus, title screen)
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            if (!touch) return;
            const rect = canvas.getBoundingClientRect();
            // Scale touch coords to canvas internal resolution
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            this.mouse.x = (touch.clientX - rect.left) * scaleX;
            this.mouse.y = (touch.clientY - rect.top) * scaleY;
            this.mouse.clicked = true;
            this.mouse.button = 0;
        }, { passive: false });

        // Detect touch device and set up touch controls
        this._detectTouch();
    },

    _detectTouch() {
        if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;
        this._isTouchDevice = true;
        this._setupTouchControls();
    },

    _setupTouchControls() {
        const container = document.getElementById('touchControls');
        if (!container) return;

        // D-Pad (virtual joystick)
        const dpad = document.createElement('div');
        dpad.className = 'touch-dpad';
        dpad.id = 'touchDpad';
        dpad.innerHTML = `
            <svg viewBox="0 0 200 200" width="100%" height="100%" style="pointer-events:none;opacity:0.4">
                <circle cx="100" cy="100" r="95" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
                <polygon points="100,25 115,55 85,55" fill="rgba(255,255,255,0.4)"/>
                <polygon points="100,175 115,145 85,145" fill="rgba(255,255,255,0.4)"/>
                <polygon points="25,100 55,85 55,115" fill="rgba(255,255,255,0.4)"/>
                <polygon points="175,100 145,85 145,115" fill="rgba(255,255,255,0.4)"/>
            </svg>
        `;
        container.appendChild(dpad);

        // D-Pad touch handling
        dpad.style.pointerEvents = 'auto';
        dpad.addEventListener('touchstart', (e) => this._handleDpad(e, dpad), { passive: false });
        dpad.addEventListener('touchmove', (e) => this._handleDpad(e, dpad), { passive: false });
        dpad.addEventListener('touchend', (e) => this._handleDpadEnd(e), { passive: false });
        dpad.addEventListener('touchcancel', (e) => this._handleDpadEnd(e), { passive: false });

        // Action buttons
        const buttons = [
            { key: ' ',       label: 'ATK',  cls: 'touch-btn-attack' },
            { key: 'Shift',   label: 'DASH', cls: 'touch-btn-dash' },
            { key: 'q',       label: 'Q',    cls: 'touch-btn-q' },
            { key: 'e',       label: 'E',    cls: 'touch-btn-e' },
            { key: 'i',       label: 'INV',  cls: 'touch-btn-sm touch-btn-inv' },
            { key: 'c',       label: 'CHR',  cls: 'touch-btn-sm touch-btn-char' },
            { key: 'Escape',  label: 'ESC',  cls: 'touch-btn-sm touch-btn-esc' },
            { key: '1',       label: 'HP',   cls: 'touch-btn-sm touch-btn-pot1' },
            { key: '2',       label: 'MP',   cls: 'touch-btn-sm touch-btn-pot2' },
        ];

        for (const btn of buttons) {
            const el = document.createElement('div');
            el.className = `touch-btn ${btn.cls}`;
            el.textContent = btn.label;
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[btn.key] = true;
                this.keyPressed[btn.key] = true;
                el.classList.add('active');
            }, { passive: false });
            el.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[btn.key] = false;
                el.classList.remove('active');
            }, { passive: false });
            el.addEventListener('touchcancel', (e) => {
                this.keys[btn.key] = false;
                el.classList.remove('active');
            }, { passive: false });
            container.appendChild(el);
        }
    },

    _handleDpad(e, dpad) {
        e.preventDefault();
        const touch = e.touches[0];
        if (!touch) return;
        const rect = dpad.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = touch.clientX - cx;
        const dy = touch.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const deadzone = rect.width * 0.15;

        // Clear previous directions
        this.keys['w'] = false;
        this.keys['a'] = false;
        this.keys['s'] = false;
        this.keys['d'] = false;

        if (dist < deadzone) return;

        // 8-directional from angle
        const angle = Math.atan2(dy, dx);
        // Right=0, Down=PI/2, Left=PI, Up=-PI/2
        if (angle > -Math.PI * 0.375 && angle <= Math.PI * 0.375) {
            this.keys['d'] = true; // right
        }
        if (angle > Math.PI * 0.125 && angle <= Math.PI * 0.875) {
            this.keys['s'] = true; // down
        }
        if (angle > Math.PI * 0.625 || angle <= -Math.PI * 0.625) {
            this.keys['a'] = true; // left
        }
        if (angle > -Math.PI * 0.875 && angle <= -Math.PI * 0.125) {
            this.keys['w'] = true; // up
        }
    },

    _handleDpadEnd(e) {
        e.preventDefault();
        this.keys['w'] = false;
        this.keys['a'] = false;
        this.keys['s'] = false;
        this.keys['d'] = false;
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
