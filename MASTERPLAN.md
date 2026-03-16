# MASTERPLAN v2 — DungeonTown

## 1. Current State Assessment

| System | Rating | Issue |
|--------|--------|-------|
| Combat feel | SOLID | Screenshake, hitstop, knockback, kill-FX, slash-arc all polished |
| Enemy AI (normal) | SOLID | 7 types with unique mechanics (block, charge, blink, breath, erratic) |
| Enemy AI (bosses) | NEEDS WORK | Phase system works but most bosses reuse generic chase AI. Only Orc Chief (slam), Cursed Knight (blink), Stone Golem (tremor) have unique phase attacks. 7 of 10 bosses are stat-checks with phases bolted on. |
| Arena system | SOLID | Sealed rooms, door mechanics, victory fanfare, boss loot drops |
| Dungeon generation | SOLID | BSP + terrain features (pillars, water, narrow corridors), intentional placement |
| Floor themes | NEEDS WORK | 5 visual themes but zero gameplay impact. No hazard tiles, no theme-specific enemies, no environmental mechanics |
| Floor events | NEEDS WORK | 5 event types at decent frequency, but all are simple yes/no prompts. No multi-step events, no risk/reward scaling with depth |
| Level-up picks | SOLID | 1-of-3 system works. Pool of 12 options is adequate for early game but needs depth for longer runs |
| Items & equipment | NEEDS WORK | Functional tiers but no synergies, no set bonuses, no unique effects beyond stats. Boss loot is stat-sticks. Weapon evolution is tier-up only |
| Abilities | NEEDS WORK | 3 abilities with CDR via level-up picks but no ability evolution, no new abilities unlockable, no synergy with equipment |
| Village (interactive) | NEEDS WORK | 4 of 17 buildings interactive. Smithy/Tavern/Temple/Warehouse work. 5 specialist shops defined but not wired. 8 production buildings feel disconnected |
| Town ↔ Dungeon link | NEEDS WORK | Barracks intel + Town Hall buffs + Weapon Evolution exist but are subtle. Player doesn't FEEL town upgrades changing their dungeon runs |
| Audio | NEEDS WORK | 20+ SFX, adaptive music. But skeleton block, demon blink, dragon breath have no dedicated SFX. Boss phase transitions need more audio identity |
| Early game (F1-3) | NEEDS WORK | Rats and bats require zero tactics. Optimal strategy is "walk at them, press Space." Strategic depth starts at Floor 3 (skeletons) |
| Mid-game (F10-25) | MISSING | After Floor 10, no new mechanics appear. Same enemies with bigger numbers. Themes change colors only. No environmental puzzles, traps, or new event types |
| Late-game (F25-50) | MISSING | Complete content vacuum. No unique mechanics, enemies, or progression hooks beyond stat scaling |

## 2. Vision Statement

DungeonTown is a 15-minute-run dungeon crawler where every death makes you stronger. The first run teaches combat. The fifth run teaches the first boss. The tenth run reveals a town that grew from your failures. By run twenty, your town unlocks dungeon capabilities you didn't know existed, and every floor feels different — not just harder, but mechanically distinct. It plays like Hades meets Moonlighter: tight real-time combat with learnable boss patterns, meaningful death-loop progression, and a home that evolves with you.

## 3. The First Five Minutes

**0:00–0:15** — Title → Village. Player spawns near town center. Dungeon entrance pulses purple. Buildings have visible level indicators. Player walks to entrance, presses E.

**0:15–0:45** — Floor 1. Compact map (50×30). First room: 3 rats behind a pillar. Player learns WASD+Space. Rats die in 2 hits — but one rat lunges from behind cover. Room clears → altar spawns: "Sacrifice 15 HP for +3 ATK?" First decision, 30 seconds in.

**0:45–1:30** — Floor 1-2. Bats dive-bomb in a straight line — player dodges or takes double damage. A water patch forces the player to reposition during a mixed group fight (rats + bat). Corridor enemy ambushes from a narrow chokepoint. Loot glows on the ground. Level-up → pick 1 of 3 upgrades.

**1:30–2:30** — Floor 2-3. Skeletons appear with rhythmic block cycles — player learns timing or uses Whirlwind (Q) to bypass. Orc charges with visible telegraph — player dashes (Shift) to dodge. Merchant offers a weapon upgrade. Fountain provides relief.

**2:30–3:30** — Floor 4. Tension ramps. More enemies per room. Elite orc (gold glow) appears — tougher, drops better loot. Player uses terrain (pillar cover, water to slow chasers). Finds a cursed chest: risk vs reward.

