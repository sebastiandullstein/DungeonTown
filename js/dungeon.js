// Procedural Dungeon Generator using BSP
const TILE = {
    VOID: 0,
    WALL: 1,
    FLOOR: 2,
    DOOR: 3,
    STAIRS_DOWN: 4,
    STAIRS_UP: 5,
    WATER: 6,
    CHEST: 7,
    SHRINE: 8,
    MERCHANT: 9,
    CURSED_CHEST: 10,
    FOUNTAIN: 11,
    FOUNTAIN_DRY: 12,
    PRISONER: 13,
    ARENA_WALL: 14,
    PILLAR: 15,
};

const TILE_DISPLAY = {
    [TILE.VOID]: { char: ' ', fg: '#000', bg: '#000' },
    [TILE.WALL]: { char: '#', fg: '#665', bg: '#221' },
    [TILE.FLOOR]: { char: '.', fg: '#444', bg: '#110' },
    [TILE.DOOR]: { char: '+', fg: '#a80', bg: '#110' },
    [TILE.STAIRS_DOWN]: { char: '>', fg: '#0ff', bg: '#110' },
    [TILE.STAIRS_UP]: { char: '<', fg: '#0ff', bg: '#110' },
    [TILE.WATER]: { char: '~', fg: '#44f', bg: '#113' },
    [TILE.CHEST]: { char: '=', fg: '#ff0', bg: '#110' },
    [TILE.SHRINE]: { char: '†', fg: '#ff2020', bg: '#300' },
    [TILE.MERCHANT]: { char: '$', fg: '#ffd700', bg: '#1a1000' },
    [TILE.CURSED_CHEST]: { char: '?', fg: '#c040ff', bg: '#200030' },
    [TILE.FOUNTAIN]: { char: '~', fg: '#40ffff', bg: '#001828' },
    [TILE.FOUNTAIN_DRY]: { char: '~', fg: '#555', bg: '#111' },
    [TILE.PRISONER]: { char: '@', fg: '#ffffff', bg: '#1a001a' },
    [TILE.ARENA_WALL]: { char: '#', fg: '#886', bg: '#332' },
    [TILE.PILLAR]: { char: 'O', fg: '#998', bg: '#221' },
};

class DungeonMap {
    constructor(width = 80, height = 45) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.rooms = [];
        this.enemies = [];
        this.items = [];
        this.playerStart = { x: 5, y: 5 };
        this.stairsDown = { x: 0, y: 0 };
        this.explored = [];

        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            this.explored[y] = [];
            for (let x = 0; x < width; x++) {
                this.tiles[y][x] = TILE.WALL;
                this.explored[y][x] = false;
            }
        }
    }

    get(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return TILE.WALL;
        return this.tiles[y][x];
    }

    set(x, y, tile) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        this.tiles[y][x] = tile;
    }

    isWalkable(x, y) {
        const t = this.get(x, y);
        return t === TILE.FLOOR || t === TILE.DOOR || t === TILE.STAIRS_DOWN || t === TILE.STAIRS_UP || t === TILE.CHEST;
    }

    // Open a chest at (x,y): convert tile to floor, drop gold + possible potion
    openChest(x, y, floor, player) {
        if (this.get(x, y) !== TILE.CHEST) return false;
        this.set(x, y, TILE.FLOOR);

        // Always drop some gold
        const gold = 15 + Math.floor(Math.random() * 20 * Math.max(1, floor));
        player.gold = (player.gold || 0) + gold;
        Game.notify(`Chest! +${gold} Gold`, '#ffd700');

        // Possibly also a potion
        const loot = ItemGenerator.generateChestLoot(floor);
        if (loot) {
            loot.x = x; loot.y = y;
            this.items.push(loot);
            Game.notify(`Found ${loot.name}!`, '#0ff');
        }
        return true;
    }

    revealAround(px, py, radius = 6) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    const x = px + dx;
                    const y = py + dy;
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        // Simple line-of-sight check
                        if (this.hasLineOfSight(px, py, x, y)) {
                            this.explored[y][x] = true;
                        }
                    }
                }
            }
        }
    }

    hasLineOfSight(x0, y0, x1, y1) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        let cx = x0, cy = y0;

        while (cx !== x1 || cy !== y1) {
            const t = this.get(cx, cy);
            if ((t === TILE.WALL || t === TILE.ARENA_WALL || t === TILE.PILLAR) && (cx !== x0 || cy !== y0)) return false;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; cx += sx; }
            if (e2 < dx) { err += dx; cy += sy; }
        }
        return true;
    }

    isInFOV(px, py, x, y, radius = 6) {
        const dist = (x - px) * (x - px) + (y - py) * (y - py);
        if (dist > radius * radius) return false;
        return this.hasLineOfSight(px, py, x, y);
    }
}

