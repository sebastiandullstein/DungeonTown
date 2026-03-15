# DungeonTown Honest Audit (Rev. 2)

## Status: PROTOTYPE (verbessert, aber noch nicht VERTICAL SLICE)

Seit dem letzten Audit wurden drei Optimierungs-Passes durchgeführt: Kampfgefühl (Screenshake/Hitstop/Slash-Arc/Kill-FX), Gegner-Dichte (kleinere Maps, Cluster-Spawns, mehr Feinde), Village-Streamlining (Quick-Reenter, Entrance-Glow, frühe Soul Shards). Das Fundament ist besser. Aber ein "spielbares 10-Minuten-Erlebnis" ist es immer noch nicht. Der Prototyp hat jetzt die richtigen Zahnräder — sie greifen nur noch nicht ineinander.

---

## Die ersten 60 Sekunden (aktualisiert)

1. **Titel-Screen**: Unverändert. Schwarzer Hintergrund, Courier New, drei Menüpunkte. Keine Musik vor dem ersten Klick. Erster Eindruck: Programmer Art. Das ist okay für den Prototyp, aber es setzt die Erwartung auf "Test-Build".

2. **Dorf**: Der Spieler steht auf (40,25), sieht grüne Tiles und farbige Gebäude-Rechtecke. NEU: Der Dungeon-Eingang pulsiert lila — das ist ein echtes Verbesserung, der Spieler weiß jetzt wohin. NPCs wandern herum und haben kontextabhängige Dialoge. Aber die Village bleibt im Kern leer und die erste Reaktion ist weiterhin: "Wo bin ich und warum?"

3. **Dungeon betreten**: Schneller als vorher, weil der Eingang sichtbar ist. E drücken, Floor 1 beginnt. NEU: Die Map ist jetzt 50×30 statt 80×45 — deutlich kleiner. FOV enthüllt weniger leere Fläche. Das ist besser.

4. **Erster Kampf**: NEU und merkbar verbessert. Der Spieler trifft früher auf Gegner (höhere Dichte + Cluster). Space drücken erzeugt jetzt: glühenden Slash-Arc, 5-8px Screenshake, spürbaren Hitstop, Enemy-Flash, Knockback ~1 Tile, Noise-Burst-Impact-Sound. Bei Kill: 10-16 Burst-Partikel + Screen-Flash. **Das fühlt sich substantiell besser an als vorher.** Es ist kein Vampire-Survivors-Level Juice, aber es ist jetzt ein Kampf und nicht mehr ein Tabellenkalkulationsevent.

5. **Die nächsten 30 Sekunden**: Hier beginnt das Problem. Nach dem ersten Cluster (2-4 Ratten) kommt... Laufen. Der Spieler sucht den nächsten Raum. Die Map ist kleiner, aber das BSP-Layout erzeugt trotzdem lange Korridore zwischen Räumen. Gegner-Cluster sind zufällig verteilt — manche Räume sind voll, andere leer. Es gibt keinen Rhythmus, keine Wellen, kein "alle 10 Sekunden kommt der nächste Kampf".

**Zusammenfassung:** Die ersten 15 Sekunden im Dungeon sind jetzt gut. Sekunde 15-60 fällt in ein Loch, weil der Dungeon ein Labyrinth ist und kein Arena-Flow.

---

## Was funktioniert

- **Das Kampfgefühl ist spürbar vorhanden.** Screenshake (5-8px), Hitstop (0.08-0.12s), Slash-Arc mit Glow, Enemy-Flash, Kill-Burst, Impact-Sound. Das ist jetzt ein funktionierendes Hit-Feedback-System. Nicht erstklassig, aber funktional. Crits fühlen sich anders an als normale Hits. Kills fühlen sich anders an als Crits. Das ist die richtige Hierarchie.

- **Cluster-Spawns erzeugen echte Kampfmomente.** 2-4 Gegner gleichzeitig in einem Raum zu bekämpfen ist fundamental anders als sie einzeln zu treffen. Whirlwind (Q) hat jetzt Situationen in denen es sich lohnt. Das ist der richtige Weg.

