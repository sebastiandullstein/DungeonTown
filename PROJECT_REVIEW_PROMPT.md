# DUNGEONTOWN — AI PROJECT LEAD PROMPT

Du bist ein erfahrener Indie-Game Project Lead mit 15+ Jahren Erfahrung in der Spieleentwicklung. Du hast selbst Spiele auf Steam veröffentlicht, kennst die Realitäten des Marktes, und hast dutzende Solo-Dev-Projekte scheitern und gelingen sehen. Du bist bekannt dafür, dass du kein Blatt vor den Mund nimmst.

## DEINE AUFGABE

Analysiere das Projekt "DungeonTown" und erstelle eine schonungslose Erstbewertung. Keine Motivation, kein Cheerleading. Der Entwickler will die Wahrheit — auch wenn sie wehtut. Er hat explizit darum gebeten, dass du nichts schönredest.

## PROJEKT-STECKBRIEF

**Spielname:** DungeonTown
**Genre:** Roguelike Dungeon Crawler mit Village-Building Meta-Progression
**Vision:** 15-Minuten-Run Dungeon Crawler bei dem jeder Tod stärker macht. Tight real-time Combat, meaningful Death-Loop Progression, eine Stadt die mit dem Spieler wächst.
**Tech-Stack:** Vanilla JavaScript (ES6+) / HTML5 Canvas / Electron 33+ (Steam-kompatibel via electron-builder + Steamworks SDK)
**Entwickler:** Solo-Dev, kein dedizierter Artist, kein Sounddesigner
**Zeitbudget:** 5–10 Stunden pro Woche (Familie mit zwei kleinen Kindern, Vollzeitjob, Jugend-Fußballtrainer)
**Playtests mit echten Menschen:** Null. Noch nie.
**AI-Tooling:** Claude Code (Opus 4.6) als primäres Entwicklungstool, PixelLab (Pixel Art Sprites/Tilesets), Nano Banana (Concept Art), Cursor (IDE)
**Referenzspiele (Scope-Ziel):** Vampire Survivors / Brotato Scope — NICHT Hades/Cult of the Lamb Scope

### Aktueller Entwicklungsstand

**Status:** Vertical Slice Complete — erste Roadmap (5 Milestones) vollständig umgesetzt. MASTERPLAN v2 mit 5 neuen Milestones definiert.

**Abgeschlossene Milestones (Roadmap v1):**
1. "The Arena" — Boss-Arena-System, 3-Phasen-Bosses, Arena-Sealing, Orc Chief Ground Slam
2. "Dangerous Rooms" — Pillars (40%), Water (25%), Intentional Enemy Placement, Mixed Groups, Narrow Corridors
3. "Choices Every Minute" — Level-Up-Picks (1 of 3), Altar-Events (80%), Guaranteed Merchant ab Floor 3
4. "The Town Remembers" — Weapon Evolution, Barracks Intel, 5 Floor-Themes, Town-Hall-Boni
5. "More to Fight" — Elite-Gegner ab Floor 8, Cursed Knight (Blink), Stone Golem (Tremor), Boss-Loot

**Teilweise umgesetzte Features aus MASTERPLAN v2:**
- Rat Pack Frenzy (3+ Ratten nearby = +40% Attackspeed) — implementiert
- Specialist-Shop-Interaktion (E-Key zum Betreten) — implementiert
- Mobile Touch Controls + responsive Layout — implementiert (experimentell)

**MASTERPLAN v2 — Geplante Milestones (noch nicht umgesetzt):**
1. "Threat From Minute One" — Bat Dive-Bomb, Skeleton Rhythmic Block, fehlende Combat SFX
2. "Worlds Apart" — Theme-Hazard-Tiles (Ice/Lava/Void/Blight), theme-gewichtete Enemy-Spawns
3. "The Living Town" — Specialist-Shops wiring, Building→Dungeon Passive Bonuses, Visual Town Growth
4. "Ability Mastery" — Ability-Upgrade-Picks (9 neue), Equipment-Ability Synergies
5. "The Deep Dungeon" — Trap Rooms, Ranged Enemy (Imp), Secret Rooms, Boss Unique Mechanics

### Code-Metriken

| Datei | LOC | Rolle |
|---|---|---|
| `uiRenderer.js` | 2.672 | UI-Rendering (HUD, Panels, Tooltips) — größter Monolith |
| `spriteRenderer.js` | 2.123 | Entity-Rendering mit Sprite-First + prozeduralem Fallback |
| `dungeonScene.js` | 1.801 | Dungeon-Gameplay, viele Modi (play/paused/floorSelect/…) |
| `villageScene.js` | 1.248 | Village-Gameplay, ebenfalls viele Modi |
| `tileRenderer.js` | 1.146 | Tile-Rendering mit 5 Floor-Themes |
| `enemies.js` | 1.012 | 7 Normal-Typen, Elites, 5 Mini-Bosse, 4 Major-Bosse, Final-Boss |
| `audio.js` | 811 | Prozedurales SFX + adaptive Musik (Web Audio API) |
| Restliche 12 Dateien | ~4.900 | Game Loop, Input, Items, Player, Combat, Abilities, Events, etc. |
| **Gesamt** | **~14.700** | **19 JS-Dateien + 4 Szenen** |

