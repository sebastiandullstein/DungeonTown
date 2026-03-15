# MASTERPLAN — DungeonTown

## 1. Current State Assessment

| System | Rating | Issue |
|--------|--------|-------|
| Combat feel | SOLID | Screenshake, hitstop, knockback, particles all polished |
| Enemy AI | NEEDS WORK | All enemies share 3-state AI. Type-specific attacks exist but bosses have no unique phases |
| Boss fights | NEEDS WORK | Bosses spawn in normal rooms, use normal AI, no arena, no phases, no telegraphs — pure stat checks |
| Dungeon generation | NEEDS WORK | All rooms are flat rectangles. No terrain features, no pillars, no chokepoints |
| Floor events | SOLID | 5 event types + room-clear altars (65%). Decent variety |
| In-run choices | NEEDS WORK | Level-up gives stat points (manual allocation) — no meaningful pick-1-of-3 moments |
| Items & equipment | SOLID | 6 slots, tiers, shop system works. No synergies or evolution yet |
| Abilities | NEEDS WORK | 3 abilities work well but have no upgrade path. Constants only |
| Village (4 interactive) | SOLID | Smithy/Tavern/Temple/Warehouse functional and polished |
| Village (13 production) | NEEDS WORK | Production buildings work but feel disconnected from dungeon. Specialist shops stubbed, not wired |
| Town ↔ Dungeon loop | NEEDS WORK | Gold/shards flow into village, but village upgrades don't unlock dungeon content |
| Audio | SOLID | 20+ SFX, adaptive music, boss warnings |
| Save/Load | SOLID | Full persistence including village state |

## 2. Vision Statement

DungeonTown is a 15-minute-run dungeon crawler where every death makes you stronger. You fight through increasingly dangerous floors, learn boss patterns through repeated attempts, and spend your spoils upgrading a town that unlocks new dungeon capabilities. The first run teaches you combat. The fifth run teaches you the first boss. The tenth run shows you a town that's grown because of your failures. It feels like Hades meets Moonlighter — tight combat, meaningful deaths, and a home worth returning to.

## 3. The First Five Minutes

**0:00–0:30** — Title → Village. Player sees 4 buildings around town hall. Dungeon entrance glows. Player walks to entrance, presses E.

**0:30–1:00** — Floor 1. Small map (50×30). 3-4 rats in first room. Player learns WASD + Space. Rats die in 2 hits. Room clears → altar appears: "Sacrifice 10 HP for +2 ATK?" First choice moment.

**1:00–1:30** — Floor 1 continued. Player finds a room with pillars — rats hide behind them, player must navigate around. Corridor leads to a mixed group: 2 rats + 1 bat. Bat dives, player dodges. Chest in corner drops a health potion.

**1:30–2:30** — Floor 2-3. Bats introduce dive-bomb mechanic. Skeletons appear on Floor 3 with visible block cycle. Player learns timing. A healing fountain provides relief. A blood shrine offers a tradeoff.

**2:30–3:30** — Floor 4. Tension builds. More enemies per room. Orc appears — charge telegraph forces dodge. Player uses Dash (Shift) to escape. Finds merchant with interesting gear.

**3:30–5:00** — Floor 5: BOSS. Screen shakes. "MINI BOSS" banner. Room seals shut. Orc Chief has 3 phases: (1) charge attacks with clear telegraph, (2) summons 2 rats at 66% HP, (3) enraged faster attacks at 33% HP. Player dies on first attempt. Death screen shows "+12 Soul Shards, Floor 5 Unlocked." Player thinks: "I almost had phase 3."

**5:00+** — Back in village. Player buys a blessing at the Temple. Upgrades weapon at Smithy. Re-enters dungeon at Floor 1 (or Floor 5 if unlocked). The loop begins.

## 4. Milestones

---

## MILESTONE 1: "The Arena"
Goal: Floor 5 boss is a multi-phase arena fight that feels like a Hades encounter.
Test: Player dies to Floor 5 boss at least once, then beats it on second/third try by learning the pattern. Victory feels earned.

### Change 1.1: Arena Room Generation
- Files: `js/dungeon.js`
- What: Boss floors generate a special arena room (12×10, centered) as the last room instead of a normal BSP room. Arena has 4 pillar tiles for cover.
- How: In `generate()`, detect boss floor. Replace last room with fixed-size arena. Place `TILE.WALL` pillars at symmetric positions. Add new `TILE.ARENA_WALL` (=14) that renders as reinforced wall.
- Why: Principle 3 — boss fights are events, not normal rooms.

