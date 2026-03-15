// Item System - definitions and generation
const ItemDB = {
    weapons: [
        { name: 'Dagger', stats: { atk: 2 }, tier: 0, char: '-', fg: '#aaa', value: 5 },
        { name: 'Short Sword', stats: { atk: 4 }, tier: 1, char: '/', fg: '#bbb', value: 15 },
        { name: 'Longsword', stats: { atk: 7 }, tier: 2, char: '/', fg: '#ddd', value: 40 },
        { name: 'Battle Axe', stats: { atk: 10 }, tier: 3, char: 'P', fg: '#c88', value: 120 },
        { name: 'War Hammer', stats: { atk: 13 }, tier: 4, char: 'T', fg: '#88c', value: 200 },
        { name: 'Flame Blade', stats: { atk: 17 }, tier: 5, char: '/', fg: '#f80', value: 350 },
        { name: 'Frost Edge', stats: { atk: 20 }, tier: 6, char: '/', fg: '#4cf', value: 500 },
        { name: 'Doom Sword', stats: { atk: 25 }, tier: 7, char: '/', fg: '#f0f', value: 800 },
    ],
    armors: [
        { name: 'Cloth Shirt', stats: { def: 1 }, tier: 0, char: '[', fg: '#886', value: 5 },
        { name: 'Leather Armor', stats: { def: 3 }, tier: 1, char: '[', fg: '#a84', value: 18 },
        { name: 'Chain Mail', stats: { def: 5 }, tier: 2, char: '[', fg: '#aaa', value: 50 },
        { name: 'Plate Armor', stats: { def: 8 }, tier: 3, char: '[', fg: '#ccc', value: 150 },
        { name: 'Dragon Scale', stats: { def: 12 }, tier: 4, char: '[', fg: '#4a4', value: 300 },
        { name: 'Mythril Mail', stats: { def: 16 }, tier: 5, char: '[', fg: '#4cf', value: 500 },
    ],
    helmets: [
        { name: 'Cap', stats: { def: 1 }, tier: 0, char: '^', fg: '#886', value: 4 },
        { name: 'Iron Helm', stats: { def: 2 }, tier: 1, char: '^', fg: '#aaa', value: 15 },
        { name: 'Steel Helm', stats: { def: 4 }, tier: 2, char: '^', fg: '#ccc', value: 60 },
        { name: 'Knight Helm', stats: { def: 6 }, tier: 3, char: '^', fg: '#ddd', value: 120 },
    ],
    boots: [
        { name: 'Sandals', stats: { def: 0, dex: 1 }, tier: 0, char: '!', fg: '#a84', value: 8 },
        { name: 'Leather Boots', stats: { def: 1, dex: 1 }, tier: 1, char: '!', fg: '#864', value: 20 },
        { name: 'Iron Boots', stats: { def: 3 }, tier: 2, char: '!', fg: '#aaa', value: 50 },
        { name: 'Swift Boots', stats: { def: 2, dex: 3 }, tier: 3, char: '!', fg: '#4cf', value: 100 },
    ],
    rings: [
        { name: 'Iron Ring', stats: { atk: 1 }, tier: 0, char: 'o', fg: '#aaa', value: 15 },
        { name: 'Ruby Ring', stats: { atk: 3 }, tier: 1, char: 'o', fg: '#f44', value: 50 },
        { name: 'Diamond Ring', stats: { atk: 5, def: 2 }, tier: 2, char: 'o', fg: '#4ff', value: 150 },
    ],
    amulets: [
        { name: 'Wooden Charm', stats: { hp: 10 }, tier: 0, char: '"', fg: '#a84', value: 12 },
        { name: 'Silver Amulet', stats: { hp: 20, def: 1 }, tier: 1, char: '"', fg: '#ccc', value: 40 },
        { name: 'Golden Amulet', stats: { hp: 35, def: 2 }, tier: 2, char: '"', fg: '#ff0', value: 120 },
    ],
    potions: [
        { name: 'Small Health Potion', subtype: 'health', stats: { heal: 20 }, tier: 0, char: '!', fg: '#f44', value: 8 },
        { name: 'Health Potion', subtype: 'health', stats: { heal: 50 }, tier: 1, char: '!', fg: '#f00', value: 20 },
        { name: 'Large Health Potion', subtype: 'health', stats: { heal: 100 }, tier: 2, char: '!', fg: '#d00', value: 45 },
        { name: 'Full Restore Potion', subtype: 'health', stats: { heal: 250 }, tier: 4, char: '!', fg: '#f88', value: 110 },
        { name: 'Small Mana Potion', subtype: 'mana', stats: { mana: 15 }, tier: 0, char: '!', fg: '#44f', value: 10 },
        { name: 'Mana Potion', subtype: 'mana', stats: { mana: 35 }, tier: 1, char: '!', fg: '#00f', value: 25 },
        { name: 'Grand Mana Potion', subtype: 'mana', stats: { mana: 80 }, tier: 3, char: '!', fg: '#44c', value: 65 },
    ],
    food: [
        { name: 'Roasted Meat', subtype: 'food_str', stats: { buffStr: 2, buffDuration: 60 }, tier: 0, char: '%', fg: '#f84', value: 12,
          description: 'Eat for +2 STR for 60s' },
        { name: 'Herb Stew', subtype: 'food_vit', stats: { buffVit: 2, buffDuration: 60 }, tier: 0, char: '%', fg: '#8f4', value: 12,
          description: 'Eat for +2 VIT for 60s' },
        { name: 'Mage Bread', subtype: 'food_int', stats: { buffInt: 2, buffDuration: 60 }, tier: 1, char: '%', fg: '#4af', value: 18,
          description: 'Eat for +2 INT for 60s' },
        { name: 'Warrior\'s Feast', subtype: 'food_str', stats: { buffStr: 5, buffDuration: 120 }, tier: 2, char: '%', fg: '#fa2', value: 35,
          description: 'Eat for +5 STR for 120s' },
        { name: 'Druid\'s Salad', subtype: 'food_vit', stats: { buffVit: 5, buffDuration: 120 }, tier: 2, char: '%', fg: '#4f8', value: 35,
          description: 'Eat for +5 VIT for 120s' },
        { name: 'Arcane Cake', subtype: 'food_int', stats: { buffInt: 5, buffDuration: 120 }, tier: 3, char: '%', fg: '#c4f', value: 55,
          description: 'Eat for +5 INT for 120s' },
    ],
};

