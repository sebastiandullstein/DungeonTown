# DungeonTown Honest Audit

## Status: PROTOTYPE

Es gibt funktionierenden Code für viele Systeme. Aber es gibt kein Spiel, das man jemandem in die Hand drücken und sagen kann: "Spiel das mal 10 Minuten und sag mir, ob es Spaß macht." Es ist ein technischer Prototyp mit Feature-Checkliste, kein spielbares Erlebnis.

---

## Die ersten 60 Sekunden

1. **Titel-Screen**: Schwarzer Hintergrund, "DungeonTown" in Courier New, drei Menüpunkte. Keine Musik bis zum ersten Klick (Web Audio Policy). Kein Artwork, keine Atmosphäre. Der erste Eindruck sagt: "Programmer Art Testbuild."

2. **Dorf**: Der Spieler steht in einem Tile-Grid-Dorf mit prozeduralen farbigen Rechtecken als Gebäude. Es gibt ~17 Gebäude-Slots, NPCs die zufällig herumwandern. Keine Orientierung. Keine Anweisung. Der Spieler weiß nicht, wo der Dungeon-Eingang ist, was die Gebäude tun, oder was sein Ziel ist. Er drückt WASD und läuft über grüne Tiles. Es fühlt sich an wie ein leeres Spreadsheet mit Grafikausgabe.

3. **Dungeon betreten**: Der Spieler muss irgendwie den Dungeon-Eingang finden (ein Tile irgendwo auf der Map), darüberlaufen und E drücken. Dann: schwarzer Bildschirm, FOV-System enthüllt Tiles um den Spieler. "Dungeon Floor 1" als Notification. Man sieht Wände, Böden, gelegentlich farbige Buchstaben (Gegner). Es gibt ein tiefes Drone-Summen als Musik.

4. **Erster Kampf**: Man läuft auf eine Ratte zu. Sie bewegt sich auf einen zu. Man drückt Space. Ein gelber Radial-Gradient erscheint kurz. Floating Numbers. Die Ratte stirbt. "+5 XP", "+3 Gold". Es gibt Screenshake und Hitstop — das ist tatsächlich da. Aber der Angriff selbst fühlt sich trotzdem leer an, weil die visuelle Rückmeldung (ein Radial-Gradient auf einem Tile) nicht zur Aktion passt.

**Zusammenfassung der ersten 60 Sekunden:** Der Spieler verbringt 30 Sekunden damit, sich im Dorf zu verirren, und 30 Sekunden mit einem einzigen Kampf gegen eine Ratte, der mechanisch funktioniert aber visuell unterwältigend ist.

---

## Was funktioniert

- **Screenshake + Hitstop sind implementiert.** Das ist überraschend. Die meisten Prototypen in dieser Phase haben das nicht. Die Werte sind konservativ (3px, 0.05s), aber die Infrastruktur ist da. Boss-Kills haben stärkeren Shake (10-20px) und längeren Hitstop (0.12-0.3s). Das ist ein solides Fundament.

- **Das Death-Save-System ("Death Defied") ist ein guter Design-Moment.** Einmal pro Run bei 0 HP überleben, 1.5s I-Frames, spezieller Sound, goldener Floating Text. Das ist die Art von Moment, die Spieler in Erinnerung behalten. Es kommt nur zu selten vor, als dass es das Spiel tragen könnte.

- **Prozedurales Audio ist beeindruckend ambitioniert.** Alle SFX sind Web-Audio-Oszillatoren: Angriff, Tod, Level-Up, Boss-Intro, Escape-Jingle. Das ist technisch respektabel und bedeutet: kein Asset-Management für Sound. Die Boss-Intro-Musik (dissonante Power-Chords + Rumble + Impact-Hit) ist tatsächlich stimmungsvoll.

