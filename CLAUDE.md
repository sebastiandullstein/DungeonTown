# CLAUDE.md — DungeonTown

Projektinformationen für Claude-Sessions. Hier sind die wichtigsten Fakten über Architektur, Konventionen und Systemstand dokumentiert.

---

## Architekturübersicht

### Technologie-Stack
- **Vanilla JS (ES6+)**, HTML5 Canvas, plain CSS — kein Bundler, kein Framework
- **Electron 33+** als Desktop-Wrapper (Frameless Window, 1280×720)
- `electron-builder` für Packaging (win/mac/linux)
- Scripts werden per `<script>`-Tags in `index.html` geladen — **Ladereihenfolge ist kritisch**

### Canvas & Rendering
- Spielfläche: **800×720 px** (25×18 Tile-Viewport à 32 px + 144 px HUD)
- **3-Layer-Rendering**: Tile-Layer → Entity-Layer → UI-Layer (komposit auf Main-Canvas)
- `renderer.time` — globale Animationsuhr, inkrementiert per `tick(dt)`, läuft effektiv mit 8 FPS

### Szenen-System
```
Title → Village ←→ Dungeon
                ↘ Shop (als Overlay)
```
- Szenen sind globale Objekte mit `init()`, `enter(data)`, `update(dt)`, `render()`, `exit()`
- `Game.switchScene(name, data)` — wechselt Szene, ruft `exit()` → `enter()` auf
- `Game.state` — globaler Zustand (player, village, currentFloor, maxFloorReached, usw.)

### Script-Ladereihenfolge (`index.html`)
```
assetLoader → manifest
→ tileRenderer → spriteRenderer → uiRenderer → renderer → input → audio
→ items → player → abilities → enemies → combat
→ dungeon → events → village
→ ui
→ scenes/titleScene → scenes/villageScene → scenes/dungeonScene → scenes/shopScene
→ game.js  (muss zuletzt geladen werden)
```

### Globale Singletons
| Name | Beschreibung |
|---|---|
| `Game` | Hauptcontroller, Szenenmanager, Save/Load |
| `Input` | Keyboard & Mouse |
| `Assets` | Sprite/Image-Loader, Atlas-Regionen, Sprite-First-Fallback |
| `Audio` | Web Audio API, prozedurales SFX + Musik |
| `Abilities` | Dash / Whirlwind / Execute |
| `Combat` | Schadensberechnung, Floating Text, Partikel |
| `UI` | Inventar- und Charakterbogen-Panel |
| `AnimManager` | Sprite-Animations-Ticker (steht vor `SpriteRenderer` in spriteRenderer.js) |

### Persistenz
- Save-Key: `dungeontown_save` in `localStorage`
- Migration von altem Key `roguevillage_save` erfolgt automatisch in `Game.init()`
- `player.serialize()` / `player.deserialize()` decken alle Felder ab inkl. soulShards, blessings, tavernBuffs

---

## Arbeitsregeln

### Oberstes Prinzip: Weniger Code, mehr Spielgefühl
- **Jede Session ein spielbares Ziel** — nicht "implementiere Feature X" sondern "nach dieser Session soll sich Y anders anfühlen". Messbar am Spielerlebnis, nicht an Lines of Code.
- **Erst lesen, dann schreiben** — Vor jeder Änderung den betroffenen Rendering-/Logik-Flow komplett lesen. Kein Code bevor der Flow verstanden ist. (Lehre aus dem Stairs-Bug: 6 Commits statt 1, weil der Atlas-Fallback nicht gelesen wurde.)
- **Spieler-testet-Schleife bevorzugen** — Lieber 1 Änderung → User testet → Feedback → nächste Änderung, statt 5 Features blind auf einmal zu bauen.
- **Kill-Liste vor Feature-Liste** — Immer zuerst fragen: Was können wir *entfernen* oder *vereinfachen*? Weniger Code ist oft die bessere Antwort.
- **Kein Feature ohne spürbaren Spieler-Impact** — Wenn ein Feature beim Spielen nicht auffällt, ist es Code-Bloat. Tracking-Systeme, Statistiken und Metriken nur wenn sie das Spielerlebnis direkt verbessern.
- **Scope pro Session begrenzen** — Maximal 1 zusammenhängendes Ziel pro Session. "Full Phase 1 + Merge" war zu breit; lieber eine Sache richtig.

