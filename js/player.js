// Player Entity
class Player {
    constructor() {
        this.x = 5;
        this.y = 5;
        this.char = '@';
        this.fg = '#ff0';
        this.hp = 50;
        this.maxHp = 50;
        this.mp = 20;
        this.maxMp = 20;
        this.level = 1;
        this.xp = 0;
        this.xpToLevel = 20;
        this.statPoints = 0;

        this.stats = { str: 5, dex: 5, vit: 5, int: 3 };

        // Personal gold earned in dungeons — spent in village shops
        this.gold = 20;

        this.equipment = {
            weapon: null,
            armor: null,
            helmet: null,
            boots: null,
            ring: null,
            amulet: null,
        };

        // Start with a basic weapon
        this.equipment.weapon = {
            id: 'starter_sword',
            name: 'Rusty Sword',
            type: 'weapon',
            slot: 'weapon',
            tier: 0,
            stats: { atk: 3 },
            char: '/',
            fg: '#888',
            value: 5,
            description: 'A worn blade. Better than fists.',
        };

        this.inventory = [];
        this.maxInventory = 20;

        // Movement
        this.moveTimer = 0;
        this.moveDelay = 0.1; // seconds between moves

        // Combat
        this.attackTimer = 0;
        this.attackDelay = 0.35;
        this.attacking = false;
        this.attackDir = { x: 0, y: 0 };
        this.attackFrame = 0;
        this.invulnTimer = 0;
        this.invulnDuration = 0.3;

        // Facing direction for attacks
        this.facing = { x: 1, y: 0 };

        // Active food buffs: [{ stat, amount, remaining }]
        this.activeBuffs = [];
    }

    getBuffBonus(stat) {
        return (this.activeBuffs || [])
            .filter(b => b.stat === stat)
            .reduce((sum, b) => sum + b.amount, 0);
    }

    getAtk() {
        const str = this.stats.str + this.getBuffBonus('str');
        let atk = str;
        if (this.equipment.weapon) atk += this.equipment.weapon.stats.atk || 0;
        if (this.equipment.ring && this.equipment.ring.stats.atk) atk += this.equipment.ring.stats.atk;
        return atk;
    }

    getDef() {
        const vit = this.stats.vit + this.getBuffBonus('vit');
        let def = Math.floor(vit / 3);
        for (const slot of ['armor', 'helmet', 'boots', 'amulet']) {
            if (this.equipment[slot] && this.equipment[slot].stats.def) {
                def += this.equipment[slot].stats.def;
            }
        }
        return def;
    }

    getMaxHp() {
        return 30 + this.stats.vit * 4 + this.level * 5;
    }

    getMaxMp() {
        return 10 + this.stats.int * 3 + this.level * 2;
    }

    getSpeed() {
        return Math.max(0.05, 0.12 - this.stats.dex * 0.003);
    }

    getAttackSpeed() {
        return Math.max(0.15, 0.4 - this.stats.dex * 0.01);
    }

    gainXp(amount) {
        this.xp += amount;
        this._xpFlash = 0.7; // trigger XP bar flash
        while (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.level++;
            this.statPoints += 3;
            this.xpToLevel = Math.floor(this.xpToLevel * 1.5);
            this.maxHp = this.getMaxHp();
            this.maxMp = this.getMaxMp();
            this.hp = this.maxHp;
            this.mp = this.maxMp;
            Game.notify(`Level Up! You are now level ${this.level}!`, '#ff0');
            Audio.play('levelUp');
            Game.notify(`+3 stat points available (press C)`, '#0f0');
        }
    }