- **Das Boss-Tier-System hat Struktur.** Mini-Bosses alle 5 Floors, Major-Bosses alle 10, Finalboss Floor 50. Boss-Intro-Cinematics mit Screenshake und Sound. Das gibt dem Dungeon-Abstieg einen Rhythmus — zumindest auf dem Papier.

- **Die Meta-Progression hat die richtigen Bausteine.** Soul Shards (permanente Währung), Temple Blessings (6 permanente Upgrades), Tavern Buffs (pro-Run), Floor-Checkpoints. Das sind die Zahnräder eines Roguelite-Loops. Sie drehen sich nur noch nicht schnell genug.

---

## Was sich schlecht anfühlt

### Bewegung & Kampf

- **Tile-basierte Bewegung fühlt sich steif an.** Der Spieler bewegt sich in diskreten Tile-Schritten (1 Tile alle 0.1s). Kein Sub-Tile-Movement, keine Beschleunigung, kein Deceleration. Im Vergleich: Vampire Survivors hat pixelgenaue Bewegung mit sofortigem Response. Hier fühlt sich jeder Schritt an wie ein Schachzug. Für ein Action-Roguelite ist das ein Fundamentalproblem.

- **Der Angriff hat keinen klaren visuellen Arc.** Space drücken → ein gelber Radial-Gradient erscheint auf 3 Tiles in Blickrichtung → Damage Numbers. Es gibt keine Schwung-Animation, kein Weapon-Sprite das sich bewegt, keinen klaren "Slash" den man sieht. Der Spieler muss *raten*, ob sein Angriff getroffen hat. Der Lunge-Offset (4px) ist kaum sichtbar.

- **Keine Attack-Animation für den Spieler-Sprite.** Der Held hat Walk-Animationen (6 Frames, 4 Richtungen) aber keine Attack-Animation. Beim Angreifen passiert visuell nichts am Charakter selbst. In Vampire Survivors/Brotato ist das Auto-Attack — man SIEHT ständig Projektile und Effekte. Hier: nichts.

- **Gegner sind Health-Bags.** Die 3-State-KI (idle/chase/attack) bedeutet: Gegner stehen rum, laufen auf dich zu, hauen dich. Keine Angriffs-Telegraphing, keine Patterns, kein Unterschied im Verhalten zwischen Ratte und Demon außer den Zahlen. In 20 Minutes Till Dawn hat jeder Gegnertyp ein sichtbar anderes Verhalten. Hier: alle gleich, nur die Buchstaben und HP-Werte ändern sich.

- **Knockback ist rein visuell und winzig.** `knockX * 0.3` Tiles für 0.15s. Das ist ein kosmetischer Offset, kein Gameplay-Knockback. Der Gegner bewegt sich nicht wirklich auf ein anderes Tile. In jedem Referenzspiel ist Knockback ein zentraler Teil des Kampfgefühls.

### Orientierung & Onboarding

- **Das Dorf hat kein visuelles Zentrum und keine Wegweisung.** 17 Building-Positions verteilt über eine 50×80 Tilemap. Der Spieler sieht einen 25×18 Viewport. Er sieht also ca. 30% der Map gleichzeitig. Kein Pfeil zum Dungeon-Eingang, kein Tutorial-NPC, kein "Geh hier lang"-Signal.

- **Zu viele Systeme zu früh sichtbar.** Smithy, Tavern, Temple, Warehouse, Weaponsmith, Armorsmith, Jewelry, Pharmacy, Food Store, Inn, Farm, Lumber Mill, Quarry, Barracks, Blacksmith, Apothecary, Walls. Das sind 17 Gebäude in einem Spiel, dessen Core Loop noch nicht steht. Ein neuer Spieler sieht das und denkt: "Was davon ist wichtig?" Die Antwort: Nichts davon ist wichtig, bevor der Kampf Spaß macht.

- **Tutorial-Hints sind nur für den Dungeon implementiert.** Es gibt `_checkTutorials()` mit Hints wie "WASD to move" und "Space to attack". Aber das Dorf — der erste Ort den der Spieler sieht — hat keine Tutorials.

