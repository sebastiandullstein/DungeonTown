# MEMORY.md — Session-Gedächtnis

Wird bei Session-Start automatisch geladen. Nach jeder Session aktualisieren.

---

## Aktuelle Priorität (aus AUDIT.md)

### Prio 1: Kampfgefühl — "Der Angriff muss sich gut anfühlen"
**Warum:** Alles steht und fällt mit dem Moment wenn der Spieler Space drückt. Aktuell: visuell leer, zu subtil, kein Impact.

Konkrete Arbeitspakete:
- [x] **Screenshake hochdrehen** — normale Hits: 5-8px/0.2-0.25s, Kills: 8px/0.25s, Crits: 7px, Bosse: 12-14px
- [x] **Hitstop hochdrehen** — normale Hits: 0.08s, Crits: 0.12s, Kills: 0.12s, Bosse: 0.15-0.18s
- [x] **Enemy-Flash bei Treffer** — `brightness(3) saturate(0.3)` Filter wenn `stunTimer > 0.05`, funktioniert für Sprites und prozedural
- [x] **Slash-Arc für normalen Angriff** — glühender Bogen (outer glow 14px + inner bright 4px) mit shadow-blur, ersetzt alten per-Tile Radial-Gradient
- [x] **Attack-Sound verbessern** — Sweep 500→120Hz über 150ms bei 50% Volume + Noise-Burst (lowpass 1200Hz) für Impact
- [x] **Knockback verstärken** — 1.0 Tiles normal, 1.5 bei Kill, 1.8 bei Crit, 0.18s Dauer
- [x] **Kill-Effekt verbessern** — `addKillBurst()` mit 10-16 Partikeln (größer, länger), Screen-Flash (0.1s weiß, 25% alpha)

**Status: Prio 1 ABGESCHLOSSEN.** Nächste Session: Spieler-Test, dann Prio 2 (Dichte) oder Feintuning der Werte.

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

**Datum:** 2026-03-15 (Session 2)
**Was gemacht:** Alle 7 Arbeitspakete von Prio 1 (Kampfgefühl) implementiert. Screenshake/Hitstop verdoppelt-verdreifacht, Enemy-Flash mit brightness-Filter, neuer glühender Slash-Arc ersetzt schwachen Radial-Gradient, Attack-Sound mit Noise-Burst, Knockback verdoppelt mit Crit/Kill-Skalierung, Kill-Burst-Partikel + Screen-Flash.
**Was offen blieb:** Spieler-Test nötig um Werte zu validieren. Dann Prio 2 (Gegner-Dichte & Pacing).
**Geänderte Dateien:** `combat.js`, `spriteRenderer.js`, `audio.js`, `dungeonScene.js`

---

## Session-Protokoll

| Datum | Fokus | Ergebnis |
|---|---|---|
| 2026-03-15 | Game Design Audit | AUDIT.md erstellt, MEMORY.md + CLAUDE.md aktualisiert |
| 2026-03-15 | Prio 1: Kampfgefühl | Alle 7 Pakete implementiert (Shake, Hitstop, Flash, Arc, Sound, KB, Kill-FX) |
