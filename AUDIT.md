# DungeonTown Honest Audit (Rev. 3)

## Status: VERTICAL SLICE

Seit dem letzten Audit wurden vier weitere Passes durchgeführt: Gegner-Verhalten (Bat erratisch, Skeleton Block, Orc Charge, Demon Blink, Dragon Breath), Korridor-Optimierung, In-Run-Progression und ein Polish Pass (Audio, Loot-Glow, Preise). Das Spiel ist von "technischer Prototyp mit Feature-Checkliste" zu "spielbare erste 10 Minuten" übergegangen. Es ist noch kein Alpha — dafür fehlen Content-Tiefe und Balancing. Aber zum ersten Mal kann man es jemandem geben und sagen: "Spiel 10 Minuten und sag, was fehlt."

---

## Die ersten 60 Sekunden

1. **Titel-Screen**: Schwarzer Hintergrund, "DungeonTown" in Courier New. Keine Musik vor dem ersten Klick (Web Audio Policy). Drei Menüpunkte. Das ist weiterhin Programmer Art — aber für einen Vertical Slice akzeptabel. Kein Spieler urteilt über ein Spiel an seinem Titel-Screen.

2. **Dorf (5 Sekunden)**: Der Spieler steht auf (40,25). Ein lila pulsierender Glow markiert den Dungeon-Eingang oben auf der Map — das ist sofort sichtbar. NPCs wandern mit kontextabhängigen Dialogen. Farbige Gebäude-Rechtecke mit Labels. Quick-Reenter-Prompt nach Tod/Flucht: [R] drücken → direkt zurück. **Die Navigation ist gelöst.** Der Spieler weiß, wo er hin muss.

3. **Dungeon betreten (Sekunde 5-15)**: Floor 1 ist 50×30 Tiles — kompakt. FOV enthüllt sofort den ersten Raum. Das Dungeon-Drone startet mit einem hörbaren Unterschied je nach Floor-Tiefe. Innerhalb von 3-5 Schritten (bei 0.07s moveDelay = ~0.5 Sekunden) trifft der Spieler auf den ersten Gegner-Cluster.

4. **Erster Kampf (Sekunde 15-30)**: Cluster von 2-4 Ratten. Space drücken erzeugt: glühenden Slash-Arc, 5-8px Screenshake, 0.08s Hitstop, Enemy-Flash (brightness 3×), Noise-Burst-Impact-Sound, 1.0 Tile Knockback. Bei Kill: 10-16 Burst-Partikel, Screen-Flash, tiefer Triangle-Thud (0.2s, deutlich anders als Hit-Sound). **Das fühlt sich jetzt wie Kampf an.** Nicht Vampire-Survivors-Level, aber substantiell.

5. **Nächste 30 Sekunden**: Der Spieler bewegt sich durch den nächsten Gang — hier tauchen jetzt Korridor-Enemies auf (25% der Spawns). Die Laufzeit zwischen Kämpfen ist kürzer (kürzere Korridore, Room-Edge statt Center-Verbindung). Im zweiten Raum: 3 Fledermäuse, die erratisch zickzacken statt geradeaus zu laufen. Das fühlt sich anders an als der Ratten-Cluster. Der Spieler muss sich bewegen. Auf dem Boden pulsiert ein gelber Glow (Gold) und ein blauer Glow (Potion) — beides sofort sichtbar.

**Zusammenfassung:** Die ersten 60 Sekunden haben jetzt einen funktionierenden Flow: Dorf (5s) → Dungeon (10s Orientierung) → Kampf (15s Cluster) → Exploration mit Zwischengegnern (30s) → nächster Raum. Kein Leerlauf mehr. Die Frage ist nicht mehr "Was soll ich tun?" sondern "Schaffe ich noch einen Raum?".

---

## Was funktioniert

