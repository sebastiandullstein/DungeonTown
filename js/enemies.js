// Boss Loot Table — unique items dropped by major bosses
const BOSS_LOOT = {
    cursedKnightSword: {
        name: 'Cursed Blade', _category: 'weapons',
        stats: { atk: 12 }, tier: 3, char: '/', fg: '#8888ff', value: 200,
        description: 'A blade wreathed in spectral flame. ATK +12',
    },
    golemShield: {
        name: 'Golem Core Shield', _category: 'armors',
        stats: { def: 10 }, tier: 4, char: '[', fg: '#ccaa88', value: 280,
        description: 'Impossibly dense stone armor. DEF +10',
    },
    dragonFang: {
        name: 'Shadow Fang', _category: 'weapons',
        stats: { atk: 22 }, tier: 6, char: '/', fg: '#cc44ff', value: 520,
        description: 'Drips with shadow essence. ATK +22',
    },
    titanHeart: {
        name: 'Titan Heart Amulet', _category: 'amulets',
        stats: { hp: 50, def: 4 }, tier: 2, char: '"', fg: '#ff4444', value: 400,
        description: 'Pulses with chaotic energy. HP +50, DEF +4',
    },
};

// Enemy Types and AI
const EnemyTypes = {
    types: {
        rat: {
            name: 'Rat', char: 'r', fg: '#a86', bg: null,
            hp: 8, atk: 2, def: 0, speed: 0.6,
            xp: 5, detection: 8, minFloor: 1,
            loot: [
                { type: 'gold', chance: 0.6, min: 2, max: 6 },
            ],
        },
        bat: {
            name: 'Bat', char: 'b', fg: '#868', bg: null,
            hp: 6, atk: 3, def: 0, speed: 0.4,
            xp: 7, detection: 10, minFloor: 1,
            loot: [
                { type: 'gold', chance: 0.5, min: 1, max: 5 },
            ],
        },
        skeleton: {
            name: 'Skeleton', char: 's', fg: '#ddd', bg: null,
            hp: 20, atk: 5, def: 2, speed: 0.8,
            xp: 15, detection: 9, minFloor: 2,
            loot: [
                { type: 'gold', chance: 0.7, min: 6, max: 18 },
                { type: 'resource', chance: 0.2, resource: 'herbs', min: 1, max: 2 },
            ],
        },
        orc: {
            name: 'Orc', char: 'O', fg: '#0a0', bg: null,
            hp: 35, atk: 8, def: 3, speed: 1.0,
            xp: 25, detection: 8, minFloor: 3,
            loot: [
                { type: 'gold', chance: 0.8, min: 12, max: 30 },
                { type: 'resource', chance: 0.35, resource: 'iron', min: 1, max: 3 },
            ],
        },
        demon: {
            name: 'Demon', char: 'D', fg: '#f44', bg: null,
            hp: 60, atk: 12, def: 5, speed: 0.7,
            xp: 50, detection: 10, minFloor: 5,
            loot: [
                { type: 'gold', chance: 0.9, min: 25, max: 55 },
                { type: 'resource', chance: 0.4, resource: 'herbs', min: 2, max: 5 },
            ],
        },
        dragon: {
            name: 'Dragon', char: 'W', fg: '#f80', bg: null,
            hp: 150, atk: 20, def: 10, speed: 1.2,
            xp: 200, detection: 12, minFloor: 8,
            loot: [
                { type: 'gold', chance: 1.0, min: 70, max: 180 },
                { type: 'resource', chance: 0.6, resource: 'iron', min: 4, max: 8 },
                { type: 'resource', chance: 0.4, resource: 'herbs', min: 3, max: 6 },
            ],
        },

        // ── FINAL BOSS ─────────────────────────────────────────────────────
        demonLord: {
            name: 'Malphas the Demon Lord', char: 'M', fg: '#ff0044', bg: null,
            hp: 1200, atk: 55, def: 30, speed: 0.9,
            xp: 5000, detection: 14, minFloor: 50,
            isBoss: true, isMajorBoss: true, isFinalBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 1000, max: 2000 },
                { type: 'resource', chance: 1.0, resource: 'iron',  min: 30, max: 50 },
                { type: 'resource', chance: 1.0, resource: 'herbs', min: 30, max: 50 },
            ],
        },
    },

    // Mini-boss types — one per tier of 5 floors
    miniBosses: [
        {
            name: 'Orc Chief', char: 'O', fg: '#2f2', bg: null,
            hp: 90, atk: 14, def: 6, speed: 1.1,
            xp: 80, detection: 8, minFloor: 5, isBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 40, max: 80 },
                { type: 'resource', chance: 0.7, resource: 'iron', min: 3, max: 6 },
            ],
        },
        {
            name: 'Dark Sorcerer', char: 'S', fg: '#c060ff', bg: null,
            hp: 160, atk: 20, def: 8, speed: 0.8,
            xp: 150, detection: 10, minFloor: 15, isBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 70, max: 130 },
                { type: 'resource', chance: 0.6, resource: 'herbs', min: 5, max: 10 },
            ],
        },
        {
            name: 'Lich', char: 'L', fg: '#c0f', bg: null,
            hp: 260, atk: 28, def: 10, speed: 0.8,
            xp: 250, detection: 10, minFloor: 25, isBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 130, max: 220 },
                { type: 'resource', chance: 0.9, resource: 'herbs', min: 8, max: 14 },
            ],
        },
        {
            name: 'Inferno Drake', char: 'W', fg: '#ff2200', bg: null,
            hp: 340, atk: 34, def: 16, speed: 1.0,
            xp: 350, detection: 9, minFloor: 35, isBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 180, max: 300 },
                { type: 'resource', chance: 1.0, resource: 'iron', min: 10, max: 18 },
            ],
        },
        {
            name: 'Pit Fiend', char: 'F', fg: '#ff4400', bg: null,
            hp: 400, atk: 38, def: 18, speed: 0.9,
            xp: 420, detection: 10, minFloor: 45, isBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 220, max: 380 },
                { type: 'resource', chance: 1.0, resource: 'iron', min: 12, max: 20 },
            ],
        },
    ],

    // Major boss types — every 10th floor
    majorBosses: [
        {
            name: 'Cursed Knight', char: 'K', fg: '#8888ff', bg: null,
            hp: 240, atk: 20, def: 14, speed: 0.8,
            xp: 220, detection: 8, minFloor: 10, isBoss: true, isMajorBoss: true,
            bossType: 'cursedKnight',
            loot: [
                { type: 'gold', chance: 1.0, min: 80, max: 150 },
                { type: 'resource', chance: 1.0, resource: 'iron', min: 8, max: 14 },
            ],
            bossLoot: 'cursedKnightSword',
        },
        {
            name: 'Stone Golem', char: 'G', fg: '#ccaa88', bg: null,
            hp: 400, atk: 24, def: 20, speed: 1.4,
            xp: 350, detection: 6, minFloor: 20, isBoss: true, isMajorBoss: true,
            bossType: 'stoneGolem',
            loot: [
                { type: 'gold', chance: 1.0, min: 140, max: 250 },
                { type: 'resource', chance: 1.0, resource: 'iron', min: 12, max: 20 },
            ],
            bossLoot: 'golemShield',
        },
        {
            name: 'Shadow Dragon', char: 'W', fg: '#606', bg: null,
            hp: 500, atk: 32, def: 18, speed: 1.1,
            xp: 480, detection: 10, minFloor: 30, isBoss: true, isMajorBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 200, max: 350 },
                { type: 'resource', chance: 1.0, resource: 'iron', min: 12, max: 20 },
                { type: 'resource', chance: 0.8, resource: 'herbs', min: 8, max: 14 },
            ],
            bossLoot: 'dragonFang',
        },
        {
            name: 'Chaos Titan', char: 'T', fg: '#f44', bg: null,
            hp: 700, atk: 40, def: 22, speed: 1.2,
            xp: 700, detection: 9, minFloor: 40, isBoss: true, isMajorBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 300, max: 500 },
                { type: 'resource', chance: 1.0, resource: 'iron', min: 15, max: 25 },
                { type: 'resource', chance: 1.0, resource: 'herbs', min: 12, max: 20 },
            ],
            bossLoot: 'titanHeart',
        },
    ],

    // Final boss — Floor 50
    // (defined as a type in EnemyTypes.types.demonLord — see below)

    getForFloor(floor) {
        // Only pick from normal (non-boss) types
        const normalTypes = Object.entries(this.types)
            .filter(([k]) => k !== 'demonLord')
            .map(([, v]) => v)
            .filter(t => t.minFloor <= floor);

        // Weighted: enemies closer to current floor are more likely
        const weights = normalTypes.map(t => {
            const diff = floor - t.minFloor;
            return Math.max(1, 10 - diff * 2);
        });
        const total = weights.reduce((a, b) => a + b, 0);
        let roll = Math.random() * total;
        for (let i = 0; i < normalTypes.length; i++) {
            roll -= weights[i];
            if (roll <= 0) return normalTypes[i];
        }
        return normalTypes[0];
    },

    getMiniBossForFloor(floor) {
        // Pick the highest-tier mini-boss whose minFloor <= floor
        const eligible = this.miniBosses.filter(b => b.minFloor <= floor);
        return eligible[eligible.length - 1] || this.miniBosses[0];
    },

    getMajorBossForFloor(floor) {
        const eligible = this.majorBosses.filter(b => b.minFloor <= floor);
        return eligible[eligible.length - 1] || this.majorBosses[0];
    },
};