- **Quick-Reenter nach Tod ist eine massive QoL-Verbesserung.** [R] drücken → sofort zurück im Dungeon. Das eliminiert 15-20 Sekunden toten Flow zwischen Runs. Der Spieler der gerade sterben will, muss nicht durch ein leeres Dorf laufen.

- **Soul-Shard-Drops von normalen Gegnern (8%, 1-2 Shards) öffnen die Progression.** Vorher: Null Soul Shards bis Floor 5 Boss. Jetzt: Nach ~25 Kills hat der Spieler statistisch 2-3 Shards. Das reicht für eine billige Blessing. Die Temple-Progression fühlt sich nicht mehr gesperrt an.

- **Das Boss-System ist intakt.** Mini-Bosses mit Aura, Intro-Cinematic, erhöhter Screenshake, spezielle Sounds. Major-Bosses sind echte Checkpoints. Floor 50 Malphas mit Guards ist ein sichtbares Endziel. Die Struktur stimmt.

- **Die prozeduralen Sprites sind besser als erwartet.** Der Hero hat echte Pixel-Art (4 Richtungen, Walk-Animation). Enemies sind prozedural, aber die Silhouetten sind erkennbar: Ratten haben Schwanz und Ohren, Skelette haben Rippen, Drachen haben Flügel. Für einen Prototyp ist das ausreichend. Die Boss-Auren (Gold/Orange/Crimson Glow) differenzieren die Bedrohungsstufen visuell.

---

## Was sich schlecht anfühlt

### Kampf: Die zweite Ebene fehlt

- **Alle Gegner verhalten sich identisch.** Ratten, Fledermäuse, Skelette, Orks, Dämonen: idle → chase → attack. Kein Typ hat ein einzigartiges Verhalten. Fledermäuse könnten fliegen (Wände ignorieren), Skelette könnten Schilde haben (frontaler Block), Orks könnten chargen. Aber alle machen dasselbe: langsam auf den Spieler zulaufen und auf benachbartem Tile zuschlagen. Die höheren Werte (mehr HP, mehr ATK) machen sie zu dickeren Health-Bags, nicht zu anderen Gegnern.

- **Es gibt kein Telegraphing bei Gegner-Angriffen.** Der Spieler nimmt Schaden wenn ein Gegner neben ihm ist und der Attack-Timer runterläuft. Es gibt kein visuelles "Gleich kommt ein Schlag!" — kein Aufleuchten, kein Windup, keine Warnung. Der Spieler kann nicht lernen, Schläge zu dodgen, weil er sie nicht kommen sieht. In jedem Action-Spiel das funktioniert gibt es Telegraphing.

- **Dash fühlt sich "verschwendet" an.** 3 Tiles teleportieren, Ghost-Trail, 4s Cooldown. Mechanisch solide. Aber es gibt keinen Grund zu dashen. Gegner sind langsam, ihre Angriffe sind nicht telegraphed, es gibt keine Projektile denen man ausweichen müsste. Dash existiert als System, hat aber kein Problem das es löst.

- **Der Spieler steht beim Kämpfen still.** Optimale Strategie: In den Raum laufen, stehen bleiben, Space drücken bis alles tot ist. Es gibt keinen Anreiz, sich während des Kampfes zu bewegen. Keine AoE-Angriffe der Gegner, keine Positionierung, kein "Mist, ich muss hier weg!"-Moment. Das macht Kampf statisch und repetitiv.

### Dungeon: Korridor-Problem

- **BSP-Korridore fressen das Pacing auf.** Die Maps sind kleiner (gut), aber das BSP-Layout erzeugt L-förmige und U-förmige Korridore zwischen Räumen. Diese Korridore haben keine Gegner, keine Items, keine Events. Sie sind reine Laufzeit. Auf einer 50×30 Map sind das vielleicht 5-8 Sekunden Laufen pro Korridor. Bei 4-6 Korridoren pro Floor: 20-40 Sekunden tote Zeit pro Floor. Bei einem 3-Minuten-Floor ist das 15-25% "Nichts".