- **Das Kampfgefühl hat eine klare Hierarchie.** Normaler Hit (5px Shake, 0.08s Hitstop) → Crit (7px, 0.12s, orangener Text) → Kill (8px, 0.12s, Burst-Partikel, Screen-Flash, Thud-Sound) → Boss-Kill (14px, 0.18s, spezielle SFX). Der Spieler spürt den Unterschied. Jede Stufe fühlt sich anders an.

- **Jeder Gegnertyp hat eine eigene Identität.**
  - Ratten: einfach, schnell tot (Einstieg)
  - Fledermäuse: erratisch, schnell, nervig (Bewegungsdruck)
  - Skelette: Frontalblock, "BLOCKED"-Text, blauer Schild-Glow (Positionierung/AoE erzwingen)
  - Orks: Charge-Rush mit 0.8s Telegraph, "!"-Warnung (Dash-Trigger, Timing-Fenster)
  - Dämonen: Blink-Teleport hinter den Spieler, pinke Partikel (360°-Aufmerksamkeit)
  - Drachen: Flammenhauch-AoE, 0.6s Telegraph, 1.5× Schaden (Positionierung + Ausweichen)

  Das ist eine echte Gegner-Hierarchie. Der Spieler entwickelt gegen jeden Typ eine andere Strategie. Skelette von hinten angreifen. Ork-Charges dashen. Dämonen sofort drehen. Drachen-Telegraph ausweichen. **Das ist der größte Fortschritt seit dem ersten Audit.**

- **Die Musik reagiert auf die Floor-Tiefe.** Drone-Pitch sinkt, Heartbeat-Pulse ab Floor 3 (wird schneller), dissonante Tension-Layer ab Floor 15. Der Spieler merkt: "Es wird tiefer." Das ist keine Komposition, aber es ist adaptive Atmosphäre — und für prozedurales Audio beachtlich.

- **Loot-Items sind sofort sichtbar.** Gelber Puls für Gold, blauer Puls für Potions. Der Spieler läuft nicht mehr an Items vorbei. Das klingt trivial, aber es eliminiert 100% der "Hab ich was verpasst?"-Momente.

- **Die Smithy ist jetzt im Early Game relevant.** Dagger für 5 Gold, Short Sword für 15 Gold — nach einem einzigen Run auf Floor 1-3 (15-30 Gold Ertrag) kann der Spieler sein erstes Upgrade kaufen. Die Progression beginnt ab Run 1 statt ab Run 5.

- **Quick-Reenter [R] + Floor-Checkpoints machen den Loop tight.** Tod → [R] → sofort zurück im Dungeon (oder ab Floor 5: Floor-Select → zurück auf höchstem Checkpoint). Die tote Zeit zwischen Runs ist von 15-20 Sekunden auf unter 3 Sekunden gesunken.

- **In-Run-Progression ist sichtbar.** Slash-Arc wächst mit Level (Radius 26→38, Span 1.1→1.8 rad). Level-Up erzeugt Screenshake + gelbe Partikel-Explosion. Blaue Power-Aura ab Level 5 (wächst bis Level 20). Der Spieler SIEHT, dass er stärker wird — nicht nur in Zahlen.

- **Die Meta-Progression greift ab Run 1.** Soul Shards droppen jetzt auch von normalen Gegnern (8%, 1-2 Shards). Nach ~25 Kills hat der Spieler 2-3 Shards → genügt für Death's Embrace (10 Shards) nach 2-3 Runs. Temple ist ab Run 2-3 nutzbar statt erst ab Floor 5.

---

## Was sich schlecht anfühlt

### Kampf: Die Tiefe fehlt noch

- **Die optimale Strategie gegen Ratten und Fledermäuse ist weiterhin: stehen bleiben, Space drücken.** Ratten haben kein gefährliches Verhalten. Fledermäuse sind erratisch, aber ihr Schaden ist zu niedrig um bedrohlich zu sein (3 ATK auf Floor 1). Der Spieler entwickelt erst ab Skeletten (Floor 2) eine Strategie. Die ersten 2-3 Floors sind mechanisch flach.