class Enemy {
    static create(x, y, type, isElite) {
        // Bosses do not scale with floor — they are pre-tuned
        const isBoss = type.isBoss || false;
        const floorScale = isBoss ? 1.0 : 1 + (Game.state.currentFloor - type.minFloor) * 0.1;
        const eliteMult = isElite ? 1.8 : 1.0;
        // Normalize name to simple key for sprite dispatch (take first word, lowercase)
        const typeKey = type.name.split(' ')[0].toLowerCase();
        return {
            x, y,
            type: typeKey,
            name: isElite ? `Elite ${type.name}` : type.name,
            char: type.char,
            fg: isElite ? '#ffcc00' : type.fg,
            hp: Math.floor(type.hp * floorScale * eliteMult),
            maxHp: Math.floor(type.hp * floorScale * eliteMult),
            atk: Math.floor(type.atk * floorScale * (isElite ? 1.4 : 1.0)),
            def: Math.floor(type.def * floorScale * (isElite ? 1.3 : 1.0)),
            speed: isElite ? type.speed * 0.85 : type.speed,
            xp: Math.floor(type.xp * floorScale * (isElite ? 2.5 : 1.0)),
            detection: type.detection + (isElite ? 2 : 0),
            loot: type.loot,
            isElite: isElite || false,
            isBoss: isBoss,
            isMajorBoss: type.isMajorBoss || false,
            isFinalBoss: type.isFinalBoss || false,
            bossType: type.bossType || null,
            bossLoot: type.bossLoot || null,
            attackDelay: isBoss ? 1.2 : 0.8,
            state: 'idle',
            moveTimer: 0,
            attackTimer: 0,
            stunTimer: 0,
            path: null,
            lastSeenX: -1,
            lastSeenY: -1,
            // Type-specific behavior states
            blocking: false,       // skeleton: currently blocking
            blockCycle: 0,         // skeleton: rhythmic block timer (0-3s: 0-1.5 = block, 1.5-3 = open)
            chargeTimer: 0,        // orc: charge telegraph countdown
            charging: false,       // orc: currently charging
            chargeDx: 0,           // orc: charge direction
            chargeDy: 0,
            chargeStun: 0,         // orc: stunned after missed charge
            telegraphing: false,   // visual telegraph active
            telegraphTimer: 0,     // countdown for attack telegraph
            diving: false,         // bat: currently diving
            diveDx: 0,             // bat: dive direction
            diveDy: 0,
            _diveSteps: 0,         // bat: steps taken during dive
            // Boss phase system
            bossPhase: isBoss ? 1 : 0,
            phaseTransitionTimer: 0,  // invuln + visual during transition
            _lastPhase: 1,            // track phase changes
            _groundSlamTimer: 0,      // cooldown for ground slam attack
            _groundSlamWarning: null, // { tiles: [...], timer } telegraph before slam
            _summonedThisPhase: false, // prevent repeated summons
            frenzied: false,           // rat: pack frenzy active (3+ rats nearby)
        };
    }