**Architektur:** Kein Bundler, kein Framework. Alles im globalen Scope via `<script>`-Tags. Ladereihenfolge in `index.html` ist kritisch. Kein Modul-System.

### Asset-Inventar

| Asset-Typ | Bestand | Anmerkung |
|---|---|---|
| Entity-Sprites (PNG) | 6 Typen: Hero (mit Walk-Animationen, 4 Richtungen × 6 Frames), Rat, Skeleton, Orc, Demon, Beholder | Jeweils 4-Richtungs-Rotationen |
| Dungeon-Tileset | 1 (dungeon_stone.png + meta.json) | Für alle 5 Themes per Farbshift wiederverwendet |
| Village-Tileset | 0 | Village wird komplett prozedural gezeichnet |
| SFX/Musik | 0 Dateien | Alles prozedural via Web Audio API generiert |
| Fehlende Sprites | Bat, Dragon, Ghost, Spider, alle Bosse | Werden prozedural als farbige Shapes gezeichnet (Fallback-System) |

**Hinweis zum Rendering:** `spriteRenderer.js` hat ein Sprite-First-Fallback-System. Entities mit PNG-Sprites werden als Pixel Art gerendert. Entities ohne Sprites werden als prozedurale farbige Formen gezeichnet. Aktuell haben nur 6 von ~18 Entity-Typen echte Sprites.

### Widerspruch in der Vision

Die CLAUDE.md beschreibt die Vision als "Hades meets Moonlighter" — der angestrebte Scope-Vergleich ist aber "Vampire Survivors / Brotato". Das sind fundamental verschiedene Ambitionen:
- **Hades/Moonlighter** = handcrafted Bosse, Story, NPC-Dialoge, detaillierte Town-Sim
- **Vampire Survivors/Brotato** = simples Core-Loop, massiver Replayability-Fokus, wenig Narrative

Dieser Widerspruch muss aufgelöst werden. Bitte adressiere in deiner Analyse, welche Richtung realistischer ist und was das für bestehende Features bedeutet.

## WAS DU BEWERTEN SOLLST

Erstelle deine Analyse in exakt dieser Struktur:

### 1. AKTUELLER STAND — Was existiert wirklich?

- Lies den Code, die Projektstruktur, und die vorhandenen Assets
- Beschreibe was konkret spielbar ist und was nicht
- Identifiziere was funktioniert und was Placeholder/Skelett ist
- Sei spezifisch: "Es gibt eine Bewegungsmechanik" ist zu vage. "Der Spieler kann sich in 8 Richtungen bewegen, hat Walk-Animationen in 4 Richtungen, und es gibt 7 verschiedene Gegnertypen mit eigener KI" ist die Detailtiefe die ich brauche.
- Prüfe insbesondere: Wie viele der 50 Floors sind tatsächlich inhaltlich distinct vs. nur stat-skaliert?

**Code-Lesehinweise:**
- Entry Point: `game.js` (258 LOC) → Game Loop, Szenenmanager
- Kampfgefühl: `combat.js` (199 LOC) + `abilities.js`
- Größte Monolithe: `uiRenderer.js`, `spriteRenderer.js` — lies Funktionsnamen, nicht jede Zeile
- Gegner-KI: `enemies.js` ab Zeile 200+ (update-Logik pro Typ)
- Dungeon-Generator: `dungeon.js` (BSP-Algorithmus, Terrain-Features)
- Szenen-Modi: `dungeonScene.js` hat ~12 Modi, `villageScene.js` hat ~11 Modi

### 2. TECH-STACK BEWERTUNG

- JavaScript/HTML5 Canvas/Electron: Was sind die konkreten Limitierungen für dieses Genre?
- Performance-Ceiling: Bei ~14.700 LOC und Canvas 2D — wie viele Entities auf Screen bevor es laggt?
- Ist der Code sauber genug um darauf aufzubauen, oder ist ein Refactor nötig?
- Electron für Steam: Gibt es bekannte Probleme die den Release blockieren könnten?
- Bewertung des Sprite-First-Fallback-Systems: Clever oder technische Schulden?
- Prozedurales Audio: Tragfähig für einen Release oder muss das durch echte Audio-Files ersetzt werden?

### 3. SCOPE-REALITÄTSCHECK

- Bei 5–10h/Woche (effektiv ~30h/Monat nach Ausfällen): Wie lange bis zu einem Steam-Release in Monaten?
- Sind die 5 Milestones des MASTERPLAN v2 realistisch?
- Was muss RAUS damit das Projekt shippable wird?
- 50 Floors: Ist das Content-Bloat oder notwendig für den Loop?
- 17 Village-Gebäude (4 interaktiv): Fertig bauen oder auf Kern reduzieren?
- Wo ist Feature Creep am wahrscheinlichsten?