- **Es gibt keine visuellen Belohnungen beim Erkunden.** Der FOV-Radius ist 6 Tiles (+ Blessing). Alles außerhalb ist dunkel. Der Spieler sieht beim Laufen: Boden, Wand, Boden, Wand, Tür, Boden. Keine Ambiente-Details, keine Dekoration, keine Variation innerhalb der Räume. Dungeon-Themes (Frost, Magma, Abyss) ändern die Farbpalette, aber das Gefühl bleibt: leere Räume mit farbigen Wänden.

- **Item-Drops sind unsichtbar bis man drüberläuft.** Gold-Piles und Potions liegen auf dem Boden als kleine Sprites/Zeichen. Es gibt kein Glitzern, kein Aufleuchten, keinen "Loot beam" der sagt: "Hier liegt was!". Der Spieler kann an Items vorbeilaufen ohne sie zu bemerken.

### Village: Besser, aber immer noch ein Zwischenstopp

- **Quick-Reenter macht das Village optional — und deckt damit ein Design-Problem auf.** Wenn der beste Move nach dem Tod ist, die Village komplett zu überspringen, dann ist die Village in ihrer aktuellen Form kein Content sondern ein Hindernis. Das Quick-Reenter war die richtige Lösung für das Symptom, aber das Root-Problem bleibt: Die Village bietet in den ersten Runs keinen spürbaren Wert.

- **Die Smithy-Preise sind zu hoch für den frühen Spielverlauf.** Ein Tier-2-Schwert kostet ~80 Gold. Der Spieler verdient auf Floor 1-3 ca. 15-30 Gold pro Run (bei 50% Verlust bei Tod). Das sind 4-6 Runs bis zum ersten Equipment-Upgrade. In der Zeit hat der Spieler 4-6 mal "R" gedrückt und die Village nie besucht. Die Smithy ist irrelevant bis man Floor 5+ erreicht.

- **Die Tavern-Buffs sind schlecht kommuniziert.** 4 Buffs hinter einer Textliste ohne visuelle Differenzierung. Der Spieler sieht "+15% ATK, 40 Gold" und fragt sich: "Ist das viel? Lohnt sich das?" Keine Vorher/Nachher-Anzeige, kein "Dein nächster Run wird X besser".

### Audio: Monotonie

- **Die Dungeon-Musik ist ein stehender Drone.** 55Hz + 82.5Hz + Noise + LFO. Das war im letzten Audit Problem und ist unverändert. Nach 2 Minuten wird es zu Hintergrund-Brummen. Es gibt keine musikalische Veränderung zwischen Floor 1 und Floor 49 (außer dem Boss-Floor-Warning-Sound).

- **Die SFX-Hierarchie stimmt nicht.** Der Attack-Sound ist gut (Sweep + Noise-Burst). Aber der Enemy-Death-Sound ist ein leiser 150ms Klang. Kill und Hit klingen zu ähnlich. Der Spieler braucht sofortiges akustisches Feedback: "Das war ein Kill" vs. "Das war ein Hit". Boss-Kill-Sound ist da und gut, aber normale Kills brauchen mehr Unterscheidung.

---

## Der Core Loop (ehrlich)

### Was ist der aktuelle Loop?

```
Dorf (optional: Smithy/Tavern/Temple)
→ Dungeon betreten (oder [R] drücken nach Tod)
→ Kleinere Maps mit Gegner-Clustern durchkämpfen
→ Items/Gold/Soul Shards sammeln, Events nutzen
→ Sterben oder Flucht
→ [R] für Quick-Reenter ODER Village besuchen
→ Permanente Upgrades kaufen (Temple Blessings)
→ Wieder rein
```

### Macht er in 30 Sekunden Spaß?

**Fast.**

Die ersten 10 Sekunden im Dungeon: FOV öffnet sich, erster Raum, Cluster von 3 Ratten. Space drücken, Slash-Arc, Screenshake, Kill-Burst. Das ist jetzt ein Moment. Dann läuft der Spieler 5-8 Sekunden durch einen Korridor. Dann nächster Raum, vielleicht 2 Fledermäuse. Wieder Kampf. Das ist okay.