### Wann planen, wann direkt implementieren?
- **Direkt implementieren** — Bugfixes, einzelne neue Features, Änderungen innerhalb einer Datei, Anpassungen an bestehenden Systemen
- **Erst planen (EnterPlanMode)** — neue Systeme mit mehreren Dateien, Änderungen an der Szenen- oder Rendering-Architektur, alles das `game.js`, `renderer.js` oder die Script-Ladereihenfolge betrifft

### Rückfragen-Policy
- Grundsätzlich autonom arbeiten und selbst entscheiden
- Bei mehreren gleichwertigen Lösungswegen kurz nachfragen statt zu raten
- Im Zweifel lieber machen als fragen — Fehler sind leichter zu korrigieren als Stillstand
- **Bei Session-Start den User fragen: "Was stört oder fehlt beim Spielen am meisten?"** — das definiert das Session-Ziel

### Commit-Rhythmus
- Nach jedem abgeschlossenen Feature oder Bugfix automatisch committen
- Commit-Message auf Englisch, kurz und aussagekräftig

### Sprache
- Konversation: Deutsch oder Englisch (je nach User)
- Code-Kommentare: Englisch
- Commit-Messages: Englisch
- CLAUDE.md / Dokumentation: Deutsch

### Session-Start
- Bei Sessionbeginn kurz `git log --oneline -5` prüfen um den letzten Stand zu kennen
- CLAUDE.md wird automatisch geladen — nicht nochmal lesen

### Änderungen an fragilen Bereichen
Vor Änderungen an den folgenden Bereichen immer erst lesen und verstehen, nicht blind editieren:
- **Script-Ladereihenfolge** (`index.html`) — Abhängigkeiten sind implizit, Fehler äußern sich als stille `undefined`-Fehler
- **`spriteRenderer.js` / `uiRenderer.js`** — große Monolithe, Seiteneffekte leicht möglich
- **`dungeonScene.js`-Modi** — viele verzweigte Zustände (play/floorSelect/escapeConfirm/…), leicht zu übersehen welcher aktiv ist
- **`events.js`** — setzt `TILE` aus `dungeon.js` voraus; muss nach `dungeon.js` geladen werden

### Don'ts
- Keine neuen Dateien anlegen wenn die Logik in eine bestehende passt
- Nie `spriteRenderer.js` oder `uiRenderer.js` aufteilen
- Nie Stat-Werte direkt summieren — immer die Getter (`getAtk()`, `getDef()`, …) verwenden
- Keine `import`/`export`-Statements — alles bleibt im globalen Scope
- Kein Over-Engineering: keine Abstraktion für einmalige Operationen, keine Features die nicht angefragt wurden

---

## Bekannte Limitierungen & Tech-Debt

- **Kein Bundler / kein Modul-System** — globaler Scope für alles; Namenskollisionen sind möglich, werden aber nicht geprüft
- **`spriteRenderer.js` und `uiRenderer.js`** sind bewusst nicht aufgeteilt, aber schwer zu navigieren; Änderungen dort erfordern Sorgfalt
- **VillageScene-Modi** sind nicht als State-Machine modelliert — Modusübergänge passieren per direkter Zuweisung, leicht zu vergessen Reset-Logik hinzuzufügen
- **Kein Fehler-Logging** — Laufzeitfehler verschwinden in der Electron-Konsole; beim Testen immer DevTools offen halten (`Ctrl+Shift+I`)
- **Save-Format ist nicht versioniert** — bei Änderungen an `player.serialize()` kann ein alter Save abstürzen; defensiv deserialisieren mit Fallback-Werten
- **Audio-Kontext** startet erst nach erstem User-Interaction (Browser-Autoplay-Policy) — kein Bug, aber beim Testen beachten

---

## Coding-Konventionen

### Allgemein
- **Kein Bundler** — kein `import`/`export`, alle Dateien landen im globalen Scope
- Klassen (`Player`, `DungeonMap`, `Enemy`, …) werden normal instanziiert; Singletons sind `const`-Objekte mit Methoden
- `const` für Singletons und Konfigurationsobjekte, `let` für veränderliche Variablen
- Keine TypeScript, keine Linter-Konfiguration — halte dich an den Stil der vorhandenen Dateien