- **Skeleton-Block-Timing ist inkonsistent.** Der Block wird per `Math.random() < 0.003` pro Frame aktiviert — das ist nicht vorhersagbar. Ein gutes Block-System braucht einen Rhythmus: Block-Phase → Angriffs-Phase → Block-Phase. Aktuell ist der Block zufällig und der Spieler kann ihn nicht antizipieren. Es fühlt sich nicht nach "ich habe gelernt, den Block zu umgehen" an, sondern nach "manchmal macht er halt dicht".

- **Dash hat jetzt einen Zweck (Orc Charge dodgen), aber nur gegen einen Gegnertyp.** Gegen alle anderen Feinde ist Dash überflüssig. Fledermäuse sind zu schwach um ihnen auszuweichen, Skelette stehen direkt neben einem, Ratten sind harmlos. Dash braucht mehr Situationen in denen er essentiell ist — Projektile, AoE-Zonen, Ring-Angriffe.

- **Whirlwind (Q) und Execute (E) sind situativ, aber selten optimal.** Whirlwind kostet 8 Mana und macht 2× ATK in 2.5-Tile-Radius. Aber ein normaler Angriff trifft 3 Tiles in Blickrichtung und kostet nichts. Execute ist stark gegen einzelne Targets (<25% HP Instakill), aber der Cooldown (10s) und Mana-Cost (15) machen ihn ineffizient bei normalen Gegnern. Beide Abilities fühlen sich nach "Notfall" an statt nach "Teil meines Rotations".

### Dungeon: Content-Wiederholung

- **Nach 3 Floors hat der Spieler alles gesehen.** Floor 1: Ratten + Fledermäuse. Floor 2: + Skelette. Floor 3: + Orks. Danach ändert sich nur noch die Dichte und die Zahlen. Events (Shrine, Merchant, Cursed Chest, Fountain, Prisoner) sind gut designt, aber zu selten — 1-2 pro Floor, und der Spieler muss sie zufällig finden. Es gibt keinen "Oh, das ist neu!"-Moment zwischen Floor 3 und Floor 5 (erster Mini-Boss).

- **Die Dungeon-Themes (Frost, Magma, Abyss) ändern nur die Farbpalette.** Keine neuen Tile-Typen, keine Theme-spezifischen Gefahren (Eisfelder, Lavapools, Dunkelheitszonen). Das ist verschwendetes Potenzial — die visuelle Infrastruktur für Themes existiert, wird aber nicht genutzt.

- **Keine Raum-Variation.** Jeder Raum ist ein Rechteck mit Wänden. Keine Säulen zum Verstecken, keine Fallen, keine Terrain-Features. BSP-Räume sehen alle gleich aus — nur die Größe variiert (5-9 Tiles auf frühen Floors).

### Village: Funktional, aber seelenlos

- **Die Village-Simulation (17 Gebäude, Ressourcen, Villager, Raids) ist Feature-Bloat für den aktuellen Spielstand.** Der Spieler nutzt realistisch 3-4 Gebäude: Smithy, Tavern, Temple, Dungeon-Eingang. Die restlichen 13 Gebäudetypen (Farm, Lumber Mill, Quarry, Barracks, Walls, Inn, Apothecary, Weaponsmith, Armorsmith, Jewelry, Pharmacy, Food Store, Blacksmith) existieren als System, werden aber vom Spieler in den ersten 30 Runs kaum besucht. Die Villager-Rekrutierung, Ressourcen-Produktion und das Raid-System sind vollständig implementiert — und vollständig irrelevant für das Kernerlebnis.

- **Die NPCs sagen interessante Dinge, die niemand liest.** Die kontextabhängigen Dialoge (Tod-Reaktionen, Floor-Meilensteine, Villager-Kommentare) sind gut geschrieben. Aber der Spieler drückt [R] und überspringt alles. Es gibt keinen Anreiz, mit NPCs zu reden, weil ihre Dialoge keine Gameplay-Konsequenz haben.

### Audio: Besser, aber lückenhaft

