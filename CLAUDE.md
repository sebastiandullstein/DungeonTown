# DungeonTown — Claude Session Memory

## Project Overview
DungeonTown is a roguelike dungeon crawler with village management, built as an Electron desktop app.
- Canvas 2D rendering, no WebGL
- ~8,900 lines across 16 JS files in `js/`
- Single-player, localStorage saves

## Active Branch
`claude/review-progress-2F3lg` — always develop and push here.

## Key Files
| File | Purpose |
|------|---------|
| `js/spriteRenderer.js` | Player, enemy, item sprite drawing |
| `js/tileRenderer.js` | Floor/wall/hazard tile drawing |
| `js/uiRenderer.js` | All HUD, panels, minimap, spell icons |
| `js/scenes/dungeonScene.js` | Main dungeon game loop |
| `js/combat.js` | Attack resolution, floating text, particles |
| `js/enemies.js` | Enemy types, AI, loot |
| `js/player.js` | Player stats, equipment, movement |
| `js/audio.js` | Music/SFX management |
| `js/village.js` | Building definitions, villager management |

## Graphic Upgrade Plan (Mockup-Based)

### Mockup Target
Dark fantasy dungeon scene with:
- Textured stone/moss walls, shimmering lava chasm with stone bridge
- Hero in articulated steel armor with jagged dark iron greatsword
- Ice magic pulse aura around player; fire effects near lava
- Winged beholder enemy + skeleton warrior with rusted shield
- Ornate antique metal/leather UI border
- Textured gradient HP/MP/XP bars
- Combat Log panel (top-right) showing recent actions
- Detailed spell icons for abilities
- Parchment-style minimap with compass rose

### Phase Status

| Phase | Task | Status |
|-------|------|--------|
| 1 | Enhanced dungeon tiles (stone texture, lava, moss) | ✅ DONE |
| 2 | Per-weapon-name detailed icons (Dagger, Sword, Axe…) | ✅ DONE |
| 3 | Combat Log panel in top-right HUD | ⬜ TODO |
| 4 | Enemy sprites: winged beholder + skeleton warrior | ⬜ TODO |
| 5 | Detailed spell icons (Dash, Whirlwind, Execute) | ⬜ TODO |
| 6 | Parchment minimap with compass rose | ⬜ TODO |
| 7 | Player effects: ice magic pulse aura + fire near lava | ⬜ TODO |

### Implementation Notes
- Combat Log: add `combatLog` array to dungeon state, push entries on attack/cast, render in `uiRenderer.js` `drawHUD()` top-right ~160x200px panel
- Enemy sprites: `spriteRenderer.js` `drawEnemy()` — add cases for `enemy.type === 'beholder'` and `'skeleton'`
- Spell icons: `uiRenderer.js` `_drawAbilityBar()` — replace placeholder circles with per-ability canvas drawings
- Minimap: `uiRenderer.js` minimap section — add parchment bg gradient, compass rose, styled room outlines
- Player effects: `spriteRenderer.js` `drawPlayer()` — add ice aura ring (blue pulse) when MP > 50%, fire flicker near lava tiles

## Recent Commits
- `c8971a4` Improve sprite and tile rendering with detailed weapon icons and visual polish
- `e3a7e6b` Streamer moments: boss intros, death defied, desperate fury, loot fanfare
- `5190fcb` Strengthen Village↔Dungeon loops
- `e7a1783` Add Assist Mode
- `a8a1b69` Death storytelling system

## Conventions
- All canvas drawing uses `ctx.save()`/`ctx.restore()` around complex shapes
- Tile size is 32px
- Game canvas is 800×720 (576px dungeon viewport + 144px HUD at bottom)
- Colors: gold accent `#c8a030`, dark wood `#2e1e0c`, danger red `#b03030`, magic blue `#2848c0`
