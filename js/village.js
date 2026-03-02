// Village Management System
const BUILDING_DEFS = {
    townhall: {
        name: 'Town Hall', char: 'H', fg: '#ff0', bg: '#330',
        description: 'Center of your village. Unlocks buildings and increases villager cap.',
        maxLevel: 3,
        costs: [
            null, // L1 is free / pre-built
            { wood: 50, stone: 50 },
            { wood: 120, stone: 120, iron: 20 },
        ],
        effects: [
            { maxVillagers: 5,  unlocksBuildings: ['farm', 'lumbermill', 'inn', 'weaponsmith', 'armorsmith'] },
            { maxVillagers: 8,  unlocksBuildings: ['quarry', 'blacksmith', 'apothecary', 'jewelry', 'pharmacy'] },
            { maxVillagers: 12, unlocksBuildings: ['barracks', 'walls', 'foodstore'] },
        ],
    },
    farm: {
        name: 'Farm', char: 'F', fg: '#0a0', bg: '#020',
        description: 'Produces food. Assign a Farmer to work it.',
        maxLevel: 3, job: 'Farmer',
        costs: [
            { wood: 20 },
            { wood: 50, stone: 15 },
            { wood: 100, stone: 40, iron: 5 },
        ],
        production: [
            { food: 2 }, { food: 5 }, { food: 10 },
        ],
    },
    lumbermill: {
        name: 'Lumber Mill', char: 'L', fg: '#a64', bg: '#210',
        description: 'Produces wood. Assign a Lumberjack.',
        maxLevel: 3, job: 'Lumberjack',
        costs: [
            { wood: 15 },
            { wood: 40, stone: 20 },
            { wood: 80, stone: 50, iron: 5 },
        ],
        production: [
            { wood: 2 }, { wood: 5 }, { wood: 10 },
        ],
    },
    quarry: {
        name: 'Quarry', char: 'Q', fg: '#888', bg: '#111',
        description: 'Produces stone. Assign a Miner.',
        maxLevel: 3, job: 'Miner',
        costs: [
            { wood: 25, stone: 10 },
            { wood: 50, stone: 30 },
            { wood: 80, stone: 60, iron: 10 },
        ],
        production: [
            { stone: 2 }, { stone: 4 }, { stone: 8 },
        ],
    },
    blacksmith: {
        name: 'Blacksmith', char: 'B', fg: '#f80', bg: '#210',
        description: 'Smelts iron ore. Assign a Smith to produce iron.',
        maxLevel: 3, job: 'Smith',
        costs: [
            { wood: 30, stone: 30 },
            { wood: 70, stone: 70, iron: 10 },
            { wood: 120, stone: 120, iron: 30 },
        ],
        production: [
            { iron: 1 }, { iron: 3 }, { iron: 6 },
        ],
    },
    apothecary: {
        name: 'Apothecary', char: 'A', fg: '#a4f', bg: '#201',
        description: 'Produces herbs. Assign an Alchemist.',
        maxLevel: 3, job: 'Alchemist',
        costs: [
            { wood: 20, stone: 15 },
            { wood: 50, stone: 35, herbs: 5 },
            { wood: 80, stone: 60, herbs: 15 },
        ],
        production: [
            { herbs: 1 }, { herbs: 3 }, { herbs: 6 },
        ],
    },
    barracks: {
        name: 'Barracks', char: 'K', fg: '#c44', bg: '#200',
        description: 'Train guards to defend the village from raids. Assign Guards.',
        maxLevel: 3, job: 'Guard',
        costs: [
            { wood: 40, stone: 40 },
            { wood: 80, stone: 80, iron: 15 },
            { wood: 140, stone: 140, iron: 40 },
        ],
        defense: [5, 12, 25],
    },
    inn: {
        name: 'Inn', char: 'I', fg: '#fa0', bg: '#210',
        description: 'Recruit new villagers here. Higher level = more recruits available.',
        maxLevel: 3, job: 'Innkeeper',
        costs: [
            { wood: 25, stone: 10 },
            { wood: 60, stone: 30 },
            { wood: 110, stone: 60 },
        ],
        recruitSlots: [1, 2, 3],
    },
    walls: {
        name: 'Walls', char: 'W', fg: '#aaa', bg: '#222',
        description: 'Passive defense. Reduces raid damage.',
        maxLevel: 3,
        costs: [
            { stone: 50, wood: 20 },
            { stone: 120, wood: 40, iron: 10 },
            { stone: 280, wood: 80, iron: 25 },
        ],
        defense: [3, 8, 15],
    },

    // ── Interactive Buildings (custom panels, always pre-built) ─────────────
    smithy: {
        name: 'Smithy', char: 'G', fg: '#ff6020', bg: '#301000',
        description: 'Buy weapons and armor. Upgrade your gear.',
        maxLevel: 3, isInteractive: true, interactPanel: 'smithy',
        costs: [null, { wood: 60, stone: 60, iron: 15 }, { wood: 120, stone: 120, iron: 40 }],
        shopTier: [3, 5, 8],
    },
    tavern: {
        name: 'Tavern', char: 'T', fg: '#ffa020', bg: '#302000',
        description: 'Buy buffs for your next dungeon run.',
        maxLevel: 1, isInteractive: true, interactPanel: 'tavern',
        costs: [null],
    },
    temple: {
        name: 'Temple', char: '+', fg: '#c040ff', bg: '#200040',
        description: 'Spend Soul Shards for permanent blessings.',
        maxLevel: 1, isInteractive: true, interactPanel: 'temple',
        costs: [null],
    },
    warehouse: {
        name: 'Warehouse', char: 'V', fg: '#60a080', bg: '#002010',
        description: 'Manage your inventory and view resources.',
        maxLevel: 1, isInteractive: true, interactPanel: 'warehouse',
        costs: [null],
    },

    // ── Gear Shops (paid with player gold in-shop, cost resources to BUILD) ──
    weaponsmith: {
        name: 'Weaponsmith', char: 'S', fg: '#f44', bg: '#200',
        description: 'Specialist in blades & bludgeons. Sells weapons only. Assign a Swordsmith.',
        maxLevel: 3, job: 'Swordsmith', isShop: true,
        shopCategories: ['weapons'],
        costs: [
            { wood: 25, stone: 25, iron: 8 },
            { wood: 60, stone: 60, iron: 20 },
            { wood: 110, stone: 110, iron: 40 },
        ],
        shopTier: [3, 5, 8],
    },
    armorsmith: {
        name: 'Armorsmith', char: 'M', fg: '#8cf', bg: '#012',
        description: 'Crafts armor, helmets & boots. Assign an Armorer.',
        maxLevel: 3, job: 'Armorer', isShop: true,
        shopCategories: ['armors', 'helmets', 'boots'],
        costs: [
            { wood: 25, stone: 25, iron: 8 },
            { wood: 60, stone: 60, iron: 20 },
            { wood: 110, stone: 110, iron: 40 },
        ],
        shopTier: [3, 5, 8],
    },
    jewelry: {
        name: 'Jewelry', char: 'J', fg: '#f0f', bg: '#101',
        description: 'Sells rings and amulets. Assign a Jeweler.',
        maxLevel: 3, job: 'Jeweler', isShop: true,
        shopCategories: ['rings', 'amulets'],
        costs: [
            { wood: 15, stone: 15 },
            { wood: 45, stone: 45, iron: 5 },
            { wood: 90, stone: 90, iron: 15 },
        ],
        shopTier: [2, 4, 7],
    },
    foodstore: {
        name: 'Food Store', char: 'E', fg: '#0f8', bg: '#010',
        description: 'Sells food buffs that temporarily boost your stats. Assign a Cook.',
        maxLevel: 3, job: 'Cook', isShop: true,
        shopCategories: ['food'],
        costs: [
            { wood: 20, food: 15 },
            { wood: 50, stone: 20, food: 30 },
            { wood: 90, stone: 50, food: 60 },
        ],
        shopTier: [1, 2, 3],
    },
    pharmacy: {
        name: 'Pharmacy', char: 'P', fg: '#0ff', bg: '#011',
        description: 'Sells health & mana potions. Assign a Pharmacist.',
        maxLevel: 3, job: 'Pharmacist', isShop: true,
        shopCategories: ['potions'],
        costs: [
            { wood: 20, herbs: 10 },
            { wood: 50, stone: 20, herbs: 25 },
            { wood: 90, stone: 50, herbs: 50 },
        ],
        shopTier: [1, 3, 5],
    },
};