### Change 1.2: Arena Sealing
- Files: `js/scenes/dungeonScene.js`, `js/dungeon.js`
- What: When player enters boss room, doors seal shut (become walls). After boss dies, doors reopen and stairs appear.
- How: Track `arenaSealed` state in dungeonScene. On player entering boss room bounds, set all `TILE.DOOR` adjacent to arena to `TILE.ARENA_WALL`. On boss death, revert + place `TILE.STAIRS_DOWN`.
- Why: Principle 3 — no running away. Commit to the fight.

### Change 1.3: Boss Phase System
- Files: `js/enemies.js`
- What: Boss enemies gain `phase` property (1/2/3). Phase transitions at 66% and 33% HP with visual flash + brief invulnerability.
- How: Add `bossPhase` field to enemy. In `updateEnemy()`, check HP thresholds. On phase change: set `phaseTransitionTimer = 1.0` (invuln + visual), update `attackPattern` property. Each boss type defines `phasePatterns[]` array.
- Why: Principle 3 — learnable phases, not random damage sponges.

### Change 1.4: Orc Chief Phase Patterns
- Files: `js/enemies.js`
- What: Floor 5 Orc Chief: Phase 1 = charge attack (existing). Phase 2 = charge + summon 2 rats. Phase 3 = faster charges (0.7s telegraph instead of 1.2s) + ground slam AoE (new).
- How: `phasePatterns` for orcChief: P1 uses existing charge. P2 adds `summonMinions(type, count)` on phase enter. P3 reduces `telegraphDuration` and adds `groundSlam` (damage all tiles adjacent to boss).
- Why: Principle 3 — each phase teaches a new mechanic.

### Change 1.5: Boss Phase Visuals
- Files: `js/spriteRenderer.js`, `js/combat.js`
- What: Phase transition: boss flashes white for 1s, shockwave particle ring expands outward, screen shake 8px. Ground slam: red tile flash on affected tiles for 0.5s before damage.
- How: In spriteRenderer, check `enemy.phaseTransitionTimer > 0` → draw white overlay. Add `drawGroundWarning(tiles, timer)` for slam telegraph. In combat.js, add shockwave particle burst (reuse whirlwind ring pattern).
- Why: Principle 6 — juice makes mechanics readable.

### Change 1.6: Victory Fanfare
- Files: `js/scenes/dungeonScene.js`, `js/audio.js`
- What: Boss death triggers: 0.5s hitstop, large particle explosion, "BOSS DEFEATED" banner (2s), unique loot drop, doors unseal.
- How: On boss kill detection in dungeonScene, set `bossVictoryTimer = 3.0`. During timer: show banner, play `bossDefeatJingle` (new SFX in audio.js — triumphant 4-note melody). Spawn guaranteed equipment drop (tier = floor/5 + 1).
- Why: Principle 3 — beating a boss must feel like an achievement.

---

## MILESTONE 2: "Dangerous Rooms"
Goal: Every room in Floors 1-5 requires the player to think about positioning, not just hold Space.
Test: Player uses pillars for cover, avoids water tiles, gets ambushed from corridors. Movement matters as much as attacking.

### Change 2.1: Terrain Features in Rooms
- Files: `js/dungeon.js`, `js/tileRenderer.js`
- What: Rooms randomly contain pillars (block movement + LOS) and water patches (slow movement 2×). Creates tactical cover and chokepoints.
- How: After room generation, 40% of rooms get 1-3 `TILE.PILLAR` (=15) at random interior positions. 25% get a `TILE.WATER` patch (2-4 connected tiles). Pillar blocks `isWalkable` + `isTransparent`. Water is walkable but doubles move delay.
- Why: Principle 1 — terrain teaches positioning without text.

### Change 2.2: Intentional Enemy Placement
- Files: `js/dungeon.js`
- What: Instead of random scatter, enemies placed relative to terrain: behind pillars (ambush), near water (force player to navigate), guarding chests/events.
- How: In `placeEnemies()`, for rooms with pillars: place 1 enemy adjacent to pillar (starts idle, hidden by LOS block). For rooms with chests: place 1-2 enemies within 3 tiles of chest.
- Why: Principle 1 — enemy placement IS level design.

### Change 2.3: Mixed Enemy Groups
- Files: `js/dungeon.js`
- What: From Floor 3+, rooms contain mixed enemy types (e.g., skeleton + rats). Forces player to prioritize targets.
- How: In `placeEnemies()`, when floor >= 3 and room has 3+ enemies: replace 1 with next-tier type. E.g., floor 3: 2 rats + 1 skeleton. Floor 5+: 2 skeletons + 1 orc.
- Why: Principle 5 — depth from combining existing enemies, not new ones.