- **Der Skeleton-Block hat keinen eigenen Sound.** "BLOCKED" als Text ist gut, aber es fehlt ein akustisches "Klang!"-Feedback. Aktuell wird `playerHurt` als Clank-Ersatz verwendet — das ist der Sound den der Spieler hört wenn ER getroffen wird. Das verwirrt.

- **Demon-Blink und Dragon-Breath haben keine eigenen SFX.** Blink erzeugt Partikel, aber keinen Sound. Dragon-Breath erzeugt Partikel und Screenshake, aber keinen Feuer-Sound. Das sind die aufregendsten Momente im Spiel — und sie klingen wie Stille + generischer `playerHurt`.

---

## Der Core Loop (ehrlich)

### Was ist der aktuelle Loop?

```
[R] oder Dorf → Dungeon betreten
→ Kompakte Floors mit Gegner-Clustern + Korridor-Enemies durchkämpfen
→ Verschiedene Gegner-Typen erfordern verschiedene Taktiken
→ Items/Gold/Soul Shards sammeln, Events nutzen
→ Boss alle 5 Floors (Mini/Major/Final)
→ Sterben oder Flucht
→ [R] für sofortigen Retry ODER Village für Smithy/Tavern/Temple
→ Permanente Upgrades + Equipment → Wieder rein
```

### Macht er in 30 Sekunden Spaß?

**Ja, mit Einschränkungen.**

Die ersten 30 Sekunden im Dungeon haben jetzt einen Rhythmus: Betreten → erster Kampf (Cluster) → Loot aufsammeln → kurzer Gang mit Korridor-Enemy → nächster Raum → anderer Gegnertyp. Es passiert ständig etwas. Das Kampfgefühl ist befriedigend. Der Spieler trifft in 30 Sekunden auf 6-8 Gegner statt auf 1-2.

Die Einschränkung: Der Spieler entwickelt keine Strategie in den ersten 30 Sekunden. Floor 1 hat Ratten und Fledermäuse — beide sterben in 2-3 Hits, keiner ist bedrohlich. Die strategische Tiefe (Skeleton-Block, Orc-Charge, Demon-Blink) kommt erst ab Floor 2-3. Die ersten 30 Sekunden sind befriedigend, aber nicht spannend.

### Vergleich: Was machen Referenzspiele anders?

**Vampire Survivors:** Auto-Attack, Masse an Feinden, XP-Gems-Feedback, Level-Up-Entscheidung nach 15 Sekunden. DungeonTown hat jetzt die Masse (Cluster-Spawns), das Hit-Feedback und die Meta-Progression. Was fehlt: automatische/frequente Upgrade-Entscheidungen innerhalb eines Runs.

**Brotato:** Arena-Wellen, automatisches Zielen, Shop zwischen Wellen alle 30 Sekunden. DungeonTown hat keine Wellen — es hat Räume. Die Struktur ist anders (Exploration statt Arena), aber das Ergebnis sollte dasselbe sein: regelmäßige Entscheidungsmomente. Events kommen zu selten für diesen Zweck.

**20 Minutes Till Dawn:** Richtungswechsel der Feinde, Projektile zum Ausweichen, Eliten mit Patterns. DungeonTown hat jetzt Patterns (Orc Charge, Dragon Breath, Demon Blink). Das ist der richtige Weg. Es braucht mehr davon — besonders in den ersten 3 Floors.

---

## Die 3 wichtigsten Probleme

### 1. Die ersten 3 Floors sind strategisch flach (Impact: Hoch)

Ratten und Fledermäuse — die beiden Gegner auf Floor 1 — haben keine bedrohlichen Mechaniken. Der Spieler muss nichts lernen, nichts antizipieren, nichts dodgen. Die Kampfstrategie auf Floor 1 ist: "Lauf hin, drück Space." Die interessanten Gegner (Skeleton Block, Orc Charge) kommen erst auf Floor 2-3. Das bedeutet: Die kritischste Phase des Spiels (erste 3 Minuten, erste Eindrücke) hat die langweiligste Taktik.