const VILLAGER_NAMES = [
    'Ada', 'Bjorn', 'Clara', 'Dorn', 'Elara', 'Finn', 'Greta', 'Hugo',
    'Iris', 'Jan', 'Kara', 'Leif', 'Mira', 'Nils', 'Olga', 'Per',
    'Quinn', 'Rolf', 'Sif', 'Tor', 'Ulla', 'Vex', 'Wren', 'Yara', 'Zeke',
];

class Village {
    constructor() {
        this.resources = {
            // Village resources — produced by buildings, spent on construction
            wood: 80,
            stone: 60,
            food: 30,
            iron: 10,
            herbs: 10,
        };

        this.buildings = [
            { type: 'townhall', level: 1 },
            { type: 'farm', level: 1, villager: null },
            // Interactive buildings (always pre-built)
            { type: 'smithy', level: 1 },
            { type: 'tavern', level: 1 },
            { type: 'temple', level: 1 },
            { type: 'warehouse', level: 1 },
        ];

        this.villagers = [];
        // Sync with Town Hall L1 effect
        this.maxVillagers = BUILDING_DEFS.townhall.effects[0].maxVillagers;
        this.raidHistory = [];
        this.productionTimer = 0;
        this.productionInterval = 30; // seconds per production tick

        // Available recruits (refreshed)
        this.recruits = [];
        this.refreshRecruits();
    }