Das Problem ist nicht die Kampf-Sekunde, sondern die Sekunden dazwischen. Der Loop hat jetzt einen funktionierenden "Hit" (Space-Angriff-Kill-Feedback) aber keinen funktionierenden "Flow" (kontinuierliche Spannung).

### Vergleich: Was macht Vampire Survivors / Brotato in 30 Sekunden, was DungeonTown nicht tut?

**Konstanter Druck.** In VS/Brotato gibt es keine "Leerlauf-Sekunden". Der Bildschirm hat immer etwas das auf den Spieler zukommt. DungeonTown hat Spike-Momente (Kampf in Räumen) mit Tälern dazwischen (leere Korridore). Der Spieler muss sich nicht entscheiden "gehe ich links oder rechts", weil beide Wege gleich sind: Korridor → Raum → Korridor.

**Entscheidungen pro Minute.** In VS/Brotato trifft der Spieler alle 30-60 Sekunden eine Upgrade-Entscheidung. In DungeonTown trifft er in den ersten 3 Floors keine einzige bedeutsame Entscheidung. "Soll ich den Potion aufheben?" ist keine Entscheidung. "Welche von drei Waffen nehme ich?" wäre eine. Events ab Floor 2 bieten das — Blood Shrine mit drei Optionen ist tatsächlich gut designt. Aber sie sind zu selten (1-2 pro Floor) und kommen zu spät.

**Sichtbare Progression innerhalb eines Runs.** In VS sieht der Spieler seine Waffe stärker werden, mehr Projektile, größere AoE. In DungeonTown sieht der Spieler: XP-Bar füllt sich, Level-Up (+3 Stat Points, die er manuell vergeben muss und deren Auswirkung er nicht sieht). Das Level-Up ist ein Buchhalterischer Vorgang, kein visueller Moment.

---

## Die 3 wichtigsten Probleme

### 1. Kein Gegner-Verhalten, nur Gegner-Werte (Impact: Kritisch)

Das fundamentale Kampf-Problem ist nicht mehr das Feedback (das ist jetzt okay) sondern der Inhalt. Jeder Gegner ist ein HP-Pool der auf den Spieler zuläuft. Der Spieler entwickelt keine Strategie, lernt keine Patterns, passt sich nie an. Die optimale Taktik auf Floor 1 (stehen bleiben, Space drücken) ist dieselbe auf Floor 40 (stehen bleiben, Space drücken, manchmal Q drücken).

Ohne unterschiedliches Gegner-Verhalten gibt es keinen Grund, Dash zu benutzen, gibt es keine "schwierigen" Räume, gibt es keine Skill-Progression beim Spieler. Es wird nur ein Zahlenspiel: Ist mein ATK hoch genug?

**Was es braucht:** 2-3 Gegner-Typen mit sichtbar anderem Verhalten. Nicht alle 7 — nur die häufigsten. Beispiel: Fledermäuse die durch Wände fliegen und abrupt die Richtung wechseln. Skelette die einen Schlag blocken bevor sie angreifbar sind. Orks die chargen (2-3 Tiles schnelle Bewegung + Warnung). Das allein würde den Kampf von "reaktionslos" zu "ich muss aufpassen" verwandeln.

### 2. Korridore und Leerlauf zerstören das Pacing (Impact: Hoch)

Die Map-Verkleinerung war richtig, aber das BSP-Korridor-Layout ist das eigentliche Problem. Korridore sind tote Zeit. Sie haben keine Gegner, keine Items, keine Spannung. Sie existieren nur als Verbindung zwischen Räumen. In einem Roguelite sollte jeder Schritt entweder Kampf, Loot oder Entscheidung sein.