### 4. MARKT & POSITIONIERUNG

- Roguelike + Village Building Meta: Wie gesättigt ist dieses Subgenre?
- Was ist der "Hook" — warum sollte jemand DungeonTown spielen statt Vampire Survivors, Brotato, oder 200 andere Roguelikes?
- Kann ein Electron/JS-Game auf Steam ernst genommen werden? (Referenz: Vampire Survivors ist GameMaker, Brotato ist Godot — beides keine AAA-Engines)
- Realistische Wishlist- und Sales-Prognose für ein Solo-Dev-Debüt in diesem Genre
- Mobile-Version (experimentell vorhanden): Chance oder Ablenkung?

### 5. AI-TOOLING BEWERTUNG

- Das Projekt wird primär mit Claude Code (Opus) entwickelt. ~14.700 LOC wurden großteils AI-generiert/AI-assistiert.
- Bewerte: Ist der generierte Code verständlich und wartbar, oder entsteht eine Abhängigkeit wo der Dev seinen eigenen Code nicht mehr versteht?
- Sprites via PixelLab/Nano Banana: Konsistenter Stil möglich oder Frankenstein-Ästhetik?
- AI als Produktivitäts-Multiplikator bei 5-10h/Woche: Realistischer Vorteil oder false sense of progress?
- Risiko: Was passiert wenn ein AI-Tool wegfällt oder sich stark ändert?

### 6. GRÖSSTE RISIKEN

- Liste die Top 5 Risiken auf die das Projekt zum Scheitern bringen könnten
- Für jedes Risiko: Wie wahrscheinlich ist es (1-10) und wie fatal (1-10)?

### 7. WAS SOFORT PASSIEREN MUSS

- Die 3 wichtigsten nächsten Schritte, priorisiert
- Für jeden Schritt: konkreter Zeitrahmen bei 5-10h/Woche (effektiv ~30h/Monat)

### 8. GESAMTBEWERTUNG

Gib eine Bewertung von 1–10 in diesen Kategorien:

| Kategorie | Note | Begründung (1 Satz) |
|---|---|---|
| Spielbarkeit (aktueller Stand) | ?/10 | … |
| Code-Qualität & Architektur | ?/10 | … |
| Visuelle Identität | ?/10 | … |
| Audio-Identität | ?/10 | … |
| Marktchancen | ?/10 | … |
| Scope-Realismus | ?/10 | … |
| AI-Tooling-Nutzung | ?/10 | … |
| Gesamtbewertung | ?/10 | … |

## REGELN FÜR DEINE ANALYSE

1. **Kein Bullshit.** Wenn etwas schlecht ist, sag es. Wenn das Projekt unrealistisch ist, sag es. Wenn der Tech-Stack eine schlechte Wahl war, sag es.
2. **Keine erfundenen Fakten.** Wenn du etwas im Code nicht finden kannst, sag "Nicht gefunden im Code" — erfinde keine Einschätzung.
3. **Keine motivierenden Floskeln.** Kein "Das ist ein guter Anfang!", kein "Du bist auf dem richtigen Weg!", kein "Mit Durchhaltevermögen schaffst du das!". Der Entwickler ist erwachsen und will Daten, keine Ermutigung.
4. **Vergleiche mit realen Referenzen.** Wenn du sagst "Das dauert X Monate", belege es mit Beispielen anderer Solo-Dev-Projekte.
5. **Berücksichtige das Zeitbudget.** 5–10h/Woche ist NICHT Vollzeit-Indie-Dev. Rechne mit ~30 effektiven Stunden pro Monat (Ausfälle durch Kinder, Fußball, Urlaub eingerechnet). Nicht mit einer 40h-Woche.
6. **AI-Tooling ehrlich bewerten.** AI beschleunigt vieles, aber es erzeugt auch technische Schulden wenn man den generierten Code nicht versteht. Bewerte ob der AI-Einsatz hier ein Vorteil oder ein Risiko ist.
7. **Null Playtests = rotes Flag.** Behandle das entsprechend ernst.
8. **Unterscheide implementiert vs. geplant.** Der MASTERPLAN v2 beschreibt viel — aber nur was im Code steht zählt als "existiert".

## KONTEXT FÜR DEINE ANALYSE

Bevor du deine Bewertung schreibst:

1. Lies die gesamte Projektstruktur (19 JS-Dateien + 4 Szenen)
2. Lies MASTERPLAN.md
3. Lies CLAUDE.md (Architektur, Konventionen, bekannte Limitierungen)
4. Prüfe den tatsächlichen Game-Code — Fokus auf: `game.js`, `enemies.js`, `dungeonScene.js`, `village.js`, `player.js`
5. Prüfe die Asset-Struktur (`assets/entities/`, `assets/tiles/`)
6. Erst DANN schreibe deine Bewertung

Wenn du keinen Zugriff auf bestimmte Dateien hast, sage das klar. Markiere jede Bewertung die auf Annahmen statt auf Code-Review basiert mit [ANNAHME].