    static spawn(floor, x, y) {
        const type = EnemyTypes.getForFloor(floor);
        // Elite chance: 15% from Floor 8+, 25% from Floor 15+
        const eliteChance = floor >= 15 ? 0.25 : floor >= 8 ? 0.15 : 0;
        const isElite = eliteChance > 0 && Math.random() < eliteChance;
        return Enemy.create(x, y, type, isElite);
    }

    static update(enemy, dt, dungeonMap, player) {
        enemy.moveTimer -= dt;
        enemy.attackTimer -= dt;
        enemy.stunTimer -= dt;
        if (enemy.telegraphTimer > 0) enemy.telegraphTimer -= dt;

        // Orc charge stun (after missed charge)
        if (enemy.chargeStun > 0) {
            enemy.chargeStun -= dt;
            enemy.telegraphing = false;
            return;
        }

        // Orc active charge — rush in a line
        if (enemy.charging) {
            enemy.moveTimer -= dt; // double-tick for speed
            if (enemy.moveTimer <= 0) {
                const nx = enemy.x + enemy.chargeDx;
                const ny = enemy.y + enemy.chargeDy;
                if (nx === player.x && ny === player.y) {
                    // Hit player: double damage + knockback
                    const damage = player.takeDamage(enemy.atk * 2);
                    if (damage > 0) {
                        if (Game.state.runStats) {
                            Game.state.runStats.damageTaken += damage;
                            Game.state.runStats.deathCause = enemy.name;
                        }
                        Audio.play('playerHurt');
                        Combat.addFloatingText(player.x, player.y, `-${damage} CHARGE!`, '#f44');
                        Combat.addHitParticles(player.x, player.y, '#ff2200');
                        Game.renderer.shake(10, 0.3);
                        const kbDx = enemy.chargeDx, kbDy = enemy.chargeDy;
                        player.knockX = kbDx * 1.5;
                        player.knockY = kbDy * 1.5;
                    }
                    enemy.charging = false;
                    enemy.state = 'chase';
                    enemy.moveTimer = enemy.speed;
                } else if (dungeonMap.isWalkable(nx, ny)) {
                    enemy.x = nx;
                    enemy.y = ny;
                    enemy.moveTimer = 0.06; // very fast
                    enemy._chargeSteps = (enemy._chargeSteps || 0) + 1;
                    if (enemy._chargeSteps >= 4) {
                        // Missed — stun
                        enemy.charging = false;
                        enemy.chargeStun = 1.0;
                        enemy.stunTimer = 1.0;
                        Combat.addFloatingText(enemy.x, enemy.y, 'STUNNED', '#88f');
                    }
                } else {
                    // Hit a wall — stun
                    enemy.charging = false;
                    enemy.chargeStun = 1.0;
                    enemy.stunTimer = 1.0;
                    Game.renderer.shake(4, 0.15);
                    Combat.addFloatingText(enemy.x, enemy.y, 'STUNNED', '#88f');
                }
            }
            return;
        }

        // Bat active dive — rush in a line toward player
        if (enemy.diving) {
            enemy.moveTimer -= dt;
            if (enemy.moveTimer <= 0) {
                const nx = enemy.x + enemy.diveDx;
                const ny = enemy.y + enemy.diveDy;
                if (nx === player.x && ny === player.y) {
                    // Hit player: double damage
                    const damage = player.takeDamage(enemy.atk * 2);
                    if (damage > 0) {
                        if (Game.state.runStats) {
                            Game.state.runStats.damageTaken += damage;
                            Game.state.runStats.deathCause = enemy.name;
                        }
                        Audio.play('playerHurt');
                        Combat.addFloatingText(player.x, player.y, `-${damage} DIVE!`, '#cc44cc');
                        Combat.addHitParticles(player.x, player.y, '#cc44cc');
                        Game.renderer.shake(6, 0.2);
                    }
                    enemy.diving = false;
                    enemy.state = 'chase';
                    enemy.moveTimer = enemy.speed;
                } else if (dungeonMap.isWalkable(nx, ny)) {
                    enemy.x = nx;
                    enemy.y = ny;
                    enemy.moveTimer = 0.05;
                    enemy._diveSteps = (enemy._diveSteps || 0) + 1;
                    if (enemy._diveSteps >= 5) {
                        // Missed — brief pause
                        enemy.diving = false;
                        enemy.stunTimer = 0.5;
                        enemy.moveTimer = enemy.speed;
                    }
                } else {
                    // Hit a wall
                    enemy.diving = false;
                    enemy.stunTimer = 0.5;
                    enemy.moveTimer = enemy.speed;
                }
            }
            return;
        }

        if (enemy.stunTimer > 0) return;

        // Boss phase system: check HP thresholds for phase transitions
        if (enemy.isBoss && enemy.bossPhase > 0) {
            const hpRatio = enemy.hp / enemy.maxHp;
            const newPhase = hpRatio > 0.66 ? 1 : hpRatio > 0.33 ? 2 : 3;
            if (newPhase > enemy.bossPhase) {
                enemy.bossPhase = newPhase;
                enemy.phaseTransitionTimer = 1.0;
                enemy.stunTimer = 1.0; // brief invulnerability
                enemy._summonedThisPhase = false;
                Combat.addFloatingText(enemy.x, enemy.y, `PHASE ${newPhase}`, '#ff4488');
                Game.renderer.shake(8, 0.4);
                Game.hitStop(0.2);
                Audio.play('bossEncounter');
                // Shockwave particles
                for (let i = 0; i < 16; i++) {
                    const angle = (i / 16) * Math.PI * 2;
                    Combat.particles.push({
                        x: enemy.x * 32 + 16, y: enemy.y * 32 + 16,
                        vx: Math.cos(angle) * 120, vy: Math.sin(angle) * 120,
                        color: '#ff88cc', timer: 0, duration: 0.5, size: 3
                    });
                }
                return;
            }
            // Invulnerable during phase transition
            if (enemy.phaseTransitionTimer > 0) {
                enemy.phaseTransitionTimer -= dt;
                return;
            }

            // Boss ground slam (Phase 3, type orc/warlord — cooldown-based)
            if (enemy.bossPhase >= 3 && enemy._groundSlamTimer !== undefined) {
                enemy._groundSlamTimer -= dt;
                // Execute ground slam warning
                if (enemy._groundSlamWarning) {
                    enemy._groundSlamWarning.timer -= dt;
                    if (enemy._groundSlamWarning.timer <= 0) {
                        // Deal damage to all tiles adjacent to boss
                        const slamTiles = enemy._groundSlamWarning.tiles;
                        for (const st of slamTiles) {
                            if (player.x === st.x && player.y === st.y) {
                                const damage = player.takeDamage(Math.floor(enemy.atk * 1.2));
                                if (damage > 0) {
                                    if (Game.state.runStats) {
                                        Game.state.runStats.damageTaken += damage;
                                        Game.state.runStats.deathCause = enemy.name;
                                    }
                                    Audio.play('playerHurt');
                                    Combat.addFloatingText(player.x, player.y, `-${damage} SLAM!`, '#ff4400');
                                    Game.renderer.shake(10, 0.3);
                                }
                            }
                            Combat.addHitParticles(st.x, st.y, '#ff6600');
                        }
                        Audio.play('dragonBreath');
                        enemy._groundSlamWarning = null;
                        enemy._groundSlamTimer = 4.0; // cooldown
                    }
                    return;
                }
                // Initiate ground slam
                if (enemy._groundSlamTimer <= 0) {
                    const slamTiles = [];
                    for (let sy = -1; sy <= 1; sy++) {
                        for (let sx = -1; sx <= 1; sx++) {
                            if (sx === 0 && sy === 0) continue;
                            slamTiles.push({ x: enemy.x + sx, y: enemy.y + sy });
                        }
                    }
                    enemy._groundSlamWarning = { tiles: slamTiles, timer: 0.6 };
                    enemy.telegraphing = true;
                    enemy.telegraphTimer = 0.6;
                    Combat.addFloatingText(enemy.x, enemy.y, '!SLAM!', '#ff6600');
                    return;
                }
            }

            // ── Cursed Knight: spectral dash (Phase 2+) ──
            if (enemy.bossType === 'cursedKnight' && enemy.bossPhase >= 2) {
                enemy._blinkTimer = (enemy._blinkTimer || 3.0) - dt;
                if (enemy._blinkTimer <= 0) {
                    enemy._blinkTimer = enemy.bossPhase >= 3 ? 2.0 : 3.0;
                    // Teleport behind the player
                    const behindX = player.x + (player.x > enemy.x ? 1 : -1);
                    const behindY = player.y + (player.y > enemy.y ? 1 : -1);
                    if (dungeonMap.isWalkable(behindX, behindY)) {
                        // Flash at old position
                        Combat.addHitParticles(enemy.x, enemy.y, '#8888ff');
                        enemy.x = behindX;
                        enemy.y = behindY;
                        Combat.addHitParticles(enemy.x, enemy.y, '#8888ff');
                        Combat.addFloatingText(enemy.x, enemy.y, 'BLINK!', '#8888ff');
                        Audio.play('dash');
                        // Immediate attack after blink
                        enemy.attackTimer = 0;
                        enemy.state = 'attack';
                    }
                }
            }

            // ── Stone Golem: tremor wave (Phase 2+) ──
            if (enemy.bossType === 'stoneGolem' && enemy.bossPhase >= 2) {
                enemy._tremorTimer = (enemy._tremorTimer || 5.0) - dt;
                if (enemy._tremorTimer <= 0) {
                    enemy._tremorTimer = enemy.bossPhase >= 3 ? 3.5 : 5.0;
                    // Tremor: damage in a cross pattern (3 tiles each direction)
                    const tremorTiles = [];
                    for (let d = 1; d <= 3; d++) {
                        tremorTiles.push({ x: enemy.x + d, y: enemy.y });
                        tremorTiles.push({ x: enemy.x - d, y: enemy.y });
                        tremorTiles.push({ x: enemy.x, y: enemy.y + d });
                        tremorTiles.push({ x: enemy.x, y: enemy.y - d });
                    }
                    for (const st of tremorTiles) {
                        Combat.addHitParticles(st.x, st.y, '#ccaa88');
                        if (player.x === st.x && player.y === st.y) {
                            const damage = player.takeDamage(Math.floor(enemy.atk * 0.8));
                            if (damage > 0) {
                                if (Game.state.runStats) {
                                    Game.state.runStats.damageTaken += damage;
                                    Game.state.runStats.deathCause = enemy.name;
                                }
                                Audio.play('playerHurt');
                                Combat.addFloatingText(player.x, player.y, `-${damage} TREMOR!`, '#ccaa88');
                                Game.renderer.shake(8, 0.3);
                            }
                        }
                    }
                    Combat.addFloatingText(enemy.x, enemy.y, 'TREMOR!', '#ccaa88');
                    Audio.play('dragonBreath');
                    Game.renderer.shake(6, 0.4);
                }
                // Phase 3: Stone Golem gets +50% DEF (armor up)
                if (enemy.bossPhase >= 3 && !enemy._armoredUp) {
                    enemy._armoredUp = true;
                    enemy.def = Math.floor(enemy.def * 1.5);
                    Combat.addFloatingText(enemy.x, enemy.y, 'ARMOR UP!', '#aaaaaa');
                    Game.renderer.shake(4, 0.2);
                }
            }

            // Boss Phase 2 summoning (once per phase)
            if (enemy.bossPhase >= 2 && !enemy._summonedThisPhase) {
                enemy._summonedThisPhase = true;
                // Summon 2 minions nearby
                const summonType = EnemyTypes.types.rat;
                for (let i = 0; i < 2; i++) {
                    const sx = enemy.x + (i === 0 ? -2 : 2);
                    const sy = enemy.y;
                    if (dungeonMap.isWalkable(sx, sy)) {
                        const minion = Enemy.create(sx, sy, summonType);
                        dungeonMap.enemies.push(minion);
                        Combat.addHitParticles(sx, sy, '#ffaa00');
                    }
                }
                Combat.addFloatingText(enemy.x, enemy.y, 'SUMMON!', '#ffaa00');
                Audio.play('bossEncounter');
            }
        }

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Bat: dive-bomb telegraph → rush when in line and 3+ tiles away
        if (enemy.type === 'bat' && !enemy.isBoss && enemy.telegraphing && enemy.telegraphTimer <= 0 && enemy._diveTarget) {
            enemy.telegraphing = false;
            enemy.diving = true;
            Audio.play('batDive');
            enemy._diveSteps = 0;
            enemy.moveTimer = 0;
            const dt2 = enemy._diveTarget;
            enemy._diveTarget = null;
            if (Math.abs(dt2.x) >= Math.abs(dt2.y)) {
                enemy.diveDx = dt2.x > 0 ? 1 : -1;
                enemy.diveDy = 0;
            } else {
                enemy.diveDx = 0;
                enemy.diveDy = dt2.y > 0 ? 1 : -1;
            }
            return;
        }

        // Bat: initiate dive-bomb if aligned and 3+ tiles away
        if (enemy.type === 'bat' && !enemy.isBoss && dist >= 3 && dist <= enemy.detection
            && enemy.moveTimer <= 0 && !enemy.telegraphing
            && (dx === 0 || dy === 0) // must be in a straight line
            && dungeonMap.hasLineOfSight(enemy.x, enemy.y, player.x, player.y)
            && Math.random() < 0.25) {
            enemy.telegraphing = true;
            enemy.telegraphTimer = 0.5;
            enemy._diveTarget = { x: dx, y: dy };
            enemy.moveTimer = 0.6;
            return;
        }

        // ── Orc: Charge telegraph (bosses too!) ──
        if (enemy.type === 'orc' && enemy.chargeTimer > 0) {
            enemy.chargeTimer -= dt;
            enemy.telegraphing = true;
            if (enemy.chargeTimer <= 0) {
                // Launch charge
                enemy.telegraphing = false;
                enemy.charging = true;
                enemy._chargeSteps = 0;
                enemy.moveTimer = 0;
                // Charge toward player's position at telegraph start
                const cdx = player.x - enemy.x;
                const cdy = player.y - enemy.y;
                if (Math.abs(cdx) >= Math.abs(cdy)) {
                    enemy.chargeDx = cdx > 0 ? 1 : -1;
                    enemy.chargeDy = 0;
                } else {
                    enemy.chargeDx = 0;
                    enemy.chargeDy = cdy > 0 ? 1 : -1;
                }
                Audio.play('playerAttack');
            }
            return;
        }

        // Demon: blink teleport — teleport behind player when far
        if (enemy.type === 'demon' && !enemy.isBoss && dist >= 3 && dist <= enemy.detection
            && enemy.moveTimer <= 0 && Math.random() < 0.15
            && dungeonMap.hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
            // Teleport to tile behind player (opposite of player's facing)
            const pf = player.facing || { x: 0, y: 1 };
            const tx = player.x - pf.x;
            const ty = player.y - pf.y;
            if (dungeonMap.isWalkable(tx, ty) && !(tx === player.x && ty === player.y)) {
                // VFX: particles at old + new position
                Combat.addHitParticles(enemy.x, enemy.y, '#ff4488');
                enemy.x = tx;
                enemy.y = ty;
                Combat.addHitParticles(tx, ty, '#ff4488');
                Combat.addFloatingText(tx, ty, 'BLINK', '#ff44aa');
                Audio.play('demonBlink');
                // Immediate backstab after blink — knockback toward player's facing direction
                const blinkDmg = player.takeDamage(Math.floor(enemy.atk * 0.5));
                if (blinkDmg > 0) {
                    if (Game.state.runStats) {
                        Game.state.runStats.damageTaken += blinkDmg;
                        Game.state.runStats.deathCause = enemy.name;
                    }
                    Combat.addFloatingText(player.x, player.y, `-${blinkDmg}`, '#ff44aa');
                    player.knockX = pf.x * 0.8;
                    player.knockY = pf.y * 0.8;
                    Game.renderer.shake(5, 0.15);
                }
                enemy.moveTimer = 0.8;
                enemy.state = 'attack';
                return;
            }
        }

        // Dragon: flame breath — AoE damage in a line when in range
        if (enemy.type === 'dragon' && !enemy.isBoss && dist >= 2 && dist <= 4
            && enemy.moveTimer <= 0 && Math.random() < 0.2
            && dungeonMap.hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
            // Telegraph
            enemy.telegraphing = true;
            enemy.telegraphTimer = 0.6;
            enemy._breathTarget = { x: player.x, y: player.y };
            enemy.moveTimer = 0.7;
            return;
        }
        // Dragon: execute breath after telegraph
        if (enemy.type === 'dragon' && enemy.telegraphing && enemy.telegraphTimer <= 0 && enemy._breathTarget) {
            enemy.telegraphing = false;
            const bt = enemy._breathTarget;
            enemy._breathTarget = null;
            Audio.play('dragonBreath');
            // Damage player if still near target
            const bDist = Math.abs(player.x - bt.x) + Math.abs(player.y - bt.y);
            if (bDist <= 1) {
                const damage = player.takeDamage(Math.floor(enemy.atk * 1.5));
                if (damage > 0) {
                    if (Game.state.runStats) {
                        Game.state.runStats.damageTaken += damage;
                        Game.state.runStats.deathCause = enemy.name;
                    }
                    Audio.play('playerHurt');
                    Combat.addFloatingText(player.x, player.y, `-${damage} FIRE!`, '#ff6600');
                    Game.renderer.shake(8, 0.3);
                }
            }
            // Fire particles along the line
            const fdx = bt.x - enemy.x;
            const fdy = bt.y - enemy.y;
            const fDist = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
            for (let s = 0; s < 3; s++) {
                const fx = enemy.x + (fdx / fDist) * (s + 1);
                const fy = enemy.y + (fdy / fDist) * (s + 1);
                Combat.addHitParticles(Math.round(fx), Math.round(fy), '#ff6600');
            }
            return;
        }

        // Rat pack frenzy: 3+ rats within 3 tiles = +40% attack speed
        if (enemy.type === 'rat' && !enemy.isBoss) {
            let nearbyRats = 0;
            for (const other of dungeonMap.enemies) {
                if (other === enemy || other.hp <= 0 || other.type !== 'rat') continue;
                const rdx = other.x - enemy.x;
                const rdy = other.y - enemy.y;
                if (Math.abs(rdx) <= 3 && Math.abs(rdy) <= 3) nearbyRats++;
            }
            enemy.frenzied = nearbyRats >= 2; // 2 others + self = 3 total
        }

        // State transitions
        if (dist <= 1.5 && enemy.state !== 'attack') {
            enemy.state = 'attack';
        } else if (dist <= enemy.detection && dungeonMap.hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
            // Orc: initiate charge if far enough
            if (enemy.type === 'orc' && dist >= 4 && enemy.chargeTimer <= 0 && Math.random() < 0.4) {
                // Phase 3 bosses telegraph faster
                const telegraphTime = (enemy.isBoss && enemy.bossPhase >= 3) ? 0.7 : 1.2;
                enemy.chargeTimer = telegraphTime;
                enemy.telegraphing = true;
                return;
            }
            enemy.state = 'chase';
            enemy.lastSeenX = player.x;
            enemy.lastSeenY = player.y;
        } else if (enemy.state === 'chase' && enemy.lastSeenX >= 0) {
            if (enemy.x === enemy.lastSeenX && enemy.y === enemy.lastSeenY) {
                enemy.state = 'idle';
                enemy.lastSeenX = -1;
            }
        }

        // Actions
        switch (enemy.state) {
            case 'idle':
                if (enemy.moveTimer <= 0) {
                    const dirs = [
                        { x: -1, y: 0 }, { x: 1, y: 0 },
                        { x: 0, y: -1 }, { x: 0, y: 1 },
                    ];
                    if (Math.random() < 0.3) {
                        const dir = dirs[Math.floor(Math.random() * dirs.length)];
                        const nx = enemy.x + dir.x;
                        const ny = enemy.y + dir.y;
                        if (dungeonMap.isWalkable(nx, ny)) {
                            enemy.x = nx;
                            enemy.y = ny;
                        }
                    }
                    enemy.moveTimer = enemy.speed;
                }
                break;

            case 'chase':
                if (enemy.moveTimer <= 0) {
                    let tx = player.x, ty = player.y;
                    if (enemy.lastSeenX >= 0 && !dungeonMap.hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
                        tx = enemy.lastSeenX;
                        ty = enemy.lastSeenY;
                    }
                    const mx = tx > enemy.x ? 1 : tx < enemy.x ? -1 : 0;
                    const my = ty > enemy.y ? 1 : ty < enemy.y ? -1 : 0;

                    // Bat: erratic movement — 40% chance to move randomly instead of toward player
                    if (enemy.type === 'bat' && Math.random() < 0.4) {
                        const randomDirs = [
                            { x: -1, y: 0 }, { x: 1, y: 0 },
                            { x: 0, y: -1 }, { x: 0, y: 1 },
                        ];
                        const rDir = randomDirs[Math.floor(Math.random() * randomDirs.length)];
                        const rnx = enemy.x + rDir.x;
                        const rny = enemy.y + rDir.y;
                        if (dungeonMap.isWalkable(rnx, rny) && !(rnx === player.x && rny === player.y)) {
                            enemy.x = rnx;
                            enemy.y = rny;
                        }
                        enemy.moveTimer = enemy.speed * 0.3; // bats move faster but erratically
                        break;
                    }

                    const moves = [
                        { x: mx, y: my },
                        { x: mx, y: 0 },
                        { x: 0, y: my },
                    ].filter(m => m.x !== 0 || m.y !== 0);

                    for (const m of moves) {
                        const nx = enemy.x + m.x;
                        const ny = enemy.y + m.y;
                        if (dungeonMap.isWalkable(nx, ny) && !(nx === player.x && ny === player.y)) {
                            enemy.x = nx;
                            enemy.y = ny;
                            break;
                        }
                    }
                    // Water tiles slow enemies by 2x
                    const waterSlow = dungeonMap.isWater(enemy.x, enemy.y) ? 2 : 1;
                    enemy.moveTimer = enemy.speed * 0.45 * waterSlow;
                }
                break;

            case 'attack':
                if (dist > 1.5) {
                    enemy.state = 'chase';
                    enemy.blocking = false;
                    break;
                }

                // Skeleton: rhythmic block cycle — 1.5s block → 1.5s open (predictable, learnable)
                if (enemy.type === 'skeleton' && !enemy.isBoss) {
                    enemy.blockCycle += dt;
                    if (enemy.blockCycle >= 3.0) enemy.blockCycle -= 3.0;
                    enemy.blocking = enemy.blockCycle < 1.5;
                    // Telegraph before attacking
                    if (!enemy.telegraphing && enemy.attackTimer <= 0.3 && enemy.attackTimer > 0) {
                        enemy.telegraphing = true;
                        enemy.telegraphTimer = 0.3;
                    }
                    // Drop block right before attacking so hits land
                    if (enemy.attackTimer <= 0.2) {
                        enemy.blocking = false;
                    }
                }

                if (enemy.attackTimer <= 0) {
                    enemy.telegraphing = false;
                    // Deal damage to player
                    const damage = player.takeDamage(enemy.atk);
                    if (damage > 0) {
                        if (Game.state.runStats) {
                            Game.state.runStats.damageTaken += damage;
                            Game.state.runStats.deathCause = enemy.name;
                        }
                        Audio.play('playerHurt');
                        Combat.addFloatingText(player.x, player.y, `-${damage}`, '#f44');
                        Combat.addHitParticles(player.x, player.y, '#cc2222');
                        const kbDx = player.x - enemy.x;
                        const kbDy = player.y - enemy.y;
                        const kbDist = Math.sqrt(kbDx * kbDx + kbDy * kbDy) || 1;
                        // Boss Phase 3: stronger knockback
                        const kbMult = (enemy.isBoss && enemy.bossPhase >= 3) ? 0.6 : 0.3;
                        player.knockX = (kbDx / kbDist) * kbMult;
                        player.knockY = (kbDy / kbDist) * kbMult;
                    }
                    // Attack speed modifiers: boss phase 3, rat frenzy
                    let delay = enemy.attackDelay;
                    if (enemy.isBoss && enemy.bossPhase >= 3) delay *= 0.7;
                    if (enemy.frenzied) delay *= 0.6;
                    enemy.attackTimer = delay;
                }
                break;
        }
    }

