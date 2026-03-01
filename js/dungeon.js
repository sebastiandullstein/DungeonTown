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
            if (this.get(cx, cy) === TILE.WALL && (cx !== x0 || cy !== y0)) return false;
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
        const map = new DungeonMap(80, 45);
        const minRoomSize = 5;
        const maxRoomSize = 12;
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

        const root = new Leaf(1, 1, map.width - 2, map.height - 2);
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

        // Place player start in first room
        if (map.rooms.length > 0) {
            const startRoom = map.rooms[0];
            map.playerStart = { x: startRoom.cx, y: startRoom.cy };
            map.set(startRoom.cx, startRoom.cy, TILE.STAIRS_UP);
        }

        // Place stairs down in last room
        if (map.rooms.length > 1) {
            const endRoom = map.rooms[map.rooms.length - 1];
            map.stairsDown = { x: endRoom.cx, y: endRoom.cy };
            map.set(endRoom.cx, endRoom.cy, TILE.STAIRS_DOWN);
        }

        // Place enemies (includes boss placement on boss floors)
        DungeonGenerator.placeEnemies(map, floor);

        // Place items (gold + potions only — gear is vendor-exclusive)
        DungeonGenerator.placeItems(map, floor);

        return map;
    }

    static createCorridor(map, room1, room2) {
        if (!room1 || !room2) return;
        let x = room1.cx;
        let y = room1.cy;
        const tx = room2.cx;
        const ty = room2.cy;

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

        const enemyCount = 5 + floor * 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < enemyCount; i++) {
            if (normalRooms.length === 0) break;
            const room = normalRooms[Math.floor(Math.random() * normalRooms.length)];
            const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map.isWalkable(x, y)) {
                const type = EnemyTypes.getForFloor(floor);
                map.enemies.push(Enemy.create(x, y, type));
            }
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

    static placeItems(map, floor) {
        // Scatter potions as dungeon floor loot
        const potionCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < potionCount; i++) {
            const roomIdx = Math.floor(Math.random() * map.rooms.length);
            const room = map.rooms[roomIdx];
            const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map.isWalkable(x, y) && map.get(x, y) === TILE.FLOOR) {
                const item = ItemGenerator.generateDungeonLoot(floor);
                item.x = x;
                item.y = y;
                map.items.push(item);
            }
        }

        // Gold piles
        const goldCount = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < goldCount; i++) {
            const roomIdx = Math.floor(Math.random() * map.rooms.length);
            const room = map.rooms[roomIdx];
            const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map.isWalkable(x, y) && map.get(x, y) === TILE.FLOOR) {
                map.items.push({
                    x, y, name: 'Gold',
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