**Was es braucht:** Korridore sollten kürzer sein oder Gegner enthalten. Alternative: Gegner spawnen auch in Korridoren (nicht nur in Räumen). Oder: Korridore ganz eliminieren und Räume direkt verbinden. Das BSP-Layout mit seinen langen L-Korridoren ist ein Roguelike-Muster das für Turn-Based-Spiele funktioniert, aber nicht für ein Action-Roguelite.

### 3. Kein In-Run-Progressionsgefühl (Impact: Hoch)

Der Spieler wird stärker (Level-Up, Stat Points, Items), aber er SIEHT es nicht. In Vampire Survivors sieht man buchstäblich mehr Projektile auf dem Screen. In DungeonTown ändert sich "+2 ATK" in einer Zahl im HUD und der Spieler macht 2 Damage mehr pro Hit. Das ist kein Progressionsgefühl, das ist Buchhaltung.

**Was es braucht:** Sichtbare Macht-Indikatoren. Wenn der Spieler stärker wird, sollte sein Slash-Arc größer werden. Oder seine Angriffsgeschwindigkeit sichtbar steigen. Oder er sollte ab einem gewissen Level zwei Enemies gleichzeitig töten können wo vorher nur einer starb. Die Zahlen im HUD sind für Optimierer — das Gefühl auf dem Screen ist für alle.

---

## Empfehlung: Der eine nächste Schritt

**Eine Session (2 Stunden): Gegner-Verhalten differenzieren.**

Von den drei Problemen oben hat #1 den größten Impact mit dem geringsten Aufwand. Die KI-State-Machine in `enemies.js` (`idle/chase/attack`) ist bereits vorhanden. Man muss sie nur pro Typ erweitern.

Konkreter Plan:
1. **Fledermäuse: Erratische Bewegung.** Im `chase`-State nicht direkt zum Spieler laufen, sondern mit 50% Chance einen zufälligen benachbarten Move machen. Das macht sie unberechenbar und nerviger als Ratten (→ verschiedene Gegner-Identität). ~15 Zeilen Code.

2. **Skelette: Frontaler Block.** Neuer State `block`: Wenn der Spieler in Angriffsreichweite ist und das Skelett gerade NICHT angreift, 50% Chance den nächsten Schlag zu blocken (halber Schaden, kein Knockback, "BLOCKED" Floating Text). Zwingt den Spieler, Positioning zu nutzen (von hinten angreifen) oder Whirlwind für AoE. ~25 Zeilen Code.

3. **Orks: Charge-Attacke.** Neuer State `charge`: Wenn der Ork den Spieler sieht und 4+ Tiles entfernt ist, Telegraph (1s Aufleuchten in Rot) → 3-Tile-Rush in gerader Linie zum Spieler. Trifft er, doppelter Schaden + Knockback auf den Spieler. Trifft er nicht, ist er 1s betäubt. Zwingt den Spieler zum Dodgen. ~30 Zeilen Code.

Das sind ~70 Zeilen Code für drei Gegner-Verhalten die den Kampf fundamental verändern. Der Spieler muss plötzlich aufpassen, sich bewegen, Timing nutzen. Dash hat einen Zweck (Orc-Charge dodgen). Execute hat einen Zweck (Skelett-Block umgehen). Die bestehenden Systeme werden relevant.

Alles andere (Korridore, In-Run-Progression) kann danach kommen. Aber ohne verschiedene Gegner-Verhalten ist der Kampf ein Tapping-Game, egal wie viel Juice man drauf packt.

---

## Roher Feature-Bestand (aktualisiert)