**Was es braucht:** Fledermäuse brauchen ein bedrohliches Element das Dash erzwingt — z. B. einen Sturz-Angriff (telegraph + schneller Drop von 3 Tiles, wenn in Linie) der mehr Schaden macht als ein normaler Hit. Oder Ratten brauchen Pack-Verhalten: einzeln harmlos, aber wenn 3+ in Reichweite sind, bekommen alle +50% Angriffsgeschwindigkeit. Etwas, das den Spieler ab Sekunde 1 zum Bewegen zwingt.

### 2. Zu wenige Entscheidungsmomente innerhalb eines Runs (Impact: Hoch)

Der Spieler trifft in einem 3-Minuten-Run auf Floor 1-3 folgende Entscheidungen:
- Level-Up: +3 Stat Points verteilen (1-2× pro Run) — das ist ein Menü, kein Moment
- Events: Shrine/Merchant/Fountain (0-2× pro Run) — zu selten
- Items: "Nehme ich den Potion mit?" — keine echte Entscheidung

Im Vergleich: In Vampire Survivors trifft der Spieler alle 20-30 Sekunden eine Upgrade-Entscheidung aus 3-4 Optionen. In Brotato gibt es nach jeder Welle (30-60 Sekunden) einen Shop mit Entscheidungen. DungeonTown hat im Durchschnitt alle 90 Sekunden eine Entscheidung. Das ist zu selten.

**Was es braucht:** Mehr Events, öfter. Oder: Jeder Raum hat eine kleine Entscheidung — z. B. zwei Ausgänge wovon einer schwieriger aber lohnender ist. Oder: Gegner droppen manchmal Wahl-Items (wähle zwischen +ATK und +HP). Der Spieler muss regelmäßig "Was wähle ich?" denken, nicht nur "Wo ist der nächste Raum?".

### 3. Skeleton-Block-System ist spielerisch unbefriedigend (Impact: Mittel)

Der Block wird per `Math.random() < 0.003` pro Frame aktiviert — das ist ungefähr alle 5-6 Sekunden im Attack-State. Der Spieler kann nicht lernen, wann der Block kommt, weil er zufällig ist. Das macht den Block frustrierend statt herausfordernd. Ein gutes Block-System wäre vorhersagbar: Skeleton blockt IMMER den ersten Schlag nach Kontakt, dann lässt er den Schild für 1s fallen → Angriffsfenster. Das gibt dem Spieler etwas zum Lernen.

---

## Empfehlung: Der eine nächste Schritt

**Eine Session (2 Stunden): Mehr Entscheidungsmomente pro Run.**

Die größte Lücke im Core Loop ist jetzt nicht mehr das Feel (das ist solide), sondern der Entscheidungs-Rhythmus. Der Spieler tut zu lange dasselbe (kämpfen) ohne eine Wahl zu treffen.

Konkreter Plan:
1. **Mini-Events in jedem Raum** — Nach dem Räumen eines Raums (alle Enemies tot) spawnt mit 40% Chance ein kleines Angebot: z. B. ein Altar mit zwei Optionen ("Opfere 10 HP für +2 ATK bis zum nächsten Floor" vs. "Opfere 5 Mana für sofortige HP-Heilung"). Das sind 2-3 Entscheidungen pro Floor, alle 30-45 Sekunden. ~50 Zeilen Code im Event-System.

2. **Fledermaus-Sturzangriff** — Wenn die Fledermaus in gerader Linie (horizontal/vertikal) zum Spieler steht und 3+ Tiles entfernt: 0.5s Telegraph (rotes Aufleuchten) → Rush auf den Spieler. Trifft sie: doppelter Schaden. Gibt Floor 1 ein Dash-Moment. ~20 Zeilen Code.

3. **Skeleton-Block rhythmisch machen** — Block für 1.5s nach Kontakt → 1.5s offen → Block → offen. Vorhersagbar, lernbar, befriedigend. ~10 Zeilen Code-Änderung.