class DungeonGenerator {
    static generate(floor = 1) {
        // Scale map size with floor — early floors are tighter for higher density
        const mapW = floor <= 3 ? 50 : floor <= 8 ? 60 : 80;
        const mapH = floor <= 3 ? 30 : floor <= 8 ? 36 : 45;
        const map = new DungeonMap(mapW, mapH);
        const minRoomSize = 5;
        const maxRoomSize = floor <= 5 ? 9 : 12;
        const leaves = [];

        // BSP split
        class Leaf {
            constructor(x, y, w, h) {
                this.x = x; this.y = y; this.w = w; this.h = h;
                this.left = null; this.right = null;
                this.room = null;
            }

            split() {
                if (this.left || this.right) return false;
                // Determine split direction
                let splitH = Math.random() > 0.5;
                if (this.w > this.h && this.w / this.h >= 1.25) splitH = false;
                else if (this.h > this.w && this.h / this.w >= 1.25) splitH = true;

                const max = (splitH ? this.h : this.w) - minRoomSize;
                if (max <= minRoomSize) return false;

                const split = Math.floor(Math.random() * (max - minRoomSize)) + minRoomSize;

                if (splitH) {
                    this.left = new Leaf(this.x, this.y, this.w, split);
                    this.right = new Leaf(this.x, this.y + split, this.w, this.h - split);
                } else {
                    this.left = new Leaf(this.x, this.y, split, this.h);
                    this.right = new Leaf(this.x + split, this.y, this.w - split, this.h);
                }
                return true;
            }

            createRooms(map) {
                if (this.left || this.right) {
                    if (this.left) this.left.createRooms(map);
                    if (this.right) this.right.createRooms(map);
                    if (this.left && this.right) {
                        DungeonGenerator.createCorridor(map,
                            this.left.getRoom(), this.right.getRoom());
                    }
                } else {
                    const w = Math.min(maxRoomSize, Math.floor(Math.random() * (this.w - 4)) + 4);
                    const h = Math.min(maxRoomSize, Math.floor(Math.random() * (this.h - 4)) + 4);
                    const x = this.x + Math.floor(Math.random() * (this.w - w));
                    const y = this.y + Math.floor(Math.random() * (this.h - h));

                    this.room = { x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) };
                    map.rooms.push(this.room);

                    for (let ry = y; ry < y + h; ry++) {
                        for (let rx = x; rx < x + w; rx++) {
                            if (rx === x || rx === x + w - 1 || ry === y || ry === y + h - 1) {
                                map.set(rx, ry, TILE.WALL);
                            } else {
                                map.set(rx, ry, TILE.FLOOR);
                            }
                        }
                    }
                }
            }

            getRoom() {
                if (this.room) return this.room;
                const lRoom = this.left ? this.left.getRoom() : null;
                const rRoom = this.right ? this.right.getRoom() : null;
                if (!lRoom && !rRoom) return null;
                if (!lRoom) return rRoom;
                if (!rRoom) return lRoom;
                return Math.random() > 0.5 ? lRoom : rRoom;
            }
        }

        const root = new Leaf(1, 1, mapW - 2, mapH - 2);
        leaves.push(root);

        let didSplit = true;
        while (didSplit) {
            didSplit = false;
            const current = [...leaves];
            for (const leaf of current) {
                if (!leaf.left && !leaf.right) {
                    if (leaf.w > maxRoomSize + 2 || leaf.h > maxRoomSize + 2 || Math.random() > 0.25) {
                        if (leaf.split()) {
                            leaves.push(leaf.left);
                            leaves.push(leaf.right);
                            didSplit = true;
                        }
                    }
                }
            }
        }

        root.createRooms(map);

        // Boss floors: replace last room with arena
        const isFinalFloor = (floor === 50);
        const isMajorBoss  = (floor % 10 === 0);
        const isMiniBoss   = (floor % 5  === 0 && !isMajorBoss);
        const hasBoss      = isFinalFloor || isMajorBoss || isMiniBoss;