**3:30–5:00** — Floor 5: BOSS. Arena seals. "★ MINI BOSS ★" banner. Orc Chief has 3 phases: (1) charge attacks, (2) ground slam AoE at 66% HP, (3) faster charges at 33% HP. Player dies. Death screen: "+8 Soul Shards, Floor 5 Unlocked, Run Rating: C." Player thinks: "I almost had phase 3 — one more try."

**5:00+** — Village. Buys Blood Pact at Temple (2 HP per kill). Upgrades weapon at Smithy. Notices Barracks can be built — "Enemy Intel unlocked?" Enters dungeon at Floor 1 or Floor 5. The loop deepens.

## 4. Milestones

---

## MILESTONE 1: "Threat From Minute One"
Goal: Every floor from Floor 1 onward has at least one mechanic that forces the player to move, dodge, or think — not just hold Space.
Test: Player uses Dash at least once on Floor 1. Player repositions behind a pillar on Floor 2. No "just walk and attack" rooms.

### Change 1.1: Rat Pack Frenzy
- Files: `js/enemies.js`
- What: When 3+ rats are within 3 tiles of each other, all get +40% attack speed. Forces player to separate the pack or use AoE.
- How: In rat update logic, count nearby rats. If >= 3 within 3 tiles, multiply `attackSpeed` by 0.6. Visual: rats glow slightly red when frenzied.
- Why: Principle 1 — rats teach "don't let them group up" from the first room.

### Change 1.2: Bat Dive-Bomb
- Files: `js/enemies.js`
- What: When a bat is 3+ tiles away in a cardinal line, it telegraphs (0.5s red flash) then rushes straight at the player for 2× damage. Dodge-able with Dash or sidestep.
- How: In bat update, check if player is in straight line (dx===0 or dy===0) and distance >= 3. Set `telegraphing = true` for 0.5s, then rush at 0.04s move speed. On hit: 2× ATK damage.
- Why: Principle 1 — bats teach "dodge the telegraph" on Floor 1, making Dash essential from minute one.

### Change 1.3: Skeleton Rhythmic Block
- Files: `js/enemies.js`
- What: Replace random block (`Math.random() < 0.003`) with predictable cycle: 1.5s block → 1.5s open → repeat. Player learns the rhythm.
- How: Add `blockCycleTimer` to skeleton. Increment with dt. Block when timer < 1.5, open when timer >= 1.5. Reset at 3.0. Remove random block roll.
- Why: Principle 1 — skeletons teach "wait for the opening," not "spam and hope."

### Change 1.4: Missing Combat SFX
- Files: `js/audio.js`
- What: Add dedicated SFX for skeleton block (metallic clang), demon blink (whoosh+crackle), dragon breath (fire roar). Currently these key moments are silent or use wrong sounds.
- How: Add `_playBlockClang()`, `_playBlinkWhoosh()`, `_playBreathRoar()` using existing oscillator/noise patterns. Wire into `Audio.play()` switch.
- Why: Principle 6 — audio feedback makes mechanics readable.

---

## MILESTONE 2: "Worlds Apart"
Goal: Each 10-floor tier feels mechanically different, not just recolored. The player encounters new hazards and environmental mechanics as they descend.
Test: Player steps on a frost tile and slips. Player avoids lava. Player notices darkness limiting vision. Each theme changes HOW you play.

### Change 2.1: Theme Hazard Tiles
- Files: `js/dungeon.js`, `js/tileRenderer.js`, `js/scenes/dungeonScene.js`
- What: Each theme tier gets a hazard tile: Frost (ice — slide 2 tiles in move direction), Magma (lava — 10% maxHP damage per step), Abyss (void crack — FOV reduced to 3 tiles when nearby), Infernal (blight — poison DoT for 3s).
- How: Add `TILE.ICE=16`, `TILE.LAVA=17`, `TILE.VOID_CRACK=18`, `TILE.BLIGHT=19`. Place 2-4 per room on themed floors. Handle effects in dungeonScene player movement logic.
- Why: Principle 1 — terrain teaches through play, themes become mechanical not just visual.

### Change 2.2: Theme-Weighted Enemy Spawns
- Files: `js/dungeon.js`
- What: Each theme tier weights enemy types differently. Frost: more skeletons (undead cold). Magma: more demons. Abyss: more dragons. Infernal: mixed elites.
- How: In `placeEnemies()`, check floor theme. Apply weight multipliers to `EnemyTypes.getForFloor()` selection. E.g. Frost floors: skeleton weight ×3, orc weight ×0.5.
- Why: Principle 5 — depth from recombining existing enemies, not new types.

