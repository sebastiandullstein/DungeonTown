# MEMORY.md — Session-Gedächtnis

Wird bei Session-Start automatisch geladen. Nach jeder Session aktualisieren.

---

## Aktuelle Priorität (aus AUDIT.md)

### Prio 1: Kampfgefühl — "Der Angriff muss sich gut anfühlen"
**Warum:** Alles steht und fällt mit dem Moment wenn der Spieler Space drückt. Aktuell: visuell leer, zu subtil, kein Impact.

Konkrete Arbeitspakete:
- [ ] **Screenshake hochdrehen** — `combat.js:93-98` und `combat.js:96-98`: von 3px/0.15s auf 6-8px/0.2s für normale Hits, 12px für Kills
- [ ] **Hitstop hochdrehen** — `combat.js:95,98`: von 0.05-0.08s auf 0.12-0.15s für normale Hits
- [ ] **Enemy-Flash bei Treffer** — in `spriteRenderer.js` `drawEnemy()`: getroffenen Gegner 2-3 Frames weiß aufblitzen lassen (stunTimer > 0 als Trigger)
- [ ] **Slash-Arc für normalen Angriff** — `_slashLines`-Infrastruktur aus `abilities.js:189-193` für den normalen Space-Angriff wiederverwenden, sichtbarer weißer Bogen
- [ ] **Attack-Sound verbessern** — `audio.js:78-88` `_playAttack()`: Dauer 80ms→150ms, Volume 30%→50%, zusätzlicher Noise-Burst für Impact
- [ ] **Knockback verstärken** — `combat.js:87-89`: von 0.5 auf 1.0-1.5 Tiles visuellen Offset
- [ ] **Kill-Effekt verbessern** — größere Partikel-Explosion bei Enemy-Death, kurzer Screen-Flash

### Prio 2: Gegner-Dichte & Pacing — "Mehr Action, weniger Laufen"
**Warum:** Floor 1 hat ~7 Gegner auf 80×45 Tiles. 70% der Zeit läuft der Spieler durch leere Räume.

Konkrete Arbeitspakete:
- [ ] **Enemy-Count erhöhen** — `dungeon.js:286`: Formel `5 + floor * 2` aggressiver machen, besonders auf niedrigen Floors
- [ ] **Kleinere Maps auf frühen Floors** — Map-Größe an Floor koppeln (Floor 1-5: 50×30 statt 80×45)
- [ ] **Gegner-Cluster statt Einzelspawn** — Enemies in Gruppen von 2-4 in Räumen platzieren
- [ ] **Schnelleres Tile-Movement** — `player.js:77` `moveDelay` von 0.1 auf 0.07-0.08s oder Sub-Tile-Interpolation
- [ ] **Aggro-Radius vergrößern** — `enemies.js` detection-Werte erhöhen, damit Gegner schneller reagieren

### Prio 3: Village-Streamlining — "Schneller zurück in den Dungeon"
**Warum:** 15-20 Sekunden Leerlauf zwischen Runs. Village ist in den ersten Runs nutzlos.

Konkrete Arbeitspakete:
- [ ] **Quick-Enter-Option** — nach Tod/Flucht: direkter "Zurück in den Dungeon"-Button statt Village-Pflicht
- [ ] **Village-Gebäude reduzieren** — in den ersten Runs nur Smithy, Tavern, Temple, Dungeon-Eingang sichtbar
- [ ] **Dungeon-Eingang markieren** — visueller Pfeil oder Leuchteffekt der zum Eingang zeigt
- [ ] **Erste Soul Shards früher** — kleine Shard-Drops auch von normalen Gegnern (selten), damit Temple vor Floor 5 nutzbar wird

---

## Letzte Session

**Datum:** 2026-03-15
**Was gemacht:** Kompletter Game Design Audit der Codebase. `AUDIT.md` erstellt mit ehrlicher Analyse von Core Loop, Game Feel, Combat Feedback, Village Onboarding. Status als PROTOTYPE eingestuft. Drei Hauptprobleme identifiziert: (1) leeres Kampfgefühl, (2) fehlende Gegner-Dichte, (3) Village als Blocker.
**Was offen blieb:** Alle Arbeitspakete aus dem Audit. Nächste Session sollte mit Prio 1 (Kampfgefühl) starten.

---

## Session-Protokoll

| Datum | Fokus | Ergebnis |
|---|---|---|
| 2026-03-15 | Game Design Audit | AUDIT.md erstellt, MEMORY.md + CLAUDE.md aktualisiert |