    static takeDamage(enemy, damage, player) {
        // Boss phase transition: invulnerable
        if (enemy.phaseTransitionTimer > 0) {
            Combat.addFloatingText(enemy.x, enemy.y, 'IMMUNE', '#888');
            return 0;
        }

        // Skeleton block: halve damage, no knockback, show BLOCKED text
        if (enemy.blocking) {
            const blockedDmg = Math.max(1, Math.floor(damage * 0.5) - enemy.def);
            enemy.hp -= blockedDmg;
            if (Game.state.runStats) Game.state.runStats.damageDealt += blockedDmg;
            enemy.stunTimer = 0.05; // minimal stun when blocking
            Combat.addFloatingText(enemy.x, enemy.y, `BLOCKED -${blockedDmg}`, '#8888ff');
            Audio.play('shieldBlock');
            // No knockback when blocking
            return blockedDmg;
        }

        const def = enemy.def;
        const actualDmg = Math.max(1, damage - def + Math.floor(Math.random() * 3) - 1);
        enemy.hp -= actualDmg;
        if (Game.state.runStats) Game.state.runStats.damageDealt += actualDmg;
        enemy.stunTimer = 0.15;
        enemy.state = 'chase';
        enemy.blocking = false; // break block on hit
        enemy.blockCycle = 1.5; // reset to open phase so player gets a window

        if (enemy.hp <= 0) {
            Audio.play('enemyDeath');
            Enemy.dropLoot(enemy, player);
            player.gainXp(enemy.xp);

            if (enemy.isFinalBoss) {
                // Victory!
                Game.renderer.shake(20, 1.5);
                Game.hitStop(0.3);
                Audio.play('bossKill');
                setTimeout(() => {
                    Game.notify('MALPHAS IS SLAIN!', '#ff0044');
                    Game.notify('Your children are free. You have won!', '#ffd700');
                    Game.notify('── VICTORY ──  The Demon Lord is dead.', '#ff8040');
                    Game.state.victory = true;
                }, 500);
            } else if (enemy.isMajorBoss) {
                Game.renderer.shake(15, 1.0);
                Game.hitStop(0.25);
                Audio.play('bossKill');
                Game.notify(`★ ${enemy.name} DEFEATED ★`, '#ff8800');
            } else if (enemy.isBoss) {
                Game.renderer.shake(10, 0.6);
                Game.hitStop(0.15);
                Audio.play('bossKill');
                Game.notify(`★ ${enemy.name} DEFEATED ★`, '#ffbb00');
            }
        }
        return actualDmg;
    }