### Change 2.3: Environmental Event Variants
- Files: `js/events.js`
- What: Events adapt to theme. Frost fountain → frozen (break with attack, full heal). Magma shrine → burns you but gives 2× reward. Abyss merchant → sells cursed items (powerful but with drawback).
- How: In event resolution, check `TileRenderer._currentThemeKey`. Apply theme modifier to reward/cost. Add 1-2 themed variants per event type.
- Why: Principle 5 — existing events become new through context.

---

## MILESTONE 3: "The Living Town"
Goal: Every town building the player upgrades produces a visible, feelable change in their next dungeon run. Town is not a menu — it's a strategy layer.
Test: Player upgrades Barracks to Lv2 → sees enemy weaknesses in dungeon. Player builds Apothecary → finds better potions in dungeon. Player feels "I should upgrade X because it helps with Y."

### Change 3.1: Wire Specialist Shops
- Files: `js/village.js`, `js/scenes/villageScene.js`, `js/uiRenderer.js`
- What: Weaponsmith, Armorsmith, Jewelry, Pharmacy, Food Store become interactive buildings. Each sells category-filtered items at 20% discount vs Smithy.
- How: Add `interactPanel: 'specialist'` to each shop building in `village.js`. In `villageScene.js`, add `specialist` mode reusing smithy panel pattern. Filter inventory by `shopCategory`.
- Why: Principle 4 — more reasons to invest in town buildings.

### Change 3.2: Building→Dungeon Passive Bonuses
- Files: `js/village.js`, `js/scenes/dungeonScene.js`
- What: Each upgraded production building grants a passive dungeon bonus. Farm Lv2 → food drops from enemies (5%). Lumber Mill Lv2 → more chests per floor. Quarry Lv2 → pillars drop iron when broken. Apothecary Lv2 → potions heal 25% more.
- How: Check building levels at dungeon enter in `dungeonScene.enter()`. Apply modifiers to relevant systems. Store in `_townBonuses` object.
- Why: Principle 4 — every building upgrade feeds back into the dungeon loop.

### Change 3.3: Visual Town Growth
- Files: `js/scenes/villageScene.js`, `js/spriteRenderer.js`
- What: Buildings visually change at each level. Lv1: small structure. Lv2: larger, chimney smoke. Lv3: banner/flag, NPC activity. Player sees their progress.
- How: In villageScene render, check building level. Draw progressively larger/detailed procedural buildings. Add particle effects (smoke, sparkles) for upgraded buildings.
- Why: Principle 4 — the town is the emotional anchor. It must LOOK alive.

---

## MILESTONE 4: "Ability Mastery"
Goal: The 3 abilities evolve during a run based on player choices. By Floor 10, the player's Dash feels different from last run's Dash.
Test: Player picks "Dash leaves fire trail" and uses it to damage enemies. Player combines Whirlwind upgrade with equipment bonus for a unique build.

### Change 4.1: Ability Upgrade Picks
- Files: `js/player.js`, `js/abilities.js`
- What: Add 3 upgrade tiers per ability to the level-up pick pool. Dash: "Dash AoE" (damage enemies in path) / "Phase Dash" (through enemies) / "Dash Reset" (kill resets CD). Whirlwind: "Vortex" (pull enemies in) / "Storm" (2× radius) / "Leech Spin" (heal 1 HP per hit). Execute: "Chain Execute" (spreads to nearby low-HP enemy) / "Reaper" (threshold 35% instead of 25%) / "Soul Harvest" (+2 soul shards on execute kill).
- How: Add 9 new entries to `generateLevelUpPicks()` pool, gated by level 5+. Each modifies ability behavior via flags checked in `abilities.js` activation methods.
- Why: Principle 5 — deepen existing abilities instead of adding new ones.

### Change 4.2: Equipment-Ability Synergies
- Files: `js/items.js`, `js/abilities.js`
- What: Certain equipment pieces enhance abilities. "Swift Boots" → Dash travels 4 tiles instead of 3. "Flame Blade" → Whirlwind deals fire DoT. "Ruby Ring" → Execute threshold +5%.
- How: In ability activation, check player equipment for `abilityBonus` property. Apply modifiers. Add `abilityBonus` field to 4-5 existing items.
- Why: Principle 5 — items become build-defining, not just stat sticks.

---

## MILESTONE 5: "The Deep Dungeon"
Goal: Floors 15-50 introduce mechanics not seen in Floors 1-14. Every 10 floors feels like a new chapter.
Test: Player encounters a trap room on Floor 15. Player fights a boss with projectiles on Floor 20. Player discovers a secret room on Floor 25. Late-game feels worth pushing toward.