### Visuelles & Atmosphere

- **Prozedural gezeichnete Sprites für die meisten Entities.** Der Held hat Pixel-Art-Sprites (PixelLab-generiert), aber der Fallback für Enemies ist: farbige Formen aus Canvas-Primitives. Ratten sind braune Ellipsen mit Ohren. Skelette sind graue Figuren mit Augenlinien. Das ist völlig okay für einen Prototyp — aber es zerstört jeden Versuch von Atmosphäre.

- **Das Dorf ist visuell leblos.** Grüne Tiles, braune Path-Tiles, farbige Rechtecke für Gebäude. NPCs wandern zufällig. Keine Partikel, kein Wetter, keine Animation auf Gebäuden. Es fehlt jedes visuelle Detail das sagt: "Hier lebt jemand."

- **Die Dungeon-Musik ist ein stehender Drone.** Ein 55Hz Sinus-Ton + 82.5Hz Oberton + gefiltertes Rauschen + langsamer LFO. Das ist eine Textur, keine Musik. Es gibt keinen Rhythmus, keine Melodie, keine Spannung. Für die ersten 5 Minuten ist es okay-atmosphärisch. Nach 10 Minuten wird es zu weißem Rauschen im Gehirn. Die Village-Musik ist ähnlich: ein stehender Pad-Sound ohne Veränderung.

### Loop & Pacing

- **Ein Run hat keinen Spannungsbogen.** Floor 1: Ratten und Fledermäuse. Floor 2: Ratten, Fledermäuse, Skelette. Floor 3: plus Orks. Die Schwierigkeit steigt linear (5 + floor*2 Gegner), die Belohnung steigt linear (Gold-Drops skalieren mit Floor). Es gibt keinen "Oh shit"-Moment vor Floor 5 (erster Mini-Boss), und der kommt erst nach ~10 Minuten monotonen Grind.

- **Kein Timer, kein Druck, kein Risiko in den ersten Minuten.** In Vampire Survivors drückt ab Sekunde 1 eine Welle Gegner auf den Spieler zu. In Brotato spawnen Enemies in Wellen mit steigendem Tempo. Hier: der Spieler bewegt sich Tile für Tile durch leere Räume und trifft gelegentlich auf einzelne Gegner die auf ihn zuwandern. Es fühlt sich passiv an.

- **Die Village-Phase unterbricht den Flow.** Tod → 5 Sekunden Warten → Village → herumlaufen → Dungeon-Eingang finden → E drücken → Optional Floor-Select → Dungeon. Das sind mindestens 15-20 Sekunden "Nichts-Tun" zwischen Runs. In Vampire Survivors: Tod → Upgrade-Screen → "Retry" → sofort im Spiel.

---

## Der Core Loop (ehrlich)

### Was ist der aktuelle Loop?

```
Dorf (herumlaufen, optional Shops besuchen)
→ Dungeon betreten
→ Floor-für-Floor nach unten kämpfen (Tile-Movement, Space-Angriff)
→ Items sammeln, Gold verdienen, Events finden
→ Sterben oder Flucht
→ Zurück im Dorf (Gold behalten/verlieren, Soul Shards behalten)
→ Permanente Upgrades kaufen (Temple/Tavern)
→ Wieder rein
```

### Macht er in 30 Sekunden Spaß?

**Nein.**

In den ersten 30 Sekunden im Dungeon passiert folgendes: Der Spieler läuft Tile für Tile durch dunkle Räume. FOV enthüllt Wände und Böden. Gelegentlich taucht eine Ratte auf (brauner Buchstabe). Man drückt Space. Damage Numbers. Die Ratte stirbt. Man sammelt Gold auf. Man sucht die Treppe zum nächsten Floor.

