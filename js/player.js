// ── Tavern Buffs (last until death) ──────────────────────────────────────────
const TAVERN_BUFFS = {
    liquidCourage:  { name: 'Liquid Courage',    desc: '+20% ATK for next dungeon run',   cost: 5,  atkMult: 0.2 },
    heartyStew:     { name: 'Hearty Stew',       desc: 'Start next run with +25% max HP', cost: 8,  hpMult: 0.25 },
    thievsBrew:     { name: "Thief's Brew",      desc: '+30% gold find for next run',     cost: 6,  goldMult: 0.3 },
    berserkerMead:  { name: "Berserker's Mead",  desc: '+40% ATK but -20% DEF',           cost: 4,  atkMult: 0.4, defMult: -0.2 },
};

// ── Temple Blessings (permanent, bought with Soul Shards) ────────────────────
const TEMPLE_BLESSINGS = {
    bloodPact:      { name: 'Blood Pact',      desc: 'Gain 2 HP per kill',               cost: 15, hpPerKill: 2 },
    ironWill:       { name: 'Iron Will',       desc: '+10 max HP permanently',            cost: 20, maxHpBonus: 10 },
    swiftStrikes:   { name: 'Swift Strikes',   desc: 'Attack speed +15% permanently',     cost: 25, atkSpeedMult: 0.15 },
    deathsEmbrace:  { name: "Death's Embrace", desc: 'Lose 30% less gold on death',       cost: 10, deathGoldSave: 0.3 },
    dungeonSense:   { name: 'Dungeon Sense',   desc: 'FOV radius +1 tile permanently',    cost: 15, fovBonus: 1 },
    cursedStrength: { name: 'Cursed Strength',  desc: '+5 ATK permanently but -5 max HP', cost: 12, atkBonus: 5, maxHpPenalty: 5 },
};

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

        // Permanent currency — never lost on death
        this.soulShards = 0;

        // Tavern buffs: array of buff IDs (cleared on death)
        this.tavernBuffs = [];

        // Temple blessings: { blessingId: true } (permanent)
        this.blessings = {};

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
        this.moveDelay = 0.07; // seconds between moves (snappy)

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
        // Blessing: Cursed Strength
        if (this.blessings && this.blessings.cursedStrength) atk += TEMPLE_BLESSINGS.cursedStrength.atkBonus;
        // Run bonuses (from shrine events)
        if (this._runBonuses && this._runBonuses.atk) atk += this._runBonuses.atk;
        // Tavern buff multipliers
        let atkMult = 0;
        if (this.tavernBuffs) {
            for (const id of this.tavernBuffs) {
                const b = TAVERN_BUFFS[id];
                if (b && b.atkMult) atkMult += b.atkMult;
            }
        }
        if (atkMult !== 0) atk = Math.max(0, Math.floor(atk * (1 + atkMult)));
        // Desperate Fury: +30% ATK when below 20% HP
        if (this.hp > 0 && this.hp <= this.getMaxHp() * 0.2) {
            atk = Math.floor(atk * 1.3);
        }
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
        // Tavern buff multipliers
        let defMult = 0;
        if (this.tavernBuffs) {
            for (const id of this.tavernBuffs) {
                const b = TAVERN_BUFFS[id];
                if (b && b.defMult) defMult += b.defMult;
            }
        }
        if (defMult !== 0) def = Math.max(0, Math.floor(def * (1 + defMult)));
        return def;
    }

    getMaxHp() {
        let hp = 30 + this.stats.vit * 4 + this.level * 5;
        // Blessings
        if (this.blessings) {
            if (this.blessings.ironWill) hp += 10;
            if (this.blessings.cursedStrength) hp -= TEMPLE_BLESSINGS.cursedStrength.maxHpPenalty;
        }
        // Level-up pick bonus
        if (this._bonusMaxHp) hp += this._bonusMaxHp;
        // Run bonuses (from shrine events)
        if (this._runBonuses && this._runBonuses.maxHp) hp += this._runBonuses.maxHp;
        // Tavern buff: Hearty Stew
        if (this.tavernBuffs) {
            for (const id of this.tavernBuffs) {
                const b = TAVERN_BUFFS[id];
                if (b && b.hpMult) hp = Math.floor(hp * (1 + b.hpMult));
            }
        }
        return Math.max(1, hp);
    }

    getMaxMp() {
        return 10 + this.stats.int * 3 + this.level * 2;
    }

    getSpeed() {
        return Math.max(0.04, 0.08 - this.stats.dex * 0.002);
    }

    getAttackSpeed() {
        let speed = Math.max(0.15, 0.4 - this.stats.dex * 0.01);
        // Blessing: Swift Strikes
        if (this.blessings && this.blessings.swiftStrikes) speed *= 0.85;
        return speed;
    }

    getGoldFindBonus() {
        let bonus = 0;
        if (this.tavernBuffs) {
            for (const id of this.tavernBuffs) {
                const b = TAVERN_BUFFS[id];
                if (b && b.goldMult) bonus += b.goldMult;
            }
        }
        // Level-up pick gold bonus
        if (this._goldBonus) bonus += this._goldBonus;
        return bonus;
    }

    getDeathGoldSavePercent() {
        if (this.blessings && this.blessings.deathsEmbrace) return 0.3;
        return 0;
    }

    getFOVBonus() {
        if (this.blessings && this.blessings.dungeonSense) return 1;
        return 0;
    }

    clearTavernBuffs() {
        this.tavernBuffs = [];
        // Recalculate derived stats now that buff multipliers are gone
        this.maxHp = this.getMaxHp();
        this.maxMp = this.getMaxMp();
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        if (this.mp > this.maxMp) this.mp = this.maxMp;
    }

    gainXp(amount) {
        // Apply XP bonus from level-up picks
        if (this._xpBonus) amount = Math.floor(amount * (1 + this._xpBonus));
        this.xp += amount;
        this._xpFlash = 0.7; // trigger XP bar flash
        while (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.level++;
            this.xpToLevel = Math.floor(this.xpToLevel * 1.5);
            this.maxHp = this.getMaxHp();
            this.maxMp = this.getMaxMp();
            this.hp = this.maxHp;
            this.mp = this.maxMp;
            Game.notify(`Level Up! You are now level ${this.level}!`, '#ff0');
            Audio.play('levelUp');
            // Queue level-up pick (dungeonScene will intercept this)
            this._pendingLevelUpPick = true;
            // Visual power burst on level up
            if (Game.renderer) {
                Game.renderer.shake(6, 0.3);
                Combat.addKillBurst(this.x, this.y, '#ffff40');
                Combat._screenFlash = 0.15;
                Combat._screenFlashColor = '#ffff80';
            }
        }
    }

    // Generate 3 random upgrade picks for level-up
    static generateLevelUpPicks(playerLevel) {
        const pool = [];

        // Stat upgrades (always available)
        pool.push({ id: 'str2', label: 'STR +2', desc: 'More attack damage', color: '#ff6644', apply: (p) => { p.stats.str += 2; } });
        pool.push({ id: 'dex2', label: 'DEX +2', desc: 'Faster attacks', color: '#44ff66', apply: (p) => { p.stats.dex += 2; } });
        pool.push({ id: 'vit3', label: 'VIT +3', desc: 'More hit points', color: '#ff4444', apply: (p) => { p.stats.vit += 3; p.maxHp = p.getMaxHp(); p.hp = p.maxHp; } });
        pool.push({ id: 'int2', label: 'INT +2', desc: 'More mana & magic', color: '#4466ff', apply: (p) => { p.stats.int += 2; p.maxMp = p.getMaxMp(); p.mp = p.maxMp; } });
        pool.push({ id: 'allStats', label: 'ALL +1', desc: '+1 to every stat', color: '#ffcc44', apply: (p) => { p.stats.str++; p.stats.dex++; p.stats.vit++; p.stats.int++; p.maxHp = p.getMaxHp(); p.maxMp = p.getMaxMp(); } });

        // HP/MP recovery perks
        pool.push({ id: 'healFull', label: 'Full Heal', desc: 'Restore all HP + MP', color: '#44ffaa', apply: (p) => { p.hp = p.getMaxHp(); p.mp = p.getMaxMp(); } });
        pool.push({ id: 'maxHpUp', label: 'Max HP +15', desc: 'Permanent HP boost', color: '#ff6666', apply: (p) => { p._bonusMaxHp = (p._bonusMaxHp || 0) + 15; p.maxHp = p.getMaxHp(); p.hp = p.maxHp; } });

        // Ability upgrades (level-gated)
        if (playerLevel >= 3) {
            pool.push({ id: 'dashCdr', label: 'Swift Dash', desc: 'Dash cooldown -1s', color: '#88ddff', apply: () => { Abilities.list.dash.maxCooldown = Math.max(1, Abilities.list.dash.maxCooldown - 1); } });
        }
        if (playerLevel >= 5) {
            pool.push({ id: 'whirlCdr', label: 'Cyclone', desc: 'Whirlwind cooldown -1s', color: '#ff88dd', apply: () => { Abilities.list.whirlwind.maxCooldown = Math.max(1, Abilities.list.whirlwind.maxCooldown - 1); } });
            pool.push({ id: 'whirlMana', label: 'Efficient Spin', desc: 'Whirlwind costs 2 less mana', color: '#88aaff', apply: () => { Abilities.list.whirlwind.manaCost = Math.max(0, Abilities.list.whirlwind.manaCost - 2); } });
        }
        if (playerLevel >= 8) {
            pool.push({ id: 'execCdr', label: 'Executioner', desc: 'Execute cooldown -2s', color: '#ff4488', apply: () => { Abilities.list.execute.maxCooldown = Math.max(2, Abilities.list.execute.maxCooldown - 2); } });
        }

        // Combat perks
        pool.push({ id: 'goldFind', label: 'Gold Sense', desc: '+25% gold from enemies', color: '#ffdd44', apply: (p) => { p._goldBonus = (p._goldBonus || 0) + 0.25; } });
        pool.push({ id: 'xpBoost', label: 'Quick Study', desc: '+20% XP gain', color: '#aaffaa', apply: (p) => { p._xpBonus = (p._xpBonus || 0) + 0.20; } });

        // Shuffle and pick 3 unique options
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, 3);
    }

    takeDamage(amount) {
        if (this.invulnTimer > 0) return 0;
        const def = this.getDef();
        let damage = Math.max(1, amount - def + Math.floor(Math.random() * 3) - 1);
        // Assist Mode: reduce incoming damage based on death count
        if (Game.settings.assistMode) {
            const reduction = Math.min(0.8, 0.2 + (Game.state.totalDeaths || 0) * 0.02);
            damage = Math.max(1, Math.floor(damage * (1 - reduction)));
        }
        this.hp -= damage;
        // Close-call death save: once per run, survive at 1 HP instead of dying
        if (this.hp <= 0 && !this._deathSaveUsed) {
            this._deathSaveUsed = true;
            this.hp = 1;
            this.invulnTimer = 1.5; // generous i-frames after death save
            Audio.play('deathSave');
            if (Game.renderer) {
                Game.renderer.shake(12, 0.6);
                Game.hitStop(0.2);
            }
            Game.notify('★ DEATH DEFIED ★', '#ffd700');
            Combat.addFloatingText(this.x, this.y, '★ DEFIED ★', '#ffd700');
            this.knockTimer = 0.15;
            return damage;
        }
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
        // Remove new item from inventory first
        const idx = this.inventory.indexOf(item);
        if (idx >= 0) this.inventory.splice(idx, 1);
        // Check if old item fits before swapping
        if (old && idx < 0 && this.inventory.length >= this.maxInventory) {
            Game.notify('Inventory full — cannot unequip!', '#f00');
            return false;
        }
        this.equipment[item.slot] = item;
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

        // Mana regeneration (0.5 per second, scales slightly with INT)
        if (this.mp < (this.maxMp || 20)) {
            const regenRate = 0.5 + (this.stats.int || 0) * 0.05;
            this.mp = Math.min(this.maxMp || 20, this.mp + regenRate * dt);
        }

        if (this.attacking) {
            this.attackFrame += dt * 10;
            if (this.attackFrame > 3) {
                this.attacking = false;
                this._attackResolved = false;
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
                    // Water tiles slow movement by 2x
                    this.moveTimer = dungeonMap.isWater(nx, ny) ? this.getSpeed() * 2 : this.getSpeed();
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
            if (Game.state.runStats) Game.state.runStats.potionsUsed++;
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
            soulShards: this.soulShards || 0,
            tavernBuffs: this.tavernBuffs ? [...this.tavernBuffs] : [],
            blessings: this.blessings ? { ...this.blessings } : {},
            activeBuffs: this.activeBuffs ? [...this.activeBuffs] : [],
            abilityCooldowns: Abilities.serialize(),
        };
    }

    deserialize(data) {
        Object.assign(this, data);
        this.gold = data.gold || 0;
        this.soulShards = data.soulShards || 0;
        this.tavernBuffs = data.tavernBuffs || [];
        this.blessings = data.blessings || {};
        this.activeBuffs = data.activeBuffs || [];
        // Validate xpToLevel — recalculate if missing or inconsistent
        if (!this.xpToLevel || this.xpToLevel < 20) {
            let xpReq = 20;
            for (let i = 1; i < this.level; i++) xpReq = Math.floor(xpReq * 1.5);
            this.xpToLevel = xpReq;
        }
        this.moveTimer = 0;
        this.attackTimer = 0;
        this.attacking = false;
        this.invulnTimer = 0;
    }
}