    getBuilding(type) {
        return this.buildings.find(b => b.type === type);
    }

    getBuildingDef(type) {
        return BUILDING_DEFS[type];
    }

    isBuildingUnlocked(type) {
        const townhall = this.getBuilding('townhall');
        if (!townhall) return false;
        for (let l = 0; l < townhall.level; l++) {
            const effects = BUILDING_DEFS.townhall.effects[l];
            if (effects.unlocksBuildings && effects.unlocksBuildings.includes(type)) {
                return true;
            }
        }
        return false;
    }

    canAfford(costs) {
        if (!costs) return false;
        for (const [res, amount] of Object.entries(costs)) {
            if ((this.resources[res] || 0) < amount) return false;
        }
        return true;
    }

    spend(costs) {
        for (const [res, amount] of Object.entries(costs)) {
            this.resources[res] = Math.max(0, (this.resources[res] || 0) - amount);
        }
    }

    buildOrUpgrade(type) {
        const def = BUILDING_DEFS[type];
        if (!def) return false;

        const existing = this.getBuilding(type);
        if (existing) {
            // Upgrade
            if (existing.level >= def.maxLevel) {
                Game.notify('Already max level!', '#f00');
                return false;
            }
            const cost = def.costs[existing.level];
            if (!this.canAfford(cost)) {
                const needed = cost ? Object.entries(cost).map(([k,v]) => `${v} ${k}`).join(', ') : '';
                Game.notify(`Need: ${needed}`, '#f80');
                return false;
            }
            this.spend(cost);
            existing.level++;
            Game.notify(`${def.name} upgraded to level ${existing.level}!`, '#0f0');
            Audio.play('buildComplete');

            // Update max villagers if townhall
            if (type === 'townhall') {
                this.maxVillagers = BUILDING_DEFS.townhall.effects[existing.level - 1].maxVillagers;
            }
            return true;
        } else {
            // Build new
            if (!this.isBuildingUnlocked(type)) {
                Game.notify('Upgrade Town Hall to unlock!', '#f00');
                return false;
            }
            const cost = def.costs[0];
            if (!this.canAfford(cost)) {
                const needed = cost ? Object.entries(cost).map(([k,v]) => `${v} ${k}`).join(', ') : '';
                Game.notify(`Need: ${needed}`, '#f80');
                return false;
            }
            this.spend(cost);
            const building = { type, level: 1, villager: null };
            this.buildings.push(building);
            Game.notify(`${def.name} built!`, '#0f0');
            Audio.play('buildComplete');
            return true;
        }
    }

    assignVillager(buildingType, villagerIdx) {
        const building = this.getBuilding(buildingType);
        if (!building) return false;
        const def = BUILDING_DEFS[buildingType];
        if (!def.job) return false;

        if (villagerIdx >= 0 && villagerIdx < this.villagers.length) {
            const villager = this.villagers[villagerIdx];
            // Unassign from old building
            for (const b of this.buildings) {
                if (b.villager === villager.name) {
                    b.villager = null;
                }
            }
            building.villager = villager.name;
            villager.job = def.job;
            Game.notify(`${villager.name} assigned as ${def.job}`, '#0f0');
            return true;
        }
        return false;
    }