Das Problem ist nicht, dass die Mechaniken fehlen. Es gibt Angriff, Dash, Whirlwind, Execute, Items, Events. Das Problem ist, dass **nichts davon in den ersten 30 Sekunden zu spüren ist**. Dash ist ab Level 1 verfügbar, aber warum sollte man in einem leeren Raum dashen? Whirlwind kommt ab Level 5 — der Spieler hat 0 Gegner in Reichweite wenn er es freischaltet. Events spawnen ab Floor 2-8.

### Vergleich: Vampire Survivors / Brotato in den ersten 30 Sekunden

**Vampire Survivors (30 Sekunden):**
- Welle 1 von Feinden kommt sofort auf dich zu
- Deine Waffe feuert automatisch (kein Button nötig)
- Du siehst: Projektile, Treffer-Effekte, XP-Gems die eingesaugt werden
- Du musst aktiv ausweichen, Position wählen
- Dopamin-Trigger: Masse an Enemies die sterben, XP-Gems einsammeln, erstes Level-Up nach 15 Sekunden

**Brotato (30 Sekunden):**
- Arena-Welle startet sofort
- Dein Charakter schießt automatisch auf den nächsten Feind
- Screen ist voll mit Projektilen und Effekten
- Du musst durch Lücken navigieren
- Dopamin: Kills = Währung = sofortiges Upgrade nach der Welle

**DungeonTown (30 Sekunden):**
- Du läufst Tile für Tile durch einen dunklen Korridor
- Du triffst vielleicht 1 Ratte
- Du drückst Space, ein gelber Gradient blinkt, -8
- Du sammelst 3 Gold auf
- Dopamin: keines

Der fundamentale Unterschied: In den Referenzspielen passiert ab Sekunde 1 VIEL. Der Bildschirm ist voll, die Inputs fühlen sich kraftvoll an, das Feedback ist überwältigend. In DungeonTown passiert wenig, der Bildschirm ist dunkel und leer, und das Feedback ist subtil.

---

## Die 3 wichtigsten Probleme

### 1. Das Kampfgefühl ist leer (Impact: Katastrophal)

Alles steht und fällt mit dem Moment, in dem der Spieler Space drückt. Aktuell passiert:
- Ein Radial-Gradient auf den Angriffs-Tiles (kaum sichtbar)
- Floating Damage Numbers (funktional)
- 3px Screenshake für 0.15s (kaum spürbar)
- 0.05s Hitstop (kaum spürbar)
- Knockback-Offset von 0.3 * 32 = ~10px für 0.15s (kaum sichtbar)

Was fehlt:
- **Kein sichtbarer Angriffs-Swing/Slash.** Der Spieler sieht nicht, WO sein Angriff ist. Der Radial-Gradient auf dem Tile ist kein Ersatz für eine Arc/Slash-Linie.
- **Die Screenshake/Hitstop-Werte sind zu konservativ.** 3px bei 32px Tiles ist unter der Wahrnehmungsschwelle im Kampf. 0.05s Hitstop ist 3 Frames bei 60 FPS — das fühlt man nicht.
- **Kein Flash-Effekt auf dem getroffenen Gegner.** Keine weiße Überblendung, kein Aufblitzen, nichts das sagt "DAS war ein Treffer".
- **Sounds sind zu leise und zu kurz.** Der Attack-Sound ist ein 80ms Sawtooth-Sweep von 400Hz auf 200Hz bei 30% Volume. Das ist ein "fft" statt eines "THWACK".

**Das ist Problem #1 weil:** Wenn sich ein einzelner Schwerthieb nicht gut anfühlt, kann kein Meta-System, kein Village-Management und kein Boss-Design das retten. Der Kern jedes Action-Spiels ist die Sekunde-zu-Sekunde-Interaktion.

### 2. Es gibt keinen Druck und keine Dichte in den ersten 5 Minuten (Impact: Kritisch)