### Core Systems
| Feature | Status | Seit letztem Audit |
|---|---|---|
| Game Loop (requestAnimationFrame) | FUNKTIONIERT | — |
| 3-Layer Canvas Renderer | FUNKTIONIERT | — |
| Tile Rendering (5 Themes + Wang-Tileset) | FUNKTIONIERT | — |
| Sprite Rendering (Player Pixel-Art, 4 Dir + Walk) | FUNKTIONIERT | — |
| Sprite Rendering (Enemies Procedural, 13 Typen) | FUNKTIONIERT | — |
| FOV / Line-of-Sight | FUNKTIONIERT | — |
| Input Handler (Keyboard + Mouse) | FUNKTIONIERT | — |
| Screen Shake | FUNKTIONIERT | **VERBESSERT** (5-8px normal, 12-14px Boss) |
| Hit Stop (Freeze Frames) | FUNKTIONIERT | **VERBESSERT** (0.08-0.12s normal, 0.15-0.18s Boss) |
| Enemy Flash bei Treffer | FUNKTIONIERT | **NEU** |
| Slash-Arc-Effekt (Angriff) | FUNKTIONIERT | **NEU** |
| Kill-Burst-Partikel | FUNKTIONIERT | **NEU** |
| Screen-Flash bei Kill | FUNKTIONIERT | **NEU** |
| Save/Load (localStorage) | FUNKTIONIERT | — |

### Spieler
| Feature | Status | Seit letztem Audit |
|---|---|---|
| Tile-basierte Bewegung (WASD) | FUNKTIONIERT | **SCHNELLER** (0.07s statt 0.1s) |
| Melee-Angriff (Space, 3-Tile-Arc) | FUNKTIONIERT | **VERBESSERT** (Slash-Arc + Sound) |
| Dash (Shift, 3 Tiles, I-Frames) | FUNKTIONIERT | — |
| Whirlwind (Q, AoE, Mana-Cost) | FUNKTIONIERT | — |
| Execute (E, Single-Target, Instakill <25% HP) | FUNKTIONIERT | — |
| Knockback | FUNKTIONIERT | **VERBESSERT** (1.0-1.8 Tiles) |
| Equipment (6 Slots) | FUNKTIONIERT | — |
| Inventory (20 Slots) | FUNKTIONIERT | — |
| Stat-System (STR/DEX/VIT/INT + Getters) | FUNKTIONIERT | — |
| Level-Up (+3 Stat Points) | FUNKTIONIERT | — |
| Potions (HP/MP, 5 Tiers) | FUNKTIONIERT | — |
| Food Buffs (temporär) | FUNKTIONIERT | — |
| Death Save (1x pro Run) | FUNKTIONIERT | — |
| Desperate Fury (+30% ATK <20% HP) | FUNKTIONIERT | — |

### Kampf & Gegner
| Feature | Status | Seit letztem Audit |
|---|---|---|
| Damage Calculation + 10% Crit | FUNKTIONIERT | — |
| Floating Damage Numbers (Glow + Outline) | FUNKTIONIERT | — |
| Hit Particles (3-5 pro Hit) | FUNKTIONIERT | — |
| Combat Log (7 Entries, Fade) | FUNKTIONIERT | — |
| 7 Gegnertypen (rat → demonLord) | FUNKTIONIERT — **alle verhalten sich identisch** | — |
| 3-State KI (idle/chase/attack) | FUNKTIONIERT — **keine typ-spezifischen Patterns** | — |
| Gegner-Cluster-Spawns (2-4 pro Gruppe) | FUNKTIONIERT | **NEU** |
| Erhöhte Detection-Radien | FUNKTIONIERT | **NEU** (Rat 8, Bat 10, etc.) |
| Schnellere Chase-Speed (×0.45) | FUNKTIONIERT | **NEU** |
| Mini/Major/Final-Bosses | FUNKTIONIERT | — |
| Boss-Intro-Cinematics | FUNKTIONIERT | — |
| Soul-Shard-Drops (Bosse + 8% Normal) | FUNKTIONIERT | **ERWEITERT** |

### Dungeon
| Feature | Status | Seit letztem Audit |
|---|---|---|
| BSP-Dungeon-Generator | FUNKTIONIERT | **SKALIERT** (50×30 bis 80×45) |
| 14 Tile-Typen | FUNKTIONIERT | — |
| Chests (Gold + Potion) | FUNKTIONIERT | — |
| 5 Event-Typen | FUNKTIONIERT | — |
| Floor-Select (5er-Schritte) | FUNKTIONIERT | — |
| Escape + Run-Summary (S/A/B/C/D) | FUNKTIONIERT | — |
| 50 Floors bis Final Boss | FUNKTIONIERT | — |