### Dateistruktur
- Jede Datei hat genau eine klar abgegrenzte Verantwortung
- `spriteRenderer.js` und `uiRenderer.js` sind bewusst große Monolithe — **nicht aufteilen**
- Szenen liegen unter `js/scenes/`

### Tile-System
- Tile-Konstanten in `TILE` (dungeon.js), Anzeige in `TILE_DISPLAY`
- Neue Tile-Typen: in beiden Objekten eintragen + in `tileRenderer.js` zeichnen
- Tile-IDs sind plain Numbers, kein Enum

### Spieler-Stats
- Basis-Stats: `str`, `dex`, `vit`, `int` (Objekt `player.stats`)
- Abgeleitete Werte **immer** über Getter: `getAtk()`, `getDef()`, `getMaxHp()`, `getAttackSpeed()`
- Blessings und Tavern-Buffs werden in den Gettern integriert — nie direkt Rohwerte summieren

### Währungen & Buffs
- `player.gold` — normale Währung, bei Tod verlierbar (teilweise durch Death's Embrace gerettet)
- `player.soulShards` — permanente Währung, überlebt Tod immer
- `player.tavernBuffs` — Array von Buff-IDs, bei Tod per `clearTavernBuffs()` geleert
- `player.blessings` — Objekt `{ blessingId: true }`, permanent

### Events & Timing
- `dt` (delta time in Sekunden) wird durch alle `update(dt)`-Methoden propagiert
- Timer-Muster: `timer += dt; if (timer >= threshold) { ... timer = 0; }`
- Hit-Stop: `Game.hitStop(duration)` friert Frames ein (setzt `hitStopTimer`)

### Fehlerbehandlung
- Kein zentrales Error-Handling — Fehler landen in der Browser/Electron-Konsole
- Defensive Checks bei Null-Zugriffen (z. B. `player.equipment.weapon?.stats.atk ?? 0`)

---

## Bestehende Systeme

### Core
| System | Datei | Status |
|---|---|---|
| Spielschleife & Szenen | `game.js` | Fertig |
| 3-Layer-Renderer | `renderer.js` | Fertig |
| Tile-Rendering | `tileRenderer.js` | Fertig |
| Sprite-Animationen | `spriteRenderer.js` | Fertig |
| UI-Rendering (HUD, Panels) | `uiRenderer.js` | Fertig |
| Input (Tastatur + Maus) | `input.js` | Fertig |
| Prozedurales Audio | `audio.js` | Fertig |
| Asset-Loader | `assetLoader.js` + `assets/manifest.js` | Fertig — Sprite-First mit Procedural-Fallback |

### Spielentitäten
| System | Datei | Notizen |
|---|---|---|
| Spieler | `player.js` | Stats, Equipment (6 Slots), Inventar (20), Buffs, Blessings, Level-Up-Picks (1 of 3), Death Save (1×/Run), Assist Mode |
| Gegner | `enemies.js` | 7 Normal-Typen (rat→dragon), Elite-Varianten (ab Floor 8), 5 Mini-Bosse, 4 Major-Bosse, Final-Boss (Malphas), Boss-Phasensystem (3 Phasen), Boss-Loot-Tabelle |
| Kampf | `combat.js` | Schadensformel, 0,3s I-Frames, Floating Text, Partikel, Screenshake, Hitstop |
| Fähigkeiten | `abilities.js` | Dash (Shift, 4s CD), Whirlwind (Q, 4s CD, 5 Mana), Execute (E, 6s CD, 10 Mana) mit VFX |
| Items | `items.js` | Item-Datenbank (8 Waffen, 6 Rüstungen, 4 Helme, 4 Stiefel, 3 Ringe, 3 Amulette, 7 Tränke, 6 Essen), Generator, Shop-System |
| UI-Panels | `ui.js` | Inventar- & Charakterbogen-Panel |

### Welt & Levels
| System | Datei | Notizen |
|---|---|---|
| Dungeon-Generator | `dungeon.js` | BSP, skalierte Maps (50×30 bis 80×45), FOV, 50 Floors, Arena-Räume für Bosse, Terrain-Features (Pillars 40%, Water 25%), Narrow Corridors (50%), Intentional Enemy Placement, Mixed Groups ab Floor 3 |
| Floor-Events | `events.js` | 5 Typen: Schrein, Händler, Verfluchte Truhe, Brunnen, Gefangener. 80% Altar-Chance, 40% Extra-Event, Guaranteed Merchant ab Floor 3 |
| Village-Simulation | `village.js` | 14 Gebäudetypen, 12 Dorfbewohner, 30s Produktionszyklen, Raids, Weapon Evolution (Smithy Lv2+), 5 Specialist-Shop-Definitionen (nicht interaktiv) |

### Szenen
| Szene | Datei | Modi |
|---|---|---|
| Titel | `scenes/titleScene.js` | settings |
| Dorf | `scenes/villageScene.js` | explore, paused, settings, build, manage, recruit, assign_villager, smithy, tavern, temple, warehouse |
| Dungeon | `scenes/dungeonScene.js` | play, paused, settings, floorSelect, escapeConfirm, escapeSummary, eventPrompt, merchant, prisonerChoice, altarChoice, levelUpPick |
| Shop | `scenes/shopScene.js` | — |

### Interaktive Dorf-Gebäude (4 aktiv)
| Gebäude | Position | Funktion |
|---|---|---|
| Smithy | (33,21) | Waffen/Rüstung kaufen + upgraden, Weapon Evolution (Lv2+, Lv3 → Tier 7) |
| Tavern | (47,21) | 4 Run-Buffs für Gold |
| Temple | (33,29) | 6 permanente Segnungen für Soul Shards |
| Warehouse | (47,29) | Inventarübersicht & Ressourcen |

Hinweis: 5 Specialist-Shops (Weaponsmith, Armorsmith, Jewelry, Pharmacy, Food Store) sind als Daten in `village.js` definiert, aber noch nicht interaktiv.

### Boss-Tier-System
- **Mini-Bosse** (alle 5 Floors): Orc Chief (F5), Dark Sorcerer (F15), Lich (F25), Inferno Drake (F35), Pit Fiend (F45)
- **Major-Bosse** (alle 10 Floors): Cursed Knight (F10, Blink-Attack), Stone Golem (F20, Tremor-AoE), Shadow Dragon (F30), Chaos Titan (F40)
- **Final-Boss**: Malphas the Demon Lord (F50)
- Boss-Phasensystem: 3 Phasen bei 66%/33% HP, Invulnerability + Shockwave bei Phasenwechsel
- Boss-Loot: 4 unique Items (Cursed Blade, Golem Core Shield, Shadow Fang, Titan Heart Amulet)
- Arena-Räume: 14×12, versiegelte Türen, Stairs erscheinen nach Boss-Tod
- Soul-Shard-Drops: miniBoss 5–10, majorBoss 15–25, finalBoss 40–60

### Elite-Gegner
- Ab Floor 8: 15% Chance, ab Floor 15: 25% Chance
- 1.8× HP, 1.4× ATK, 1.3× DEF, 2.5× XP, goldene Farbe (#ffcc00)

### Floor-Themes (5 Themes in `tileRenderer.js`)
| Floors | Theme | Farbpalette |
|---|---|---|
| 1–10 | Stone | Braun/Beige |
| 11–20 | Frost | Eisblau |
| 21–30 | Magma | Orange/Rot |
| 31–40 | Abyss | Dunkelviolett |
| 41–50 | Infernal | Giftgrün |

### Permanente Progression
- 4 Tavern-Buffs (`TAVERN_BUFFS` in player.js) — run-scoped, bei Tod geleert
- 6 Temple-Blessings (`TEMPLE_BLESSINGS` in player.js) — permanent
- `Game.state.maxFloorReached` → ab Floor 5 Stockwerkauswahl in 5er-Schritten (`unlockedFloors`)
- Level-Up-Picks: Bei jedem Level-Up wählt der Spieler 1 von 3 zufälligen Upgrades (Stats, Heals, Ability-CDR, Perks)
- Town-Hall-Boni: Lv2 → +2 DEF/Run, Lv3 → +20 Max HP/Run; Smithy-Level → ATK-Bonus/Run
- Barracks-Intel: Lv2 → Enemy-HP-Bars + Namen, Lv3 → ATK-Werte sichtbar
- Weapon Evolution: Smithy Lv2+ erlaubt Waffen-Tier-Upgrade gegen Gold + Iron

### Tile-IDs (Referenz)
```
VOID=0, WALL=1, FLOOR=2, DOOR=3, STAIRS_DOWN=4, STAIRS_UP=5,
WATER=6, CHEST=7, SHRINE=8, MERCHANT=9, CURSED_CHEST=10,
FOUNTAIN=11, FOUNTAIN_DRY=12, PRISONER=13, ARENA_WALL=14, PILLAR=15
```

---

## Aktueller Fokus

**Status:** VERTICAL SLICE COMPLETE — Alle 5 Milestones der ersten Roadmap sind umgesetzt. Nächster Schritt: Neuer Masterplan (MASTERPLAN.md) für den Weg zum Alpha-Release.

### Vision

DungeonTown ist ein 15-Minuten-Run Dungeon Crawler bei dem jeder Tod stärker macht. Hades meets Moonlighter — tight Combat, meaningful Deaths, eine Stadt die wächst weil man stirbt.

### Abgeschlossen (Roadmap v1)
- **M1 "The Arena"**: Arena-Räume, Boss-Phasensystem (3 Phasen), Arena-Sealing, Orc Chief Ground Slam, Victory Fanfare + Jingle
- **M2 "Dangerous Rooms"**: Pillars (40%), Water Patches (25%), Intentional Enemy Placement, Mixed Groups ab Floor 3, Narrow Corridors (50%)
- **M3 "Choices Every Minute"**: Level-Up-Picks (1 of 3), 80% Altar-Chance, Guaranteed Merchant ab Floor 3, Altar-Choice-System
- **M4 "The Town Remembers"**: Weapon Evolution (Smithy Lv2+), Barracks Enemy-Intel, 5 Floor-Themes, Town-Hall-Run-Boni
- **M5 "More to Fight"**: Elite-Gegner (ab Floor 8), Cursed Knight (F10, Blink), Stone Golem (F20, Tremor), 4 Boss-Loot-Items
- **Fundament**: Kampfgefühl (Screenshake, Hitstop, Knockback, Kill-FX), Gegner-Verhalten (6 einzigartige KIs), Village-Streamlining (Quick-Reenter), Korridore, Polish, Audio

### Bekannte Lücken
- 5 Specialist-Shops definiert aber nicht interaktiv
- Floor-Themes ändern nur Farben, keine Gameplay-Mechaniken (keine Hazard-Tiles)
- Orc Chief hat kein Summon-Minions-Pattern (nur Ground Slam)
- Kein Projektil-System (Stone Golem nutzt Tremor-AoE statt Projectile)
- Stone Golem hat kein Split-Mechanic (nur Armor-Up in Phase 3)
- Ground Slam hat keine Boden-Warnungs-Tiles (nur Floating Text)
- Fehlende SFX: Skeleton-Block, Demon-Blink, Dragon-Breath

---

## Keybindings (Referenz)

| Aktion | Taste |
|---|---|
| Bewegen | WASD / Pfeiltasten |
| Angreifen | Space |
| Dash | Shift |
| Whirlwind | Q |
| Execute / Gebäude betreten | E |
| Inventar | I |
| Charakterbogen | C |
| Heiltrank | 1 |
| Manatrank | 2 |
| Essensbuff | 3 |
| Item fallen lassen | X |
| Mute | M |
| Pause-Menü | Esc / P |
| Fullscreen | F11 |

Hinweis: E auf Event-Tile im Dungeon löst Event aus (überschreibt Execute-Ability, außer Event bereits benutzt).

---

## Electron-Setup

- `electron/main.js` — Main-Process, Frameless Window 1280×720, Single-Instance-Lock, IPC für Fullscreen
- `electron/preload.js` — contextBridge: `electronAPI.toggleFullscreen()`, `electronAPI.isFullscreen()`
- `build/icon.png` — 512×512 Placeholder-Icon
- App-ID: `com.dungeontown.game`
- Scripts: `npm start` (Dev), `npm run build:win/mac/linux/all` (Dist)