Floor 1 hat ~7 Gegner (5 + 1*2) verteilt auf eine 80×45 Map mit mehreren Räumen. Der Spieler sieht einen 25×18 Viewport mit FOV-Radius 6. Das bedeutet: Die meiste Zeit sieht er leere Wände und Böden. Gegner sind einzeln und weit verstreut.

In Vampire Survivors steuert der Spieler durch eine MASSE von Feinden. Die Dichte ist der Kern des Spielgefühls. In DungeonTown ist die Dichte nahe Null.

Das Problem verschärft sich durch das Tile-Movement: Der Spieler bewegt sich ~10 Tiles/Sekunde (moveDelay 0.1s). Bei einer 80×45 Map braucht er theoretisch 8 Sekunden für eine Raumbreite. In der Praxis verbringt er 70% der Zeit mit Laufen und 30% mit Kämpfen. Das Verhältnis müsste umgekehrt sein.

### 3. Das Dorf ist ein Blocker statt ein Belohnungsmoment (Impact: Hoch)

Nach dem Tod oder der Flucht aus dem Dungeon landet der Spieler im Dorf. Das soll sich anfühlen wie: "Ich bin sicher, ich kann mich verbessern, ich bereite mich auf den nächsten Run vor." Stattdessen fühlt es sich an wie: "Ich stecke in einer Management-Simulation fest und will zurück in den Dungeon."

Das Village hat 17 Gebäudetypen, Villager-Management, Ressourcen-Produktion (30s-Zyklen), Raid-System, Recruit-System. Das ist ein komplettes Strategiespiel. Aber der Spieler hat nach einem 3-Minuten-Run auf Floor 1 vielleicht 20 Gold und 0 Soul Shards. Er kann sich: nichts leisten. Die günstigsten Temple-Blessings kosten 10-25 Soul Shards. Soul Shards droppen nur von Bosses (ab Floor 5).

Das heißt: Die ersten 3-5 Runs bringt die Village-Phase **null Gameplay**. Der Spieler läuft durch ein leeres Dorf mit Gebäuden die er nicht nutzen kann, zum Dungeon-Eingang, und geht wieder rein. Das ist kein Loop — das ist eine Ladescreen mit zusätzlichen Schritten.

---

## Empfehlung: Der eine nächste Schritt

**Eine Session (2 Stunden): Den Angriff FÜHLEN lassen.**

Konkret:
1. **Screenshake verdoppeln** — von 3px auf 6-8px für normale Hits, 12px für Kills
2. **Hitstop verdreifachen** — von 0.05s auf 0.12-0.15s für normale Hits
3. **Enemy-Flash bei Treffer** — den getroffenen Gegner für 2-3 Frames weiß aufblitzen lassen (ctx.globalCompositeOperation = 'source-atop' mit weißem Fill)
4. **Slash-Arc-Effekt** — eine weiße/gelbe Bogen-Linie die den Angriffs-Arc sichtbar macht (die Infrastruktur für `_slashLines` existiert bereits in `abilities.js` — einfach für den normalen Angriff wiederverwenden)
5. **Attack-Sound verdoppeln** — Dauer von 80ms auf 150ms, Volume von 30% auf 50%, zusätzlichen Noise-Burst für Impact-Gefühl

Das verändert NULL an der Spielmechanik. Es ändert nur, wie sich der bestehende Angriff ANFÜHLT. Und es ist der Unterschied zwischen "Ich klicke Buttons" und "Ich KÄMPFE."

Alles andere — Gegner-Dichte, Village-Onboarding, Sub-Tile-Movement — kann warten. Wenn der Angriff sich gut anfühlt, hat der Spieler einen Grund, nochmal Space zu drücken. Das ist der Kern.

---

## Roher Feature-Bestand