    static dropLoot(enemy, player) {
        if (!enemy.loot) return;
        for (const drop of enemy.loot) {
            if (Math.random() > drop.chance) continue;
            let amount = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
            if (drop.type === 'gold') {
                // Gold find bonus from tavern buffs
                const bonus = player.getGoldFindBonus ? player.getGoldFindBonus() : 0;
                if (bonus > 0) amount = Math.floor(amount * (1 + bonus));
                player.gold = (player.gold || 0) + amount;
                if (Game.state.runStats) Game.state.runStats.goldEarned += amount;
                Game.notify(`+${amount} Gold`, '#ffd020');
            } else if (drop.type === 'resource') {
                if (Game.state.village && Game.state.village.resources) {
                    const res = Game.state.village.resources;
                    if (res[drop.resource] !== undefined) {
                        res[drop.resource] += amount;
                    } else {
                        res[drop.resource] = amount;
                    }
                    const label = drop.resource.charAt(0).toUpperCase() + drop.resource.slice(1);
                    Game.notify(`+${amount} ${label}`, '#80ff40');
                }
            }
        }
        // Elite enemies drop bonus loot
        if (enemy.isElite) {
            const bonusGold = 15 + Math.floor(Math.random() * 30);
            player.gold = (player.gold || 0) + bonusGold;
            Game.notify(`+${bonusGold} Elite Gold`, '#ffcc00');
            // 30% chance for a potion drop
            if (Math.random() < 0.3 && player.inventory.length < player.maxInventory) {
                const potion = ItemGenerator.generatePotion(Math.min(4, Math.floor(Game.state.currentFloor / 3)));
                player.addToInventory(potion);
                Game.notify(`Elite dropped ${potion.name}!`, '#ff88ff');
            }
        }

        // Boss-specific unique loot drops
        if (enemy.bossLoot && BOSS_LOOT[enemy.bossLoot]) {
            const lootDef = BOSS_LOOT[enemy.bossLoot];
            if (player.inventory.length < player.maxInventory) {
                const item = ItemGenerator.createItem(lootDef, lootDef._category);
                player.addToInventory(item);
                Game.notify(`★ ${item.name} dropped! ★`, '#ffd700');
                Combat.addFloatingText(player.x, player.y, item.name, '#ffd700');
                Audio.play('chestOpen');
            } else {
                Game.notify(`Inventory full! ${lootDef.name} was lost!`, '#ff4444');
            }
        }

        // Soul Shard drops from bosses
        if (enemy.isBoss) {
            let shards;
            if (enemy.isFinalBoss) {
                shards = 40 + Math.floor(Math.random() * 21); // 40-60
            } else if (enemy.isMajorBoss) {
                shards = 15 + Math.floor(Math.random() * 11); // 15-25
            } else {
                shards = 5 + Math.floor(Math.random() * 6);   // 5-10
            }
            player.soulShards = (player.soulShards || 0) + shards;
            Game.notify(`+${shards} Soul Shards`, '#c040ff');
            // Unlock floor checkpoint on boss kill (5er floors)
            const floor = Game.state.currentFloor;
            if (floor % 5 === 0 && !Game.state.unlockedFloors.includes(floor)) {
                Game.state.unlockedFloors.push(floor);
                Game.state.unlockedFloors.sort((a, b) => a - b);
                Game.notify(`Floor ${floor} checkpoint unlocked!`, '#40e0e0');
            }
        } else {
            // Rare soul shard drops from normal enemies (8% chance, 1-2 shards)
            if (Math.random() < 0.08) {
                const shards = 1 + Math.floor(Math.random() * 2);
                player.soulShards = (player.soulShards || 0) + shards;
                Game.notify(`+${shards} Soul Shard${shards > 1 ? 's' : ''}`, '#c040ff');
            }
        }
        // Blessing: Blood Pact — heal on kill
        if (player.blessings && player.blessings.bloodPact) {
            player.hp = Math.min(player.maxHp, player.hp + 2);
        }
        // Track run kills
        if (Game.state.runStats) {
            Game.state.runStats.kills++;
            if (enemy.isBoss) Game.state.runStats.bossesKilled = (Game.state.runStats.bossesKilled || 0) + 1;
            // Track strongest kill by enemy maxHp
            if (!Game.state.runStats.bestKill || (enemy.maxHp || 0) > (Game.state.runStats._bestKillHp || 0)) {
                Game.state.runStats.bestKill = enemy.name;
                Game.state.runStats._bestKillHp = enemy.maxHp || 0;
            }
        }
    }
}