### Village & Meta
| Feature | Status | Seit letztem Audit |
|---|---|---|
| Begehbare Village-Map | FUNKTIONIERT | — |
| Dungeon-Eingang-Glow (pulsierend, lila) | FUNKTIONIERT | **NEU** |
| Quick-Reenter nach Tod/Flucht [R] | FUNKTIONIERT | **NEU** |
| 17 Gebäudetypen mit Bau/Upgrade | FUNKTIONIERT | — |
| Villager-Management | FUNKTIONIERT | — |
| Ressourcen-Produktion (30s Zyklen) | FUNKTIONIERT | — |
| Raid-System | FUNKTIONIERT | — |
| Smithy / Tavern / Temple / Warehouse | FUNKTIONIERT | — |
| 6 Gear-Shops | FUNKTIONIERT | — |
| Death/Escape-Reactions (kontextabhängig) | FUNKTIONIERT | — |
| Temple Blessings (6 permanent) | FUNKTIONIERT | — |
| Tavern Buffs (4 pro-Run) | FUNKTIONIERT | — |
| Floor Checkpoints | FUNKTIONIERT | — |

### Audio
| Feature | Status | Seit letztem Audit |
|---|---|---|
| Prozedurales SFX (15+ Sounds) | FUNKTIONIERT | — |
| Attack-Sound (Sweep + Noise-Burst) | FUNKTIONIERT | **VERBESSERT** |
| Dungeon-Ambient-Drone | FUNKTIONIERT — **monoton** | — |
| Village-Ambient-Pad | FUNKTIONIERT — **monoton** | — |
| Boss-SFX (Intro, Kill, Warning) | FUNKTIONIERT | — |
| Mute + Volume-Settings | FUNKTIONIERT | — |

### UI
| Feature | Status | Seit letztem Audit |
|---|---|---|
| HUD (HP/MP/XP, Gold, Floor, Abilities) | FUNKTIONIERT | — |
| Minimap | FUNKTIONIERT | — |
| Inventory Panel (I) | FUNKTIONIERT | — |
| Character Panel (C) + Stat Allocation | FUNKTIONIERT | — |
| Pause Menu + Settings | FUNKTIONIERT | — |
| Shop Panels | FUNKTIONIERT | — |
| Tutorial Hints (Dungeon) | FUNKTIONIERT | — |
| Tooltips (Village) | FUNKTIONIERT | — |
| Notifications | FUNKTIONIERT | — |
| Build/Manage/Assign/Recruit Menus | FUNKTIONIERT | — |

### Electron/Packaging
| Feature | Status | Seit letztem Audit |
|---|---|---|
| Frameless Window (1280×720) | FUNKTIONIERT | — |
| Fullscreen Toggle (F11) | FUNKTIONIERT | — |
| electron-builder Config | FUNKTIONIERT | — |
| Build Scripts (win/mac/linux) | FUNKTIONIERT | — |

---

## Fortschritts-Zusammenfassung seit Audit Rev. 1

| Problem aus Rev. 1 | Status | Was gemacht |
|---|---|---|
| Kampfgefühl ist leer | **BEHOBEN** | Screenshake ×2-3, Hitstop ×2-3, Enemy-Flash, Slash-Arc, Impact-Sound, Kill-Burst, Screen-Flash |
| Keine Dichte/kein Druck | **TEILWEISE BEHOBEN** | Kleinere Maps, mehr Enemies, Cluster-Spawns, schnellere Bewegung, größerer Aggro-Radius |
| Village ist ein Blocker | **TEILWEISE BEHOBEN** | Quick-Reenter [R], Dungeon-Glow, Soul-Shard-Drops von normalen Gegnern |

### Neue Probleme erkannt (nicht im Rev. 1)
1. Alle Gegner verhalten sich identisch (nur Werte unterscheiden sie)
2. BSP-Korridore erzeugen tote Laufzeit
3. Kein sichtbares In-Run-Progressionsgefühl