### Change 5.1: Trap Rooms (Floor 10+)
- Files: `js/dungeon.js`, `js/scenes/dungeonScene.js`
- What: 20% of rooms on Floor 10+ contain 1-2 floor traps (spike tile — triggers on step, 1s reset, deals 15% maxHP). Visible but requires awareness while fighting.
- How: Add `TILE.TRAP=20` and `TILE.TRAP_ACTIVE=21`. Place in rooms during generation. In dungeonScene update, check player position against trap tiles. Toggle trap state with timer.
- Why: Principle 1 — movement becomes critical in every room, not just boss arenas.

### Change 5.2: Ranged Enemy Type (Floor 12+)
- Files: `js/enemies.js`, `js/spriteRenderer.js`
- What: Imp enemy fires a slow-moving projectile (1 tile/0.3s) every 3s. Projectile is dodgeable. Teaches projectile avoidance before Stone Golem boss.
- How: Add `imp` type to EnemyTypes. In update, spawn projectile object (stored in `map.projectiles[]`). Projectile moves each 0.3s, damages player on contact, destroyed on wall hit. SpriteRenderer draws projectile as a glowing orb.
- Why: Principle 3 — introduces ranged dodging as a learnable mechanic before boss encounters need it.

### Change 5.3: Secret Rooms (Floor 8+)
- Files: `js/dungeon.js`, `js/tileRenderer.js`
- What: 30% chance per floor for a hidden room behind a cracked wall. Contains guaranteed chest + event. Cracked wall visible in FOV, breakable with attack.
- How: After BSP generation, select a room wall. Replace 1 wall tile with `TILE.CRACKED_WALL=22`. Behind it, carve a 4×4 room with chest + random event. Cracked wall is walkable after being hit (convert to FLOOR).
- Why: Principle 2 — exploration is rewarded, every run can surprise.

### Change 5.4: Boss Unique Mechanics
- Files: `js/enemies.js`
- What: Give remaining generic bosses (Dark Sorcerer, Lich, Inferno Drake, Pit Fiend, Shadow Dragon, Chaos Titan) unique phase attacks. Sorcerer: summon + teleport. Lich: life drain beam. Drake: breath cone. Titan: ground pound + shockwave ring.
- How: Add `bossType` and `phasePatterns` entries for each. Implement 1 unique mechanic per boss in update function, following Cursed Knight/Stone Golem pattern.
- Why: Principle 3 — every boss must be a learnable pattern encounter, not a stat check.

## 5. Implementation Order

### Milestone 1: Threat From Minute One (FIRST)
- Prerequisites: None. Modifies existing enemy behavior only.
- Playtest: Play Floor 1-3. Do rats feel dangerous when grouped? Do bat dive-bombs force dodging? Is skeleton block timing learnable? Do new SFX feel satisfying?
- Success: "I died on Floor 2 because I didn't dodge the bat dive-bomb — but now I know the tell."

### Milestone 2: Worlds Apart (SECOND)
- Prerequisites: Milestone 1 (early threats established, so theme hazards add to existing pressure).
- Playtest: Play Floor 1→15. Does each theme tier feel different? Do hazard tiles change positioning? Do themed events feel fresh?
- Success: "Frost floors are scary because I keep sliding into enemies. Magma floors make me plan my path."

### Milestone 3: The Living Town (THIRD)
- Prerequisites: Milestone 2 (themed dungeon content gives town upgrades more to unlock).
- Playtest: Upgrade 3 buildings. Enter dungeon. Can you identify what changed? Do specialist shops offer meaningful choices?
- Success: "I upgraded the Farm because food drops help me survive Magma floors."

### Milestone 4: Ability Mastery (FOURTH)
- Prerequisites: Milestone 1 (threats must exist for ability upgrades to matter), Milestone 3 (equipment synergies need item variety).
- Playtest: Do 3 runs with different ability upgrade picks. Does each run feel different? Do equipment synergies create "build moments"?
- Success: "Last run I went Dash AoE + Flame Blade. This run I'm trying Whirlwind Vortex + heal build."

### Milestone 5: The Deep Dungeon (FIFTH)
- Prerequisites: All previous milestones (deep dungeon needs variety from themes, abilities, and town upgrades to sustain interest).
- Playtest: Play to Floor 25+. Do trap rooms add tension? Does the Imp feel fair to fight? Are secret rooms exciting to find? Do all bosses have learnable patterns?
- Success: "I pushed to Floor 20 for the first time and the Stone Golem's tremor attack caught me off guard — but I know how to dodge it now."