    recruitVillager(recruitIdx) {
        if (this.villagers.length >= this.maxVillagers) {
            Game.notify('Village is full! Upgrade Town Hall.', '#f00');
            return false;
        }
        if (recruitIdx < 0 || recruitIdx >= this.recruits.length) return false;

        const recruit = this.recruits[recruitIdx];
        const cost = recruit.cost;

        // Recruiting costs food (the villager needs feeding to join)
        if ((this.resources.food || 0) < cost) {
            Game.notify(`Need ${cost} food to recruit!`, '#f00');
            return false;
        }

        this.resources.food = Math.max(0, this.resources.food - cost);
        this.villagers.push({
            name: recruit.name,
            job: 'Idle',
            productivity: recruit.productivity,
        });
        this.recruits.splice(recruitIdx, 1);
        Game.notify(`${recruit.name} joined your village!`, '#0f0');
        return true;
    }

    refreshRecruits() {
        this.recruits = [];
        const inn = this.getBuilding('inn');
        const slots = inn ? (BUILDING_DEFS.inn.recruitSlots[inn.level - 1] || 1) : 1;
        const usedNames = this.villagers.map(v => v.name);

        for (let i = 0; i < slots; i++) {
            const available = VILLAGER_NAMES.filter(n => !usedNames.includes(n) && !this.recruits.find(r => r.name === n));
            if (available.length === 0) break;
            const name = available[Math.floor(Math.random() * available.length)];
            this.recruits.push({
                name,
                cost: 5 + Math.floor(Math.random() * 10), // food cost to recruit
                productivity: 0.8 + Math.random() * 0.4,
            });
        }
    }

    updateProduction(dt) {
        this.productionTimer += dt;
        if (this.productionTimer < this.productionInterval) return;
        this.productionTimer = 0;

        // Check food consumption
        const foodNeeded = this.villagers.length;
        if (this.resources.food < foodNeeded && this.villagers.length > 0) {
            Game.notify('Your villagers are hungry!', '#f80');
        }
        this.resources.food = Math.max(0, this.resources.food - foodNeeded);

        // Production from buildings with assigned villagers
        for (const building of this.buildings) {
            const def = BUILDING_DEFS[building.type];
            if (!def.production || !building.villager) continue;

            const villager = this.villagers.find(v => v.name === building.villager);
            if (!villager) continue;

            const prod = def.production[building.level - 1];
            if (!prod) continue;

            for (const [res, amount] of Object.entries(prod)) {
                this.resources[res] = (this.resources[res] || 0) + Math.floor(amount * villager.productivity);
            }
        }
    }

    getDefenseRating() {
        let defense = 0;
        const barracks = this.getBuilding('barracks');
        const walls = this.getBuilding('walls');
        if (barracks) {
            const guardCount = this.villagers.filter(v => v.job === 'Guard').length;
            defense += (BUILDING_DEFS.barracks.defense[barracks.level - 1] || 0) * guardCount;
        }
        if (walls) {
            defense += BUILDING_DEFS.walls.defense[walls.level - 1] || 0;
        }
        return defense;
    }

    resolveRaid(floor) {
        const raidStrength = 5 + floor * 8 + Math.floor(Math.random() * floor * 5);
        const defense = this.getDefenseRating();
        const result = {
            raidStrength,
            defense,
            won: defense >= raidStrength,
            losses: {},
        };

        if (!result.won) {
            // Lose some resources
            const lossPercent = Math.min(0.3, (raidStrength - defense) / raidStrength);
            for (const [res, amount] of Object.entries(this.resources)) {
                const loss = Math.floor(amount * lossPercent);
                if (loss > 0) {
                    this.resources[res] -= loss;
                    result.losses[res] = loss;
                }
            }
            Game.notify('Your village was raided! Resources lost.', '#f44');
        } else {
            Game.notify('Raid repelled! Your defenses held!', '#0f0');
        }

        this.raidHistory.push(result);
        return result;
    }

    serialize() {
        return {
            resources: { ...this.resources },
            buildings: this.buildings.map(b => ({ ...b })),
            villagers: this.villagers.map(v => ({ ...v })),
            maxVillagers: this.maxVillagers,
            recruits: [...this.recruits],
        };
    }

    deserialize(data) {
        this.resources = data.resources || {};
        // Migrate old saves that have 'gold' in village resources → discard it
        delete this.resources.gold;
        this.buildings = data.buildings || this.buildings;
        this.villagers = data.villagers || this.villagers;
        this.maxVillagers = data.maxVillagers || this.maxVillagers;
        this.recruits = data.recruits || [];
    }
}