### Change 2.4: Narrow Corridor Chokepoints
- Files: `js/dungeon.js`
- What: Some corridors are 1-tile wide (current: all 2-tile). Creates natural chokepoints where player fights 1v1.
- How: In corridor generation, 50% chance to use width=1 instead of width=2. Place corridor enemy at narrowest point.
- Why: Principle 1 — corridor shape changes combat dynamics.

---

## MILESTONE 3: "Choices Every Minute"
Goal: Player makes a meaningful decision every 60-90 seconds during a run.
Test: In a 3-minute run through Floors 1-5, player encounters at least 3 distinct choice moments (altar, event, or level-up pick).

### Change 3.1: Level-Up Upgrade Picks
- Files: `js/player.js`, `js/scenes/dungeonScene.js`, `js/uiRenderer.js`
- What: On level-up, player picks 1 of 3 random upgrades instead of getting raw stat points. Examples: "+3 ATK this run", "Heal 30% HP", "+1 potion slot", "Dash cooldown -1s".
- How: Define `LEVEL_UP_OPTIONS[]` in player.js (12-15 options, mix of permanent stats and run-scoped buffs). On level-up, dungeonScene enters `levelUpChoice` mode. UIRenderer draws 3-card pick panel. Player selects with W/S + Enter.
- Why: Principle 5 — replaces passive stat allocation with active decision-making.

### Change 3.2: Increase Altar Frequency
- Files: `js/scenes/dungeonScene.js`
- What: Room-clear altars increase from 65% to 80% chance. Altar options become more impactful.
- How: Change `ALTAR_CHANCE` from 0.65 to 0.80. Add 3 new altar options: "Double gold from next floor", "Next ability costs 0 mana", "Reveal all enemies on this floor".
- Why: Principle 5 — more decision density without new systems.

### Change 3.3: Floor Merchant Guaranteed on Floor 3+
- Files: `js/events.js`, `js/dungeon.js`
- What: Every floor 3+ has at least one merchant event. Merchant inventory includes 1 ability-enhancing item.
- How: In event placement, force merchant on floors >= 3 if none rolled. Add `abilityRune` item type to items.js — single-use consumable that enhances next ability use (double damage, no cooldown, extended range).
- Why: Principle 3 — merchants create resource-management decisions (save gold vs buy now).

---

## MILESTONE 4: "The Town Remembers"
Goal: Every town upgrade visibly changes what happens in the dungeon. The player sees the connection.
Test: Player upgrades Smithy to Lv2, enters dungeon, and notices weapon evolution is now possible. Upgrades Barracks, and enemy HP bars show weakness icons.

### Change 4.1: Smithy Unlocks Weapon Evolution
- Files: `js/village.js`, `js/scenes/villageScene.js`, `js/items.js`
- What: Smithy Lv2 enables "Evolve" tab — combine weapon + 10 iron + gold to create upgraded version with bonus effect (lifesteal, fire damage, etc).
- How: Add evolution recipes to items.js. Smithy upgrade tab (existing tab 2) checks `village.buildings.smithy.level >= 2`. Evolution creates new item with `bonusEffect` property checked in combat.js damage calc.
- Why: Principle 4 — town investment creates dungeon power.

### Change 4.2: Barracks Shows Enemy Intel
- Files: `js/village.js`, `js/spriteRenderer.js`
- What: Barracks Lv1 → enemy HP bars visible at range. Barracks Lv2 → weakness icons shown (e.g., skeleton weak to blunt, demon weak to holy).
- How: Check `Game.state.village.buildings.barracks?.level` in spriteRenderer when drawing enemy HP bars. Lv1: show HP bar at 8-tile range (currently only close range). Lv2: draw small weakness icon above HP bar.
- Why: Principle 4 — town knowledge helps dungeon runs.

### Change 4.3: Town Hall Unlocks Floor Themes
- Files: `js/village.js`, `js/dungeon.js`, `js/tileRenderer.js`
- What: Town Hall Lv2 → Floors 10+ get "Crypt" theme (skeleton-heavy, darker, trap tiles). Town Hall Lv3 → Floors 20+ get "Inferno" theme (demon-heavy, lava hazard tiles).
- How: Check town hall level in dungeon.js `generate()`. Theme affects: enemy type weights, tile palette (tileRenderer), and adds theme-specific hazard tile (damage on step).
- Why: Principle 4 — town progression reveals new dungeon content.

