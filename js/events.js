// Dungeon Floor Events — random encounters in dungeon rooms
const DungeonEvents = {

    EVENTS: {
        bloodShrine: {
            id: 'bloodShrine', name: 'Blood Shrine', minFloor: 3,
            tile: TILE.SHRINE, weight: 3,
            desc: 'A crimson altar pulses with dark energy...',
            prompt: 'Sacrifice 20% of your HP for a random blessing?',
        },
        merchant: {
            id: 'merchant', name: 'Wandering Merchant', minFloor: 5,
            tile: TILE.MERCHANT, weight: 2,
            desc: 'A wretched merchant grins from the shadows...',
            prompt: null, // opens panel directly
        },
        cursedChest: {
            id: 'cursedChest', name: 'Cursed Chest', minFloor: 4,
            tile: TILE.CURSED_CHEST, weight: 3,
            desc: 'An ornate chest radiates malevolent energy...',
            prompt: 'Open the cursed chest? Could be treasure... or a trap.',
        },
        fountain: {
            id: 'fountain', name: 'Healing Fountain', minFloor: 2,
            tile: TILE.FOUNTAIN, weight: 4,
            desc: 'Crystal-clear water flows from an ancient spring...',
            prompt: 'Drink from the fountain? (Restores 50% max HP)',
        },
        prisoner: {
            id: 'prisoner', name: 'Imprisoned Soul', minFloor: 8,
            tile: TILE.PRISONER, weight: 1,
            desc: 'A spectral figure writhes behind ethereal chains...',
            prompt: null, // opens choice panel
        },
    },

    // Generate 1-2 events for a floor, placed in middle rooms
    generate(floor, map) {
        const eligible = [];
        for (const key in this.EVENTS) {
            const ev = this.EVENTS[key];
            if (floor >= ev.minFloor) {
                for (let i = 0; i < ev.weight; i++) eligible.push(ev);
            }
        }
        if (eligible.length === 0) return [];

        const middleRooms = map.rooms.slice(1, -1);
        if (middleRooms.length === 0) return [];

        const eventCount = 1 + (Math.random() < 0.4 ? 1 : 0);
        const placed = [];
        const usedRooms = new Set();

        for (let i = 0; i < eventCount && eligible.length > 0; i++) {
            const ev = eligible[Math.floor(Math.random() * eligible.length)];
            // Find unused room
            let room = null;
            for (let tries = 0; tries < 10; tries++) {
                const r = middleRooms[Math.floor(Math.random() * middleRooms.length)];
                const key = r.cx + ',' + r.cy;
                if (!usedRooms.has(key) && map.get(r.cx, r.cy) === TILE.FLOOR) {
                    room = r;
                    usedRooms.add(key);
                    break;
                }
            }
            if (!room) continue;

            map.set(room.cx, room.cy, ev.tile);
            placed.push({
                id: ev.id,
                x: room.cx,
                y: room.cy,
                used: false,
            });
        }
        return placed;
    },

    // Resolve a yes/no event (shrine, cursed chest, fountain)
    resolve(eventData, player, floor) {
        const ev = this.EVENTS[eventData.id];
        if (!ev || eventData.used) return null;
        eventData.used = true;

        switch (eventData.id) {
            case 'bloodShrine': return this._resolveShrine(player);
            case 'cursedChest': return this._resolveCursedChest(player, floor);
            case 'fountain':    return this._resolveFountain(player, eventData);
            default: return null;
        }
    },

    _resolveShrine(player) {
        const cost = Math.floor(player.hp * 0.2);
        player.hp = Math.max(1, player.hp - cost);
        const roll = Math.random();
        if (roll < 0.33) {
            // +2 ATK for this run (stored as temp buff)
            if (!player._runBonuses) player._runBonuses = {};
            player._runBonuses.atk = (player._runBonuses.atk || 0) + 2;
            return { text: 'The shrine grants dark strength... (+2 ATK this run)', color: '#ff4040' };
        } else if (roll < 0.66) {
            if (!player._runBonuses) player._runBonuses = {};
            player._runBonuses.maxHp = (player._runBonuses.maxHp || 0) + 15;
            player.maxHp = player.getMaxHp();
            return { text: 'Unholy vitality surges through you... (+15 max HP this run)', color: '#ff4040' };
        } else {
            const heal = Math.floor(player.getMaxHp() * 0.5);
            player.hp = Math.min(player.hp + heal, player.getMaxHp());
            return { text: 'The shrine mends your wounds... (Healed ' + heal + ' HP)', color: '#ff4040' };
        }
    },

    _resolveCursedChest(player, floor) {
        const roll = Math.random();
        if (roll < 0.60) {
            // High-tier item
            const categories = ['weapons', 'armors', 'helmets', 'boots', 'rings', 'amulets'];
            const cat = categories[Math.floor(Math.random() * categories.length)];
            const tier = Math.min(Math.floor(floor / 5) + 2, 10);
            const items = ItemGenerator.getShopItems(cat, tier);
            if (items.length > 0) {
                const item = items[Math.floor(Math.random() * items.length)];
                if ((player.inventory ? player.inventory.length : 0) < player.maxInventory) {
                    player.inventory.push(item);
                    return { text: 'Treasure! Found ' + item.name, color: '#c040ff' };
                }
                return { text: 'Treasure! But your inventory is full...', color: '#888' };
            }
            // Fallback to gold
            const gold = floor * 15;
            player.gold += gold;
            if (Game.state.runStats) Game.state.runStats.goldEarned += gold;
            return { text: 'Found ' + gold + ' gold!', color: '#ff0' };
        } else if (roll < 0.85) {
            const gold = floor * (10 + Math.floor(Math.random() * 11));
            player.gold += gold;
            if (Game.state.runStats) Game.state.runStats.goldEarned += gold;
            return { text: 'The chest holds ' + gold + ' gold!', color: '#ff0' };
        } else {
            // Trap!
            const dmg = Math.floor((player.hp || 1) * 0.3);
            player.hp = Math.max(1, (player.hp || 1) - dmg);
            return { text: 'TRAP! Dark energy erupts! (-' + dmg + ' HP) Enemies approach!', color: '#ff0000', trap: true };
        }
    },

    _resolveFountain(player, eventData) {
        const heal = Math.floor(player.getMaxHp() * 0.5);
        player.hp = Math.min(player.hp + heal, player.getMaxHp());
        // Mark tile as dry — caller should set tile to FOUNTAIN_DRY
        eventData.dry = true;
        return { text: 'The cool water restores you... (Healed ' + heal + ' HP)', color: '#40ffff' };
    },

    // Imprisoned Soul — resolve after player picks a choice (0, 1, 2)
    resolvePrisoner(player, choiceIndex) {
        switch (choiceIndex) {
            case 0:
                player.str += 3;
                return { text: 'Raw power courses through you... (+3 STR permanently)', color: '#ffffff' };
            case 1:
                player.vit += 4;
                player.maxHp = player.getMaxHp();
                player.hp = Math.min(player.hp + 20, player.maxHp);
                return { text: 'Your body hardens... (+4 VIT, +20 max HP permanently)', color: '#ffffff' };
            case 2:
                if (!player._runBonuses) player._runBonuses = {};
                player._runBonuses.potionBoost = (player._runBonuses.potionBoost || 0) + 1;
                return { text: 'Healing magic intensifies... (+50% potion effectiveness)', color: '#ffffff' };
        }
        return null;
    },

    // Merchant — generate 3 items for mini-shop
    getMerchantItems(floor) {
        const categories = ['weapons', 'armors', 'helmets', 'boots', 'potions'];
        const items = [];
        const tier = Math.min(Math.floor(floor / 5) + 1, 10);
        for (let i = 0; i < 3; i++) {
            const cat = categories[Math.floor(Math.random() * categories.length)];
            const available = ItemGenerator.getShopItems(cat, tier);
            if (available.length > 0) {
                const item = available[Math.floor(Math.random() * available.length)];
                // Random price variance 80-140%
                item.value = Math.floor(item.value * (0.8 + Math.random() * 0.6));
                items.push(item);
            }
        }
        return items;
    },
};