        if (hasBoss && map.rooms.length > 1) {
            const arenaW = 14, arenaH = 12;
            const oldRoom = map.rooms[map.rooms.length - 1];
            // Center arena within the old room's leaf area
            const ax = Math.max(2, Math.min(mapW - arenaW - 2, oldRoom.cx - Math.floor(arenaW / 2)));
            const ay = Math.max(2, Math.min(mapH - arenaH - 2, oldRoom.cy - Math.floor(arenaH / 2)));
            const arena = { x: ax, y: ay, w: arenaW, h: arenaH, cx: ax + Math.floor(arenaW / 2), cy: ay + Math.floor(arenaH / 2), isArena: true };

            // Clear the arena area: walls on border, floor inside
            for (let ry = ay; ry < ay + arenaH; ry++) {
                for (let rx = ax; rx < ax + arenaW; rx++) {
                    if (rx === ax || rx === ax + arenaW - 1 || ry === ay || ry === ay + arenaH - 1) {
                        map.set(rx, ry, TILE.ARENA_WALL);
                    } else {
                        map.set(rx, ry, TILE.FLOOR);
                    }
                }
            }

            // Place 4 symmetric pillars for cover (2 tiles in from corners)
            const pillarPositions = [
                { x: ax + 3, y: ay + 3 },
                { x: ax + arenaW - 4, y: ay + 3 },
                { x: ax + 3, y: ay + arenaH - 4 },
                { x: ax + arenaW - 4, y: ay + arenaH - 4 },
            ];
            for (const pp of pillarPositions) {
                map.set(pp.x, pp.y, TILE.PILLAR);
            }

            // Place doors on the arena walls (one on each side where corridor can connect)
            const doorPositions = [
                { x: arena.cx, y: ay },              // top
                { x: arena.cx, y: ay + arenaH - 1 }, // bottom
                { x: ax, y: arena.cy },               // left
                { x: ax + arenaW - 1, y: arena.cy },  // right
            ];
            for (const dp of doorPositions) {
                map.set(dp.x, dp.y, TILE.DOOR);
            }
            // Store door positions for sealing later
            arena.doorPositions = doorPositions;

            // Replace the last room
            map.rooms[map.rooms.length - 1] = arena;
        }

        // Place player start in first room
        if (map.rooms.length > 0) {
            const startRoom = map.rooms[0];
            map.playerStart = { x: startRoom.cx, y: startRoom.cy };
            map.set(startRoom.cx, startRoom.cy, TILE.STAIRS_UP);
        }

        // Place stairs down in last room (skip for arena — stairs appear after boss dies)
        if (map.rooms.length > 1) {
            const endRoom = map.rooms[map.rooms.length - 1];
            if (!endRoom.isArena) {
                map.stairsDown = { x: endRoom.cx, y: endRoom.cy };
                map.set(endRoom.cx, endRoom.cy, TILE.STAIRS_DOWN);
            } else {
                // No stairs until boss is defeated
                map.stairsDown = { x: endRoom.cx, y: endRoom.cy };
            }
        }

        // Place enemies (includes boss placement on boss floors)
        DungeonGenerator.placeEnemies(map, floor);

        // Place items (gold + potions only — gear is vendor-exclusive)
        DungeonGenerator.placeItems(map, floor);