Das sind ~80 Zeilen Code für einen fundamentalen Shift: Der Spieler denkt jetzt alle 30 Sekunden "Was wähle ich?" und hat ab Floor 1 Gründe zu dashen.

---

## Roher Feature-Bestand (aktualisiert Rev. 3)

### Core Systems
| Feature | Status | Trend |
|---|---|---|
| Game Loop (requestAnimationFrame) | FUNKTIONIERT | — |
| 3-Layer Canvas Renderer | FUNKTIONIERT | — |
| Tile Rendering (5 Themes + Wang-Tileset) | FUNKTIONIERT | — |
| Sprite Rendering (Player Pixel-Art) | FUNKTIONIERT | — |
| Sprite Rendering (Enemies Procedural, 13 Typen) | FUNKTIONIERT | — |
| FOV / Line-of-Sight | FUNKTIONIERT | — |
| Input Handler (Keyboard + Mouse) | FUNKTIONIERT | — |
| Screen Shake (5-14px skaliert) | FUNKTIONIERT | ✓ verbessert |
| Hit Stop (0.08-0.18s skaliert) | FUNKTIONIERT | ✓ verbessert |
| Enemy Flash bei Treffer | FUNKTIONIERT | ✓ neu |
| Slash-Arc-Effekt (Level-skalierend) | FUNKTIONIERT | ✓ neu+verbessert |
| Kill-Burst-Partikel + Screen-Flash | FUNKTIONIERT | ✓ neu |
| Loot-Glow auf Boden-Items | FUNKTIONIERT | ✓ neu |
| Save/Load (localStorage) | FUNKTIONIERT | — |

### Spieler
| Feature | Status | Trend |
|---|---|---|
| Tile-Bewegung (0.07s, DEX-skaliert) | FUNKTIONIERT | ✓ schneller |
| Melee-Angriff (Space, 3-Tile-Arc, Level-skalierend) | FUNKTIONIERT | ✓ verbessert |
| Dash (Shift, 3 Tiles, I-Frames) | FUNKTIONIERT | — |
| Whirlwind (Q, AoE, 8 Mana) | FUNKTIONIERT | — |
| Execute (E, Single-Target, 15 Mana) | FUNKTIONIERT | — |
| Knockback (1.0-1.8 Tiles skaliert) | FUNKTIONIERT | ✓ verbessert |
| Level-Up Power-Burst (Shake + Partikel) | FUNKTIONIERT | ✓ neu |
| Power-Aura (ab Level 5, Level-skalierend) | FUNKTIONIERT | ✓ neu |
| Equipment (6 Slots) + Inventory (20) | FUNKTIONIERT | — |
| Stat-System + Getters | FUNKTIONIERT | — |
| Potions / Food Buffs | FUNKTIONIERT | — |
| Death Save (1× pro Run) | FUNKTIONIERT | — |
| Desperate Fury (+30% ATK ≤20% HP) | FUNKTIONIERT | — |

### Kampf & Gegner
| Feature | Status | Trend |
|---|---|---|
| Damage Calc + 10% Crit | FUNKTIONIERT | — |
| Floating Text (Glow, Outline, Punch) | FUNKTIONIERT | — |
| Hit/Kill Particles | FUNKTIONIERT | ✓ verbessert |
| Kill-Sound (tiefer Thud, 0.2s) | FUNKTIONIERT | ✓ verbessert |
| Ratten (Standard-KI) | FUNKTIONIERT | — |
| Fledermäuse (erratische Bewegung) | FUNKTIONIERT | ✓ neu |
| Skelette (Frontal-Block + Shield-Aura) | FUNKTIONIERT — Block-Timing zufällig | ✓ neu |
| Orks (Charge-Rush + Telegraph + Stun) | FUNKTIONIERT | ✓ neu |
| Dämonen (Blink-Teleport) | FUNKTIONIERT — kein eigener Sound | ✓ neu |
| Drachen (Flammenhauch-AoE + Telegraph) | FUNKTIONIERT — kein eigener Sound | ✓ neu |
| Cluster-Spawns (2-4 pro Gruppe) | FUNKTIONIERT | ✓ neu |
| Korridor-Enemies (25% der Spawns) | FUNKTIONIERT | ✓ neu |
| Mini/Major/Final-Bosses mit Cinematic | FUNKTIONIERT | — |
| Soul-Shard-Drops (Boss + 8% Normal) | FUNKTIONIERT | ✓ erweitert |