### Change 4.4: Wire Specialist Shops
- Files: `js/scenes/villageScene.js`, `js/uiRenderer.js`
- What: Weaponsmith/Armorsmith/Jewelry/Pharmacy/Foodstore become interactive (like Smithy). Each sells category-specific items at better prices than Smithy.
- How: Reuse smithy panel pattern. Each specialist shop gets `interactPanel: 'specialist'` with `shopCategory` filter. UIRenderer draws same panel template with filtered inventory.
- Why: Principle 4 — more reasons to invest in village buildings.

---

## MILESTONE 5: "More to Fight"
Goal: Floors 10-25 feel distinct from Floors 1-9. Two more bosses have full arena fights.
Test: Player encounters new enemy variants, themed floors, and 2 more pattern-based boss fights.

### Change 5.1: Elite Enemy Variants
- Files: `js/enemies.js`, `js/spriteRenderer.js`
- What: From Floor 8+, 15% of enemies spawn as "Elite" — glowing aura, +50% stats, one extra ability (e.g., Elite Skeleton has counter-attack on block, Elite Orc has shockwave on charge miss).
- How: Add `isElite` flag. In `createEnemy()`, roll 15% on floors 8+. Multiply base stats × 1.5. Add elite-specific behavior in type update functions. SpriteRenderer draws pulsing glow.
- Why: Principle 5 — depth from existing enemies, not new types.

### Change 5.2: Floor 10 Boss — Cursed Knight
- Files: `js/enemies.js`
- What: Cursed Knight phases: P1 = sword combo (3-hit, telegraphed). P2 = shield bash (pushes player, stuns 0.5s) + summon 1 skeleton. P3 = cursed aura (periodic damage to adjacent tiles).
- How: Add `phasePatterns` for cursedKnight following Milestone 1 pattern. Reuse arena system from Change 1.1.
- Why: Principle 3 — each boss teaches new mechanics.

### Change 5.3: Floor 15 Boss — Stone Golem
- Files: `js/enemies.js`
- What: Stone Golem phases: P1 = slow ground slam (2-tile AoE, 1.5s telegraph). P2 = rock throw (projectile, new mechanic). P3 = crumble (splits into 2 mini-golems at 33% HP).
- How: Add projectile system to enemies.js (simple: spawn object at boss, move toward target tile, damage on arrival). Mini-golem = reduced-stat copy.
- Why: Principle 3 — first projectile dodge, memorable split mechanic.

### Change 5.4: Unique Boss Loot
- Files: `js/items.js`, `js/enemies.js`
- What: Each boss drops a unique item not available elsewhere. Orc Chief → "Chief's Tusk" (ring, +3 ATK, charge resistance). Cursed Knight → "Cursed Blade" (weapon, lifesteal 5%).
- How: Add `bossLoot` table in items.js mapping boss type → unique item template. On boss kill, create and drop this item instead of random tier loot.
- Why: Principle 2 — every boss kill leaves a permanent mark.

## 5. Implementation Order

### Milestone 1: The Arena (FIRST)
- Prerequisites: None. Uses existing enemy/combat systems.
- Playtest: Enter Floor 5. Does the arena seal? Does the boss have 3 distinct phases? Can you learn and dodge each phase? Does victory feel earned?
- Success: "The Floor 5 boss killed me, but I know what I did wrong and I want to try again."

### Milestone 2: Dangerous Rooms (SECOND)
- Prerequisites: Milestone 1 (arena room generation pattern reused for terrain).
- Playtest: Play Floors 1-4. Do pillars change how you fight? Does water slow you? Do mixed groups force target priority? Do corridors create chokepoints?
- Success: "I had to think about WHERE to fight, not just WHEN to attack."

### Milestone 3: Choices Every Minute (THIRD)
- Prerequisites: Milestone 2 (terrain makes altars more tactical — altar behind pillar, etc).
- Playtest: Time a run. Count decisions. Are there 3+ meaningful choices in 3 minutes? Does the level-up pick feel impactful?
- Success: "I want to replay because I want to try different upgrade picks."

### Milestone 4: The Town Remembers (FOURTH)
- Prerequisites: Milestone 1 (boss loot feeds back to town economy), Milestone 3 (more items to evolve).
- Playtest: Upgrade Smithy to Lv2. Can you evolve a weapon? Does it feel stronger? Do Barracks intel icons help in dungeon?
- Success: "I'm upgrading town buildings because they make my dungeon runs better."

### Milestone 5: More to Fight (FIFTH)
- Prerequisites: Milestone 1 (arena system), Milestone 2 (terrain system), Milestone 4 (themed floors).
- Playtest: Play Floors 8-15. Do elites feel threatening? Do Floor 10/15 bosses have distinct patterns? Is unique boss loot exciting?
- Success: "I want to push deeper to see what the next boss does."