const SLOT_MAP = {
    weapons: 'weapon',
    armors: 'armor',
    helmets: 'helmet',
    boots: 'boots',
    rings: 'ring',
    amulets: 'amulet',
    potions: 'potion',
    food: 'food',
};

let nextItemId = 1;

const ItemGenerator = {
    // Dungeon floor loot: potions only (gear is vendor-exclusive)
    generateDungeonLoot(floor) {
        return this.generatePotion(Math.min(4, Math.floor(floor / 3)));
    },

    // Chest loot: small gold bonus + potions (no gear)
    generateChestLoot(floor) {
        // 60% potion, 40% nothing extra (just gold handled by dungeon.js)
        if (Math.random() < 0.6) {
            return this.generatePotion(Math.min(4, Math.floor(floor / 2)));
        }
        return null;
    },

    generatePotion(tier) {
        const potions = ItemDB.potions.filter(p => p.tier <= tier);
        const template = potions[Math.floor(Math.random() * potions.length)] || ItemDB.potions[0];
        return this.createItem(template, 'potions');
    },

    createItem(template, category) {
        const slot = SLOT_MAP[category];
        const isConsumable = slot === 'potion' || slot === 'food';
        return {
            id: `item_${nextItemId++}`,
            name: template.name,
            type: isConsumable ? (slot === 'food' ? 'food' : 'potion') : 'equipment',
            subtype: template.subtype || null,
            slot: isConsumable ? null : slot,
            tier: template.tier,
            stats: { ...template.stats },
            char: template.char,
            fg: template.fg,
            value: template.value,
            description: template.description || this.getDescription(template, slot),
        };
    },

    getDescription(template, slot) {
        const parts = [];
        if (template.stats.atk) parts.push(`ATK +${template.stats.atk}`);
        if (template.stats.def) parts.push(`DEF +${template.stats.def}`);
        if (template.stats.hp) parts.push(`HP +${template.stats.hp}`);
        if (template.stats.dex) parts.push(`DEX +${template.stats.dex}`);
        if (template.stats.heal) parts.push(`Heals ${template.stats.heal} HP`);
        if (template.stats.mana) parts.push(`Restores ${template.stats.mana} MP`);
        return parts.join(', ');
    },

    getShopItems(category, maxTier) {
        const items = ItemDB[category];
        if (!items) return [];
        return items.filter(i => i.tier <= maxTier).map(t => this.createItem(t, category));
    },
};
