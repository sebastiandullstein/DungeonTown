// Shop Scene - buy/sell items from village buildings
const ShopScene = {
    buildingType: null,
    items: [],
    selectedIndex: 0,
    mode: 'buy', // buy, sell
    sellItems: [],

    init() {},

    enter(data) {
        this.buildingType = data ? data.buildingType : 'blacksmith';
        this.selectedIndex = 0;
        this.mode = 'buy';
        this.refreshShopItems();
    },

    exit() {},

    refreshShopItems() {
        const village = Game.state.village;
        const building = village.getBuilding(this.buildingType);
        const def = BUILDING_DEFS[this.buildingType];
        if (!building || !def.isShop) {
            this.items = [];
            return;
        }

        const maxTier = def.shopTier ? def.shopTier[building.level - 1] : building.level;
        this.items = [];

        for (const category of def.shopCategories || []) {
            const shopItems = ItemGenerator.getShopItems(category, maxTier);
            this.items.push(...shopItems);
        }
    },

    update(dt) {
        if (Input.wasPressed('Escape')) {
            Game.switchScene('village');
            return;
        }

        if (Input.wasPressed('Tab')) {
            this.mode = this.mode === 'buy' ? 'sell' : 'buy';
            this.selectedIndex = 0;
            if (this.mode === 'sell') {
                this.sellItems = Game.state.player.inventory.filter(i => i.value > 0);
            }
        }

        const list = this.mode === 'buy' ? this.items : this.sellItems;
        const maxIdx = Math.max(0, list.length - 1);
        this.selectedIndex = Math.min(this.selectedIndex, maxIdx);

        if (Input.wasPressed('ArrowUp') || Input.wasPressed('w') || Input.wasPressed('W')) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        }
        if (Input.wasPressed('ArrowDown') || Input.wasPressed('s') || Input.wasPressed('S')) {
            this.selectedIndex = Math.min(maxIdx, this.selectedIndex + 1);
        }

        if (Input.wasPressed('Enter') || Input.wasPressed(' ')) {
            if (this.mode === 'buy') {
                this.buyItem();
            } else {
                this.sellItem();
            }
        }
    },

    buyItem() {
        const item = this.items[this.selectedIndex];
        if (!item) return;

        const player = Game.state.player;
        // Shops are paid from player's personal gold (earned in dungeons)
        if ((player.gold || 0) < item.value) {
            Game.notify('Not enough gold! Loot more dungeons.', '#f00');
            return;
        }

        if (player.inventory.length >= player.maxInventory) {
            Game.notify('Inventory full!', '#f00');
            return;
        }

        // Create a new copy
        const bought = ItemGenerator.createItem(
            { ...item, name: item.name },
            this.getCategoryForItem(item)
        );
        player.gold -= item.value;
        player.addToInventory(bought);
        Game.notify(`Bought ${item.name} for ${item.value} gold`, '#0f0');
    },

    sellItem() {
        const item = this.sellItems[this.selectedIndex];
        if (!item) return;

        const player = Game.state.player;
        const sellPrice = Math.floor(item.value * 0.5);

        const idx = player.inventory.indexOf(item);
        if (idx >= 0) {
            player.inventory.splice(idx, 1);
            player.gold = (player.gold || 0) + sellPrice;
            Game.notify(`Sold ${item.name} for ${sellPrice} gold`, '#ff0');
            this.sellItems = player.inventory.filter(i => i.value > 0);
            this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, this.sellItems.length - 1));
        }
    },

    getCategoryForItem(item) {
        if (item.slot === 'weapon') return 'weapons';
        if (item.slot === 'armor') return 'armors';
        if (item.slot === 'helmet') return 'helmets';
        if (item.slot === 'boots') return 'boots';
        if (item.slot === 'ring') return 'rings';
        if (item.slot === 'amulet') return 'amulets';
        if (item.type === 'potion') return 'potions';
        if (item.type === 'food') return 'food';
        return 'weapons';
    },

    render(r) {
        const def = BUILDING_DEFS[this.buildingType];
        const building = Game.state.village.getBuilding(this.buildingType);
        r.drawShopPanel({
            buildingType: this.buildingType,
            building,
            def,
            items: this.items,
            sellItems: this.sellItems,
            selectedIndex: this.selectedIndex,
            mode: this.mode,
            gold: Game.state.player.gold || 0,
        });
    },
};
