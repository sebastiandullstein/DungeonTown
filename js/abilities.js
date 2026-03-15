// Abilities System — Dash, Whirlwind, Execute
const Abilities = {
    list: {
        dash: {
            name: 'Dash', key: 'Shift', unlockLevel: 1,
            maxCooldown: 4, cooldown: 0, manaCost: 0,
        },
        whirlwind: {
            name: 'Whirlwind', key: 'Q', unlockLevel: 5,
            maxCooldown: 4, cooldown: 0, manaCost: 5,
        },
        execute: {
            name: 'Execute', key: 'E', unlockLevel: 10,
            maxCooldown: 6, cooldown: 0, manaCost: 10,
        },
    },

    // Visual effect state
    _dashGhosts: [],    // [{x, y, alpha}]
    _screenFlash: 0,    // seconds remaining
    _slashLines: [],    // [{x1,y1,x2,y2,timer,duration,color}]
    _whirlEffect: null, // {x, y, timer, duration}

    update(dt) {
        // Tick cooldowns
        for (const key in this.list) {
            if (this.list[key].cooldown > 0) {
                this.list[key].cooldown = Math.max(0, this.list[key].cooldown - dt);
            }
        }
        // Tick dash ghosts
        for (let i = this._dashGhosts.length - 1; i >= 0; i--) {
            this._dashGhosts[i].alpha -= dt / 0.3;
            if (this._dashGhosts[i].alpha <= 0) this._dashGhosts.splice(i, 1);
        }
        // Tick screen flash
        if (this._screenFlash > 0) this._screenFlash = Math.max(0, this._screenFlash - dt);
        // Tick slash lines
        for (let i = this._slashLines.length - 1; i >= 0; i--) {
            this._slashLines[i].timer += dt;
            if (this._slashLines[i].timer >= this._slashLines[i].duration) {
                this._slashLines.splice(i, 1);
            }
        }
        // Tick whirlwind
        if (this._whirlEffect) {
            this._whirlEffect.timer += dt;
            if (this._whirlEffect.timer >= this._whirlEffect.duration) {
                this._whirlEffect = null;
            }
        }
    },

    isUnlocked(name, player) {
        return player.level >= this.list[name].unlockLevel;
    },

    isReady(name) {
        return this.list[name].cooldown <= 0;
    },

    tryActivate(name, player, dungeonMap, enemies) {
        const ab = this.list[name];
        if (!this.isUnlocked(name, player)) return false;
        if (!this.isReady(name)) return false;
        if (player.attacking) return false;
        if (ab.manaCost > 0 && player.mp < ab.manaCost) {
            Game.notify('Not enough mana!', '#4488ff');
            return false;
        }

        switch (name) {
            case 'dash':      return this._doDash(player, dungeonMap, enemies);
            case 'whirlwind': return this._doWhirlwind(player, enemies, ab);
            case 'execute':   return this._doExecute(player, enemies, ab);
        }
        return false;
    },

    _doDash(player, dungeonMap, enemies) {
        const dx = player.facing.x;
        const dy = player.facing.y;
        if (dx === 0 && dy === 0) return false;

        let lastX = player.x, lastY = player.y;
        for (let i = 1; i <= 3; i++) {
            const nx = player.x + dx * i;
            const ny = player.y + dy * i;
            if (dungeonMap.isWalkable(nx, ny)) {
                // Store ghost position
                this._dashGhosts.push({ x: lastX, y: lastY, alpha: 1.0 - (i - 1) * 0.2 });
                lastX = nx;
                lastY = ny;
            } else {
                break;
            }
        }

        if (lastX === player.x && lastY === player.y) {
            Game.notify("Can't dash there!", '#888');
            return false;
        }

        player.x = lastX;
        player.y = lastY;
        player.invulnTimer = 0.4;
        player.moveTimer = 0.15;
        this.list.dash.cooldown = this.list.dash.maxCooldown;
        Audio.play('playerAttack');

        // Dash impact: hit all enemies within 1.5 tiles of endpoint for 1× ATK
        if (enemies) {
            const dashAtk = player.getAtk();
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                const dist = Math.sqrt((enemy.x - lastX) ** 2 + (enemy.y - lastY) ** 2);
                if (dist <= 1.5) {
                    const dmg = Enemy.takeDamage(enemy, dashAtk, player);
                    Combat.addFloatingText(enemy.x, enemy.y, `-${dmg}`, '#60c8ff');
                    Combat.addHitParticles(enemy.x, enemy.y, '#60c8ff');
                }
            }
        }

        return true;
    },

    _doWhirlwind(player, enemies, ab) {
        player.mp -= ab.manaCost;
        ab.cooldown = ab.maxCooldown;
        const atk = Math.floor(player.getAtk() * 2.0);
        let hitCount = 0;

        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
            if (dist <= 2.5) {
                const dmg = Enemy.takeDamage(enemy, atk, player);
                Combat.addFloatingText(enemy.x, enemy.y, `-${dmg}`, '#ffd040');
                Combat.addHitParticles(enemy.x, enemy.y, '#ffd040');
                hitCount++;
            }
        }

        // Whirlwind ring particles
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            Combat.particles.push({
                x: player.x * 32 + 16, y: player.y * 32 + 16,
                vx: Math.cos(angle) * 70,
                vy: Math.sin(angle) * 70,
                color: '#ffd040',
                timer: 0,
                duration: 0.4,
            });
        }
        this._whirlEffect = { x: player.x, y: player.y, timer: 0, duration: 0.35 };

        if (hitCount === 0) Game.notify('Whirlwind! (no enemies in range)', '#ffd040');
        else Game.notify(`Whirlwind hits ${hitCount} enem${hitCount > 1 ? 'ies' : 'y'}!`, '#ffd040');
        Audio.play('playerAttack');
        return true;
    },

    _doExecute(player, enemies, ab) {
        // Find nearest enemy within 3 tiles
        let nearest = null, nearestDist = 3.5;
        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
            if (dist < nearestDist) {
                nearest = enemy;
                nearestDist = dist;
            }
        }

        if (!nearest) {
            Game.notify('No target in range!', '#888');
            return false;
        }

        player.mp -= ab.manaCost;
        ab.cooldown = ab.maxCooldown;

        const isLowHP = nearest.hp < nearest.maxHp * 0.4;
        let dmg;

        if (isLowHP) {
            // Instakill
            dmg = Enemy.takeDamage(nearest, nearest.hp * 100, player);
            Combat.addFloatingText(nearest.x, nearest.y, 'EXECUTED', '#ff2020');
            this._screenFlash = 0.2;
            Game.notify('Executed!', '#ff2020');
        } else {
            // Triple damage
            dmg = Enemy.takeDamage(nearest, Math.floor(player.getAtk() * 3), player);
            Combat.addFloatingText(nearest.x, nearest.y, `-${dmg}`, '#ff4040');
            Game.notify('Execute!', '#ff4040');
        }

        Combat.addHitParticles(nearest.x, nearest.y, '#ff2020');

        // Slash line visual
        this._slashLines.push({
            x1: player.x * 32 + 16, y1: player.y * 32 + 16,
            x2: nearest.x * 32 + 16, y2: nearest.y * 32 + 16,
            timer: 0, duration: 0.3, color: '#ff2020',
        });

        Audio.play('playerAttack');
        return true;
    },

    // ── Persistence ──────────────────────────────────────────────────────────

    serialize() {
        const data = {};
        for (const key in this.list) {
            data[key] = this.list[key].cooldown;
        }
        return data;
    },

    deserialize(data) {
        if (!data) return;
        for (const key in data) {
            if (this.list[key]) this.list[key].cooldown = data[key] || 0;
        }
    },
};