    takeDamage(amount) {
        if (this.invulnTimer > 0) return 0;
        const def = this.getDef();
        const damage = Math.max(1, amount - def + Math.floor(Math.random() * 3) - 1);
        this.hp -= damage;
        this.invulnTimer = this.invulnDuration;
        Audio.play('playerHurt');
        // Screen shake + hit stop + knockback
        if (Game.renderer) {
            Game.renderer.shake(6, 0.3);
            Game.hitStop(0.05);
        }
        // Knockback visual offset (set by attacker direction)
        this.knockTimer = 0.15;
        return damage;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    addToInventory(item) {
        if (this.inventory.length >= this.maxInventory) {
            Game.notify('Inventory full!', '#f00');
            return false;
        }
        this.inventory.push(item);
        return true;
    }

    equip(item) {
        if (!item.slot) return false;
        const old = this.equipment[item.slot];
        this.equipment[item.slot] = item;
        // Remove from inventory
        const idx = this.inventory.indexOf(item);
        if (idx >= 0) this.inventory.splice(idx, 1);
        // Put old in inventory
        if (old) this.inventory.push(old);
        // Recalculate stats
        this.maxHp = this.getMaxHp();
        this.maxMp = this.getMaxMp();
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        if (this.mp > this.maxMp) this.mp = this.maxMp;
        Game.notify(`Equipped ${item.name}`, '#0f0');
        return true;
    }

    update(dt, dungeonMap) {
        this.moveTimer -= dt;
        this.attackTimer -= dt;
        this.invulnTimer -= dt;
        if (this._xpFlash > 0) this._xpFlash = Math.max(0, this._xpFlash - dt);
        if (this.knockTimer > 0) this.knockTimer = Math.max(0, this.knockTimer - dt);

        // Tick active food buffs
        if (this.activeBuffs && this.activeBuffs.length > 0) {
            for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
                this.activeBuffs[i].remaining -= dt;
                if (this.activeBuffs[i].remaining <= 0) {
                    Game.notify(`${this.activeBuffs[i].stat.toUpperCase()} buff faded`, '#888');
                    this.activeBuffs.splice(i, 1);
                }
            }
        }

        if (this.attacking) {
            this.attackFrame += dt * 10;
            if (this.attackFrame > 3) {
                this.attacking = false;
            }
        }

        // Movement
        if (this.moveTimer <= 0 && !this.attacking) {
            let dx = 0, dy = 0;
            if (Input.isDown('ArrowLeft') || Input.isDown('a') || Input.isDown('A')) { dx = -1; }
            if (Input.isDown('ArrowRight') || Input.isDown('d') || Input.isDown('D')) { dx = 1; }
            if (Input.isDown('ArrowUp') || Input.isDown('w') || Input.isDown('W')) { dy = -1; }
            if (Input.isDown('ArrowDown') || Input.isDown('s') || Input.isDown('S')) { dy = 1; }

            if (dx !== 0 || dy !== 0) {
                this.facing = { x: dx, y: dy };
                const nx = this.x + dx;
                const ny = this.y + dy;
                if (dungeonMap.isWalkable(nx, ny)) {
                    this.x = nx;
                    this.y = ny;
                    this.moveTimer = this.getSpeed();
                }
            }
        }

        // Attack
        if ((Input.isDown(' ') || Input.wasPressed(' ')) && this.attackTimer <= 0) {
            this.attacking = true;
            this.attackFrame = 0;
            this.attackDir = { ...this.facing };
            this.attackTimer = this.getAttackSpeed();
        }

        // Use health potion (1)
        if (Input.wasPressed('1')) {
            this.usePotion('health');
        }
        // Use mana potion (2)
        if (Input.wasPressed('2')) {
            this.usePotion('mana');
        }
        // Use food buff (3)
        if (Input.wasPressed('3')) {
            this.useFood();
        }
    }

    usePotion(type) {
        const idx = this.inventory.findIndex(i => i.type === 'potion' && i.subtype === type);
        if (idx >= 0) {
            const potion = this.inventory[idx];
            if (type === 'health') {
                const healed = Math.min(this.maxHp - this.hp, potion.stats.heal || 20);
                this.hp += healed;
                Game.notify(`Healed ${healed} HP!`, '#0f0');
            } else if (type === 'mana') {
                const restored = Math.min(this.maxMp - this.mp, potion.stats.mana || 10);
                this.mp += restored;
                Game.notify(`Restored ${restored} MP!`, '#55f');
            }
            this.inventory.splice(idx, 1);
        } else {
            Game.notify(`No ${type} potions!`, '#f00');
        }
    }

    useFood() {
        const idx = this.inventory.findIndex(i => i.type === 'food');
        if (idx < 0) {
            Game.notify('No food!', '#f00');
            return;
        }
        const food = this.inventory[idx];
        this.inventory.splice(idx, 1);

        if (!this.activeBuffs) this.activeBuffs = [];

        const s = food.stats;
        const dur = s.buffDuration || 60;

        const applyBuff = (stat, amount) => {
            // Remove existing buff of same stat and replace
            this.activeBuffs = this.activeBuffs.filter(b => b.stat !== stat);
            this.activeBuffs.push({ stat, amount, remaining: dur });
        };

        if (s.buffStr) applyBuff('str', s.buffStr);
        if (s.buffVit) applyBuff('vit', s.buffVit);
        if (s.buffInt) applyBuff('int', s.buffInt);
        if (s.buffDex) applyBuff('dex', s.buffDex);

        Game.notify(`Ate ${food.name}! Buff active for ${dur}s`, '#0f8');
    }

    getAttackTiles() {
        if (!this.attacking) return [];
        const tiles = [];
        // Swing attack covers 3 tiles in facing direction
        const dx = this.attackDir.x;
        const dy = this.attackDir.y;
        tiles.push({ x: this.x + dx, y: this.y + dy });
        if (dx !== 0 && dy !== 0) {
            // Diagonal: hit the two adjacent tiles too
            tiles.push({ x: this.x + dx, y: this.y });
            tiles.push({ x: this.x, y: this.y + dy });
        } else if (dx !== 0) {
            tiles.push({ x: this.x + dx, y: this.y - 1 });
            tiles.push({ x: this.x + dx, y: this.y + 1 });
        } else {
            tiles.push({ x: this.x - 1, y: this.y + dy });
            tiles.push({ x: this.x + 1, y: this.y + dy });
        }
        return tiles;
    }

    serialize() {
        return {
            hp: this.hp, maxHp: this.maxHp, mp: this.mp, maxMp: this.maxMp,
            level: this.level, xp: this.xp, xpToLevel: this.xpToLevel,
            statPoints: this.statPoints, stats: { ...this.stats },
            equipment: { ...this.equipment }, inventory: [...this.inventory],
            gold: this.gold || 0,
            activeBuffs: this.activeBuffs ? [...this.activeBuffs] : [],
            abilityCooldowns: Abilities.serialize(),
        };
    }

    deserialize(data) {
        Object.assign(this, data);
        this.gold = data.gold || 0;
        this.activeBuffs = data.activeBuffs || [];
        this.moveTimer = 0;
        this.attackTimer = 0;
        this.attacking = false;
        this.invulnTimer = 0;
    }
}