### Core Systems
| Feature | Status |
|---|---|
| Game Loop (requestAnimationFrame) | FUNKTIONIERT |
| 3-Layer Canvas Renderer | FUNKTIONIERT |
| Tile Rendering (Wang-Tileset + Procedural) | FUNKTIONIERT |
| Sprite Rendering (Player Pixel-Art) | FUNKTIONIERT |
| Sprite Rendering (Enemies Procedural) | FUNKTIONIERT — aber visuell schwach |
| FOV / Line-of-Sight | FUNKTIONIERT |
| Input Handler (Keyboard + Mouse) | FUNKTIONIERT |
| Screen Shake | FUNKTIONIERT — Werte zu konservativ |
| Hit Stop (Freeze Frames) | FUNKTIONIERT — Werte zu konservativ |
| Vignette Overlay | FUNKTIONIERT |
| Wall Shadows | FUNKTIONIERT |
| Dungeon Theming (per Floor-Bereich) | FUNKTIONIERT |
| Save/Load (localStorage) | FUNKTIONIERT |
| Settings (Volume, Fullscreen, Assist Mode) | FUNKTIONIERT |

### Spieler
| Feature | Status |
|---|---|
| Tile-basierte Bewegung (WASD) | FUNKTIONIERT — fühlt sich steif an |
| Melee-Angriff (Space, 3-Tile-Arc) | FUNKTIONIERT — visuell leer |
| Dash (Shift, 3 Tiles, I-Frames) | FUNKTIONIERT |
| Whirlwind (Q, AoE, Mana-Cost) | FUNKTIONIERT |
| Execute (E, Single-Target, Instakill <25% HP) | FUNKTIONIERT |
| I-Frames (0.3s nach Treffer) | FUNKTIONIERT |
| Knockback (visueller Offset) | FUNKTIONIERT — zu subtil |
| Equipment (6 Slots) | FUNKTIONIERT |
| Inventory (20 Slots) | FUNKTIONIERT |
| Stat-System (STR/DEX/VIT/INT) | FUNKTIONIERT |
| Level-Up (+3 Stat Points) | FUNKTIONIERT |
| Health/Mana Potions | FUNKTIONIERT |
| Food Buffs (temporär) | FUNKTIONIERT |
| Death Save ("Death Defied", 1x pro Run) | FUNKTIONIERT |
| Desperate Fury (+30% ATK bei <20% HP) | FUNKTIONIERT |

### Kampf
| Feature | Status |
|---|---|
| Damage Calculation (ATK vs DEF + RNG) | FUNKTIONIERT |
| Critical Hits (10%, 2x Damage) | FUNKTIONIERT |
| Floating Damage Numbers | FUNKTIONIERT |
| Hit Particles (3-5 pro Treffer) | FUNKTIONIERT |
| Enemy Knockback (visuell) | FUNKTIONIERT — zu subtil |
| Combat Log (7 Einträge, Fade) | FUNKTIONIERT |

### Gegner
| Feature | Status |
|---|---|
| 7 Gegnertypen (rat → demonLord) | FUNKTIONIERT |
| 3-State KI (idle/chase/attack) | FUNKTIONIERT — alle Typen verhalten sich identisch |
| Mini-Bosses (5 Typen, alle 5 Floors) | FUNKTIONIERT |
| Major-Bosses (4 Typen, alle 10 Floors) | FUNKTIONIERT |
| Final Boss (Malphas, Floor 50) | FUNKTIONIERT |
| Boss-Intro-Cinematics (Screenshake + Sound) | FUNKTIONIERT |
| Floor-Scaling (HP/ATK/DEF pro Floor) | FUNKTIONIERT |
| Line-of-Sight-basierte Erkennung | FUNKTIONIERT |
| Loot-Drops (Gold, Ressourcen, Soul Shards) | FUNKTIONIERT |

