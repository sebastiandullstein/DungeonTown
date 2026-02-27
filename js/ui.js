// UI System - inventory, character sheet, menus
const UI = {
    currentMenu: null, // null, 'inventory', 'character', 'building', 'assign'
    selectedIndex: 0,
    menuData: null,

    isOpen() {
        return this.currentMenu !== null;
    },

    open(menu, data = null) {
        this.currentMenu = menu;
        this.selectedIndex = 0;
        this.menuData = data;
    },

    close() {
        this.currentMenu = null;
        this.menuData = null;
    },

    toggle(menu, data = null) {
        if (this.currentMenu === menu) {
            this.close();
        } else {
            this.open(menu, data);
        }
    },

    update(dt) {
        if (!this.currentMenu) return;

        if (Input.wasPressed('Escape')) {
            this.close();
            return;
        }

        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        }
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
            this.selectedIndex++;
        }

        switch (this.currentMenu) {
            case 'inventory':
                this.updateInventory();
                break;
            case 'character':
                this.updateCharacter();
                break;
            case 'building':
                this.updateBuilding();
                break;
            case 'assign':
                this.updateAssign();
                break;
        }
    },

    updateInventory() {
        const player = Game.state.player;
        const maxIdx = player.inventory.length - 1;
        this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, maxIdx));

        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            const item = player.inventory[this.selectedIndex];
            if (item) {
                if (item.type === 'potion') {
                    // Use potion
                    if (item.subtype === 'health') {
                        player.heal(item.stats.heal || 20);
                        Game.notify(`Used ${item.name}`, '#0f0');
                    } else if (item.subtype === 'mana') {
                        player.mp = Math.min(player.maxMp, player.mp + (item.stats.mana || 15));
                        Game.notify(`Used ${item.name}`, '#55f');
                    }
                    player.inventory.splice(this.selectedIndex, 1);
                } else if (item.slot) {
                    player.equip(item);
                }
            }
        }

        if (Input.wasPressed('x') || Input.wasPressed('X')) {
            const item = player.inventory[this.selectedIndex];
            if (item) {
                player.inventory.splice(this.selectedIndex, 1);
                Game.notify(`Dropped ${item.name}`, '#888');
            }
        }
    },

    updateCharacter() {
        const player = Game.state.player;
        if (player.statPoints <= 0) return;

        const stats = ['str', 'dex', 'vit', 'int'];
        this.selectedIndex = Math.min(this.selectedIndex, stats.length - 1);

        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            const stat = stats[this.selectedIndex];
            player.stats[stat]++;
            player.statPoints--;
            player.maxHp = player.getMaxHp();
            player.maxMp = player.getMaxMp();
            Game.notify(`${stat.toUpperCase()} increased!`, '#0f0');
        }
    },

    updateBuilding() {
        // Handled in village scene
    },

    updateAssign() {
        // Handled in village scene
    },

    render(renderer) {
        if (!this.currentMenu) return;

        switch (this.currentMenu) {
            case 'inventory':
                this.renderInventory(renderer);
                break;
            case 'character':
                this.renderCharacter(renderer);
                break;
        }
    },

    renderInventory(renderer) {
        const player = Game.state.player;
        const w = 40, h = 35;
        const x = Math.floor((renderer.cols - w) / 2);
        const y = Math.floor((renderer.rows - h) / 2);

        renderer.drawBox(x, y, w, h, '#888', '#111', 'Inventory');

        // Equipment
        let row = y + 2;
        renderer.writeString(x + 2, row, '-- Equipment --', '#888');
        row++;
        const slots = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'];
        for (const slot of slots) {
            const item = player.equipment[slot];
            const name = item ? `${item.char} ${item.name}` : '(empty)';
            const color = item ? item.fg : '#444';
            renderer.writeString(x + 2, row, `${slot.padEnd(8)}: ${name}`, color);
            row++;
        }

        row++;
        renderer.writeString(x + 2, row, `-- Backpack (${player.inventory.length}/${player.maxInventory}) --`, '#888');
        row++;

        const visibleItems = 15;
        const scrollOffset = Math.max(0, this.selectedIndex - visibleItems + 1);
        for (let i = 0; i < visibleItems && i + scrollOffset < player.inventory.length; i++) {
            const idx = i + scrollOffset;
            const item = player.inventory[idx];
            const selected = idx === this.selectedIndex;
            const prefix = selected ? '> ' : '  ';
            const bg = selected ? '#333' : '#111';
            const text = `${prefix}${item.char} ${item.name}`;
            for (let c = 0; c < w - 2; c++) {
                renderer.put(x + 1 + c, row, ' ', '#aaa', bg);
            }
            renderer.writeString(x + 2, row, text, item.fg, bg);

            // Show stats on right
            if (item.description) {
                const desc = item.description.substring(0, 15);
                renderer.writeString(x + w - desc.length - 2, row, desc, '#888', bg);
            }
            row++;
        }

        if (player.inventory.length === 0) {
            renderer.writeString(x + 2, row, '(empty)', '#444');
        }

        row = y + h - 3;
        renderer.writeString(x + 2, row, '[Enter] Use/Equip  [X] Drop', '#666');
        renderer.writeString(x + 2, row + 1, '[Esc] Close', '#666');
    },

    renderCharacter(renderer) {
        const player = Game.state.player;
        const w = 35, h = 20;
        const x = Math.floor((renderer.cols - w) / 2);
        const y = Math.floor((renderer.rows - h) / 2);

        renderer.drawBox(x, y, w, h, '#888', '#111', 'Character');

        let row = y + 2;
        renderer.writeString(x + 2, row, `Level: ${player.level}`, '#ff0');
        row++;
        renderer.writeString(x + 2, row, `XP: ${player.xp}/${player.xpToLevel}`, '#aaa');
        row++;
        renderer.writeString(x + 2, row, `HP: ${player.hp}/${player.maxHp}`, '#f44');
        row++;
        renderer.writeString(x + 2, row, `MP: ${player.mp}/${player.maxMp}`, '#44f');
        row += 2;

        renderer.writeString(x + 2, row, `Stat Points: ${player.statPoints}`, player.statPoints > 0 ? '#0f0' : '#666');
        row++;

        const stats = [
            { key: 'str', name: 'STR', desc: 'Attack power' },
            { key: 'dex', name: 'DEX', desc: 'Speed' },
            { key: 'vit', name: 'VIT', desc: 'Health & Defense' },
            { key: 'int', name: 'INT', desc: 'Mana pool' },
        ];

        for (let i = 0; i < stats.length; i++) {
            const s = stats[i];
            const selected = this.selectedIndex === i && player.statPoints > 0;
            const prefix = selected ? '> ' : '  ';
            const bg = selected ? '#333' : '#111';
            const text = `${prefix}${s.name}: ${player.stats[s.key].toString().padStart(3)} (${s.desc})`;
            for (let c = 0; c < w - 2; c++) {
                renderer.put(x + 1 + c, row, ' ', '#aaa', bg);
            }
            renderer.writeString(x + 2, row, text, '#ddd', bg);
            row++;
        }

        row++;
        renderer.writeString(x + 2, row, `ATK: ${player.getAtk()}  DEF: ${player.getDef()}`, '#fa0');
        row += 2;
        if (player.statPoints > 0) {
            renderer.writeString(x + 2, row, '[Enter] Allocate point', '#666');
        }
        renderer.writeString(x + 2, row + 1, '[Esc] Close', '#666');
    },
};