### Dungeon
| Feature | Status | Trend |
|---|---|---|
| BSP-Generator (50×30 bis 80×45) | FUNKTIONIERT | ✓ skaliert |
| Kürzere Korridore (Room-Edge-Verbindung) | FUNKTIONIERT | ✓ neu |
| 14 Tile-Typen | FUNKTIONIERT | — |
| Chests, 5 Event-Typen | FUNKTIONIERT | — |
| Floor-Select + Escape-Summary | FUNKTIONIERT | — |
| 50 Floors bis Malphas | FUNKTIONIERT | — |

### Village & Meta
| Feature | Status | Trend |
|---|---|---|
| Dungeon-Eingang-Glow | FUNKTIONIERT | ✓ neu |
| Quick-Reenter [R] | FUNKTIONIERT | ✓ neu |
| Smithy (shopTier 2/4/7, reduzierte Preise) | FUNKTIONIERT | ✓ verbessert |
| Tavern (4 Run-Buffs) | FUNKTIONIERT | — |
| Temple (6 Blessings, ab Run 2-3 nutzbar) | FUNKTIONIERT | ✓ verbessert |
| 17 Gebäudetypen + Villager + Raids | FUNKTIONIERT — Feature-Bloat | — |
| Death/Escape-Reactions | FUNKTIONIERT | — |
| Floor-Checkpoints | FUNKTIONIERT | — |

### Audio
| Feature | Status | Trend |
|---|---|---|
| Attack-Sound (Sweep + Noise-Burst) | FUNKTIONIERT | ✓ verbessert |
| Kill-Sound (Triangle-Thud, 0.2s) | FUNKTIONIERT | ✓ verbessert |
| Dungeon-Musik (Floor-adaptiv: Drone + Heartbeat + Tension) | FUNKTIONIERT | ✓ verbessert |
| Village-Musik (Warm Pad) | FUNKTIONIERT | — |
| Boss-SFX | FUNKTIONIERT | — |
| Block/Blink/Breath-SFX | FEHLEN | ✗ Lücke |

### UI
| Feature | Status | Trend |
|---|---|---|
| HUD + Minimap | FUNKTIONIERT | — |
| Inventory/Character Panels | FUNKTIONIERT | — |
| Shop/Build/Manage Menus | FUNKTIONIERT | — |
| Tutorial Hints (Dungeon) | FUNKTIONIERT | — |
| Tooltips + Notifications | FUNKTIONIERT | — |

---

## Fortschritts-Zusammenfassung seit Audit Rev. 1

| Problem | Rev. 1 Status | Rev. 2 Status | Rev. 3 Status |
|---|---|---|---|
| Kampfgefühl ist leer | ✗ Kritisch | ✓ Behoben | ✓ Solide |
| Keine Dichte/kein Druck | ✗ Kritisch | ◐ Teilweise | ✓ Behoben |
| Village ist ein Blocker | ✗ Hoch | ◐ Teilweise | ✓ Behoben (Quick-Reenter) |
| Alle Gegner identisch | — | ✗ Kritisch | ✓ Behoben (6 Verhalten) |
| Korridore = tote Zeit | — | ✗ Hoch | ✓ Behoben |
| Kein In-Run-Progressionsgefühl | — | ✗ Hoch | ✓ Behoben (Arc + Aura) |
| Erste 3 Floors strategisch flach | — | — | ◐ Neu erkannt |
| Zu wenige Entscheidungsmomente | — | — | ✗ Neu erkannt |
| Skeleton-Block unbefriedigend | — | — | ◐ Neu erkannt |