### Dungeon
| Feature | Status |
|---|---|
| BSP-Dungeon-Generator (80×45) | FUNKTIONIERT |
| 14 Tile-Typen | FUNKTIONIERT |
| Chests (Gold + Potion) | FUNKTIONIERT |
| 5 Event-Typen (Shrine, Merchant, Cursed Chest, Fountain, Prisoner) | FUNKTIONIERT |
| Floor-Select (ab Floor 5, in 5er-Schritten) | FUNKTIONIERT |
| Escape mit Run-Summary (S/A/B/C/D Rating) | FUNKTIONIERT |
| 50 Floors bis Final Boss | FUNKTIONIERT |

### Village
| Feature | Status |
|---|---|
| Begehbare Village-Map (50×80) | FUNKTIONIERT |
| 17 Gebäudetypen mit Bau/Upgrade | FUNKTIONIERT |
| Villager-Management (Recruit, Assign) | FUNKTIONIERT |
| Ressourcen-Produktion (30s Zyklen) | FUNKTIONIERT |
| Raid-System (Defense vs Raid Strength) | FUNKTIONIERT |
| Smithy (Waffen/Rüstung kaufen) | FUNKTIONIERT |
| Tavern (4 Run-Buffs) | FUNKTIONIERT |
| Temple (6 permanente Blessings) | FUNKTIONIERT |
| Warehouse (Inventar-Übersicht) | FUNKTIONIERT |
| 6 Gear-Shops (Waffen, Rüstung, Schmuck, Tränke, Essen) | FUNKTIONIERT |
| Dekorative NPCs | FUNKTIONIERT |
| Village-Tooltips beim Hovern | FUNKTIONIERT |

### Audio
| Feature | Status |
|---|---|
| Prozedurales SFX-System (15+ Sounds) | FUNKTIONIERT |
| Dungeon-Ambient-Drone | FUNKTIONIERT — monoton |
| Village-Ambient-Pad | FUNKTIONIERT — monoton |
| Mute-Toggle (M) | FUNKTIONIERT |
| Volume-Settings (Master/SFX/Music) | FUNKTIONIERT |
| Boss-spezifische SFX (Intro, Kill, Warning) | FUNKTIONIERT |

### Meta-Progression
| Feature | Status |
|---|---|
| Gold (verlierbar bei Tod) | FUNKTIONIERT |
| Soul Shards (permanent) | FUNKTIONIERT |
| Temple Blessings (6 permanente Upgrades) | FUNKTIONIERT |
| Tavern Buffs (4 pro-Run Buffs) | FUNKTIONIERT |
| Floor Checkpoints (5er-Schritte) | FUNKTIONIERT |
| Death's Embrace (30% Gold-Save bei Tod) | FUNKTIONIERT |
| Assist Mode (skaliert mit Deaths) | FUNKTIONIERT |
| Victory-State (Malphas besiegt) | FUNKTIONIERT |
| Run Stats Tracking | FUNKTIONIERT |

### UI
| Feature | Status |
|---|---|
| HUD (HP/MP/XP Bars, Gold, Floor, Abilities) | FUNKTIONIERT |
| Minimap | FUNKTIONIERT |
| Inventory Panel (I) | FUNKTIONIERT |
| Character Panel (C) + Stat Allocation | FUNKTIONIERT |
| Pause Menu + Settings | FUNKTIONIERT |
| Shop Panels (Smithy, Tavern, Temple, etc.) | FUNKTIONIERT |
| Build Menu | FUNKTIONIERT |
| Manage/Assign Menus | FUNKTIONIERT |
| Tutorial Hints (Dungeon) | FUNKTIONIERT |
| Info Tooltips (Village) | FUNKTIONIERT |
| Notifications (Floating Text) | FUNKTIONIERT |

### Electron/Packaging
| Feature | Status |
|---|---|
| Frameless Window (1280×720) | FUNKTIONIERT |
| Fullscreen Toggle (F11) | FUNKTIONIERT |
| electron-builder Config | FUNKTIONIERT |
| Build Scripts (win/mac/linux) | FUNKTIONIERT |
