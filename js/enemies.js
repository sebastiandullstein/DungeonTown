// Enemy Types and AI
const EnemyTypes = {
    types: {
        rat: {
            name: 'Rat', char: 'r', fg: '#a86', bg: null,
            hp: 8, atk: 2, def: 0, speed: 0.6,
            xp: 5, detection: 5, minFloor: 1,
            loot: [
                { type: 'gold', chance: 0.6, min: 2, max: 6 },
            ],
        },
        bat: {
            name: 'Bat', char: 'b', fg: '#868', bg: null,
            hp: 6, atk: 3, def: 0, speed: 0.4,
            xp: 7, detection: 7, minFloor: 1,
            loot: [
                { type: 'gold', chance: 0.5, min: 1, max: 5 },
            ],
        },
        skeleton: {
            name: 'Skeleton', char: 's', fg: '#ddd', bg: null,
            hp: 20, atk: 5, def: 2, speed: 0.8,
            xp: 15, detection: 6, minFloor: 2,
            loot: [
                { type: 'gold', chance: 0.7, min: 6, max: 18 },
                { type: 'resource', chance: 0.2, resource: 'herbs', min: 1, max: 2 },
            ],
        },
        orc: {
            name: 'Orc', char: 'O', fg: '#0a0', bg: null,
            hp: 35, atk: 8, def: 3, speed: 1.0,
            xp: 25, detection: 5, minFloor: 3,
            loot: [
                { type: 'gold', chance: 0.8, min: 12, max: 30 },
                { type: 'resource', chance: 0.35, resource: 'iron', min: 1, max: 3 },
            ],
        },
        demon: {
            name: 'Demon', char: 'D', fg: '#f44', bg: null,
            hp: 60, atk: 12, def: 5, speed: 0.7,
            xp: 50, detection: 8, minFloor: 5,
            loot: [
                { type: 'gold', chance: 0.9, min: 25, max: 55 },
                { type: 'resource', chance: 0.4, resource: 'herbs', min: 2, max: 5 },
            ],
        },
        dragon: {
            name: 'Dragon', char: 'W', fg: '#f80', bg: null,
            hp: 150, atk: 20, def: 10, speed: 1.2,
            xp: 200, detection: 10, minFloor: 8,
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
            name: 'Cursed Knight', char: 'K', fg: '#88f', bg: null,
            hp: 130, atk: 18, def: 9, speed: 0.9,
            xp: 120, detection: 7, minFloor: 15, isBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 60, max: 120 },
                { type: 'resource', chance: 0.6, resource: 'iron', min: 4, max: 8 },
            ],
        },
        {
            name: 'Stone Golem', char: 'G', fg: '#aaa', bg: null,
            hp: 200, atk: 22, def: 14, speed: 1.3,
            xp: 180, detection: 5, minFloor: 25, isBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 90, max: 160 },
                { type: 'resource', chance: 0.8, resource: 'iron', min: 6, max: 12 },
            ],
        },
        {
            name: 'Lich', char: 'L', fg: '#c0f', bg: null,
            hp: 260, atk: 28, def: 10, speed: 0.8,
            xp: 250, detection: 10, minFloor: 35, isBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 130, max: 220 },
                { type: 'resource', chance: 0.9, resource: 'herbs', min: 8, max: 14 },
            ],
        },
        {
            name: 'Inferno Drake', char: 'W', fg: '#ff2200', bg: null,
            hp: 340, atk: 34, def: 16, speed: 1.0,
            xp: 350, detection: 9, minFloor: 45, isBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 180, max: 300 },
                { type: 'resource', chance: 1.0, resource: 'iron', min: 10, max: 18 },
            ],
        },
    ],

    // Major boss types — every 10th floor
    majorBosses: [
        {
            name: 'Warlord Grak', char: 'W', fg: '#f80', bg: null,
            hp: 220, atk: 20, def: 12, speed: 1.0,
            xp: 200, detection: 8, minFloor: 10, isBoss: true, isMajorBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 80, max: 150 },
                { type: 'resource', chance: 1.0, resource: 'iron', min: 6, max: 10 },
            ],
        },
        {
            name: 'Vampire Lord', char: 'V', fg: '#c00', bg: null,
            hp: 320, atk: 26, def: 14, speed: 0.7,
            xp: 320, detection: 10, minFloor: 20, isBoss: true, isMajorBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 130, max: 230 },
                { type: 'resource', chance: 1.0, resource: 'herbs', min: 10, max: 16 },
            ],
        },
        {
            name: 'Shadow Dragon', char: 'W', fg: '#606', bg: null,
            hp: 450, atk: 32, def: 18, speed: 1.1,
            xp: 480, detection: 10, minFloor: 30, isBoss: true, isMajorBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 200, max: 350 },
                { type: 'resource', chance: 1.0, resource: 'iron', min: 12, max: 20 },
                { type: 'resource', chance: 0.8, resource: 'herbs', min: 8, max: 14 },
            ],
        },
        {
            name: 'Chaos Titan', char: 'T', fg: '#f44', bg: null,
            hp: 600, atk: 40, def: 22, speed: 1.2,
            xp: 700, detection: 9, minFloor: 40, isBoss: true, isMajorBoss: true,
            loot: [
                { type: 'gold', chance: 1.0, min: 300, max: 500 },
                { type: 'resource', chance: 1.0, resource: 'iron', min: 15, max: 25 },
                { type: 'resource', chance: 1.0, resource: 'herbs', min: 12, max: 20 },
            ],
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
    static create(x, y, type) {
        // Bosses do not scale with floor — they are pre-tuned
        const isBoss = type.isBoss || false;
        const floorScale = isBoss ? 1.0 : 1 + (Game.state.currentFloor - type.minFloor) * 0.1;
        // Normalize name to simple key for sprite dispatch (take first word, lowercase)
        const typeKey = type.name.split(' ')[0].toLowerCase();
        return {
            x, y,
            type: typeKey,
            name: type.name,
            char: type.char,
            fg: type.fg,
            hp: Math.floor(type.hp * floorScale),
            maxHp: Math.floor(type.hp * floorScale),
            atk: Math.floor(type.atk * floorScale),
            def: Math.floor(type.def * floorScale),
            speed: type.speed,
            xp: Math.floor(type.xp * floorScale),
            detection: type.detection,
            loot: type.loot,
            isBoss: isBoss,
            isMajorBoss: type.isMajorBoss || false,
            isFinalBoss: type.isFinalBoss || false,
            attackDelay: isBoss ? 1.2 : 0.8,
            state: 'idle',
            moveTimer: 0,
            attackTimer: 0,
            stunTimer: 0,
            path: null,
            lastSeenX: -1,
            lastSeenY: -1,
        };
    }

    static spawn(floor, x, y) {
        const type = EnemyTypes.getForFloor(floor);
        return Enemy.create(x, y, type);
    }

    static update(enemy, dt, dungeonMap, player) {
        enemy.moveTimer -= dt;
        enemy.attackTimer -= dt;
        enemy.stunTimer -= dt;

        if (enemy.stunTimer > 0) return;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // State transitions
        if (dist <= 1.5 && enemy.state !== 'attack') {
            enemy.state = 'attack';
        } else if (dist <= enemy.detection && dungeonMap.hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
            enemy.state = 'chase';
            enemy.lastSeenX = player.x;
            enemy.lastSeenY = player.y;
        } else if (enemy.state === 'chase' && enemy.lastSeenX >= 0) {
            // Move to last seen position
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

                    // Try direct move, then cardinal
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
                    enemy.moveTimer = enemy.speed * 0.6;
                }
                break;

            case 'attack':
                if (dist > 1.5) {
                    enemy.state = 'chase';
                    break;
                }
                if (enemy.attackTimer <= 0) {
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
                        // Player knockback 0.3 tiles away from enemy
                        const kbDx = player.x - enemy.x;
                        const kbDy = player.y - enemy.y;
                        const kbDist = Math.sqrt(kbDx * kbDx + kbDy * kbDy) || 1;
                        player.knockX = (kbDx / kbDist) * 0.3;
                        player.knockY = (kbDy / kbDist) * 0.3;
                    }
                    enemy.attackTimer = enemy.attackDelay;
                }
                break;
        }
    }

    static takeDamage(enemy, damage, player) {
        const def = enemy.def;
        const actualDmg = Math.max(1, damage - def + Math.floor(Math.random() * 3) - 1);
        enemy.hp -= actualDmg;
        if (Game.state.runStats) Game.state.runStats.damageDealt += actualDmg;
        enemy.stunTimer = 0.15;
        enemy.state = 'chase';

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
        }
        // Blessing: Blood Pact — heal on kill
        if (player.blessings && player.blessings.bloodPact) {
            player.hp = Math.min(player.maxHp, player.hp + 2);
        }
        // Track run kills
        if (Game.state.runStats) Game.state.runStats.kills++;
    }
}