        return map;
    }

    static createCorridor(map, room1, room2) {
        if (!room1 || !room2) return;
        // Connect room edges instead of centers for shorter corridors
        let x = room1.cx;
        let y = room1.cy;
        let tx = room2.cx;
        let ty = room2.cy;

        // Clamp start/end to room borders for shorter paths
        if (tx > x) {
            x = Math.min(room1.x + room1.w - 2, x);
            tx = Math.max(room2.x + 1, tx);
        } else {
            x = Math.max(room1.x + 1, x);
            tx = Math.min(room2.x + room2.w - 2, tx);
        }
        if (ty > y) {
            y = Math.min(room1.y + room1.h - 2, y);
            ty = Math.max(room2.y + 1, ty);
        } else {
            y = Math.max(room1.y + 1, y);
            ty = Math.min(room2.y + room2.h - 2, ty);
        }

        while (x !== tx) {
            map.set(x, y, TILE.FLOOR);
            map.set(x, y - 1, TILE.FLOOR);
            x += x < tx ? 1 : -1;
        }
        while (y !== ty) {
            map.set(x, y, TILE.FLOOR);
            map.set(x - 1, y, TILE.FLOOR);
            y += y < ty ? 1 : -1;
        }
    }

    static placeEnemies(map, floor) {
        const isFinalFloor = (floor === 50);
        const isMajorBoss  = (floor % 10 === 0);
        const isMiniBoss   = (floor % 5  === 0 && !isMajorBoss);
        const hasBoss      = isFinalFloor || isMajorBoss || isMiniBoss;

        // Regular enemies — skip the last room when a boss is present there
        const normalRooms = hasBoss
            ? map.rooms.slice(1, -1)   // reserve last room for boss
            : map.rooms.slice(1);

        // More enemies on early floors for density; scales up with floor
        const baseCount = floor <= 3 ? 10 : floor <= 8 ? 8 : 6;
        const enemyCount = baseCount + floor * 2 + Math.floor(Math.random() * 4);

        // Spawn enemies in clusters of 2-4 per room for group encounters
        let spawned = 0;
        while (spawned < enemyCount && normalRooms.length > 0) {
            const room = normalRooms[Math.floor(Math.random() * normalRooms.length)];
            const clusterSize = 2 + Math.floor(Math.random() * 3); // 2-4
            const type = EnemyTypes.getForFloor(floor);
            const cx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const cy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            for (let j = 0; j < clusterSize && spawned < enemyCount; j++) {
                // Scatter within 1-2 tiles of cluster center
                const ox = j === 0 ? 0 : Math.floor(Math.random() * 3) - 1;
                const oy = j === 0 ? 0 : Math.floor(Math.random() * 3) - 1;
                const ex = cx + ox;
                const ey = cy + oy;
                if (map.isWalkable(ex, ey)) {
                    map.enemies.push(Enemy.create(ex, ey, type));
                    spawned++;
                }
            }
        }

        // Corridor enemies — scatter a few in non-room floor tiles
        const corridorCount = Math.floor(enemyCount * 0.25);
        let corridorSpawned = 0;
        for (let attempt = 0; attempt < corridorCount * 10 && corridorSpawned < corridorCount; attempt++) {
            const rx = 1 + Math.floor(Math.random() * (map.width - 2));
            const ry = 1 + Math.floor(Math.random() * (map.height - 2));
            if (map.get(rx, ry) !== TILE.FLOOR) continue;
            // Make sure it's NOT inside a room (corridor tile only)
            const inRoom = map.rooms.some(r => rx > r.x && rx < r.x + r.w - 1 && ry > r.y && ry < r.y + r.h - 1);
            if (inRoom) continue;
            // Don't spawn on player start
            if (rx === map.playerStart.x && ry === map.playerStart.y) continue;
            map.enemies.push(Enemy.create(rx, ry, EnemyTypes.getForFloor(floor)));
            corridorSpawned++;
        }

        // Boss spawn — always in the last room, near centre
        if (hasBoss && map.rooms.length > 1) {
            const bossRoom = map.rooms[map.rooms.length - 1];
            const bx = bossRoom.cx;
            const by = bossRoom.cy;

            if (isFinalFloor) {
                // Floor 50: Demon Lord (final boss) + 2 demon guards
                map.enemies.push(Enemy.create(bx, by, EnemyTypes.types.demonLord));
                if (map.isWalkable(bx - 2, by)) map.enemies.push(Enemy.create(bx - 2, by, EnemyTypes.types.demon));
                if (map.isWalkable(bx + 2, by)) map.enemies.push(Enemy.create(bx + 2, by, EnemyTypes.types.demon));
            } else if (isMajorBoss) {
                map.enemies.push(Enemy.create(bx, by, EnemyTypes.getMajorBossForFloor(floor)));
            } else if (isMiniBoss) {
                map.enemies.push(Enemy.create(bx, by, EnemyTypes.getMiniBossForFloor(floor)));
            }
        }
    }

    static _findFloorTile(map) {
        for (let attempt = 0; attempt < 5; attempt++) {
            const room = map.rooms[Math.floor(Math.random() * map.rooms.length)];
            const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map.isWalkable(x, y) && map.get(x, y) === TILE.FLOOR) return { x, y };
        }
        return null;
    }

    static placeItems(map, floor) {
        // Scatter potions as dungeon floor loot
        const potionCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < potionCount; i++) {
            const pos = this._findFloorTile(map);
            if (pos) {
                const item = ItemGenerator.generateDungeonLoot(floor);
                item.x = pos.x;
                item.y = pos.y;
                map.items.push(item);
            }
        }

        // Gold piles
        const goldCount = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < goldCount; i++) {
            const pos = this._findFloorTile(map);
            if (pos) {
                map.items.push({
                    x: pos.x, y: pos.y, name: 'Gold',
                    type: 'gold',
                    char: '$', fg: '#ff0',
                    value: 10 + Math.floor(Math.random() * 15 * Math.max(1, floor)),
                });
            }
        }

        // Chests — 1–2 per floor in middle rooms (contain gold + possible potion)
        const chestRooms = map.rooms.slice(1, -1);
        const chestCount = 1 + (Math.random() < 0.45 ? 1 : 0);
        for (let i = 0; i < chestCount && chestRooms.length > 0; i++) {
            const room = chestRooms[Math.floor(Math.random() * chestRooms.length)];
            const cx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const cy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map.get(cx, cy) === TILE.FLOOR) {
                map.set(cx, cy, TILE.CHEST);
            }
        }
    }
}
