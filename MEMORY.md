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
- [x] **Enemy-Count erhöhen** — Floor 1-3: base 10, Floor 4-8: base 8, Floor 9+: base 6 (+ floor*2 + random). Vorher: immer 5
- [x] **Kleinere Maps auf frühen Floors** — Floor 1-3: 50×30, Floor 4-8: 60×36, Floor 9+: 80×45. Weniger Fläche = höhere Dichte
- [x] **Gegner-Cluster statt Einzelspawn** — Enemies spawnen in Gruppen von 2-4 pro Cluster, gleicher Typ, nahe beieinander
- [x] **Schnelleres Tile-Movement** — `moveDelay` 0.1→0.07, `getSpeed()` Basis 0.12→0.08 (min 0.04 statt 0.05)
- [x] **Aggro-Radius vergrößern** — Rat 5→8, Bat 7→10, Skeleton 6→9, Orc 5→8, Demon 8→10, Dragon 10→12. Chase-Speed ×0.6→×0.45

**Status: Prio 2 ABGESCHLOSSEN.** Nächste Session: Prio 3 (Village-Streamlining) oder Spieler-Test.

### Prio 3: Village-Streamlining — "Schneller zurück in den Dungeon"
**Warum:** 15-20 Sekunden Leerlauf zwischen Runs. Village ist in den ersten Runs nutzlos.

Konkrete Arbeitspakete:
- [x] **Quick-Enter-Option** — nach Tod/Flucht: [R] drücken für sofortigen Dungeon-Reenter (4s Prompt, lila Leiste am unteren Rand)
- [ ] **Village-Gebäude reduzieren** — in den ersten Runs nur Smithy, Tavern, Temple, Dungeon-Eingang sichtbar (OFFEN)
- [x] **Dungeon-Eingang markieren** — pulsierender lila Glow auf den 4 Entrance-Tiles (sinusförmig, 0.4-0.7 alpha)
- [x] **Erste Soul Shards früher** — 8% Chance pro Normal-Kill für 1-2 Soul Shards, damit Temple vor Floor 5 nutzbar wird

**Status: Prio 3 größtenteils ABGESCHLOSSEN.** Nur "Gebäude reduzieren" noch offen — niedrige Priorität.

---

## Letzte Session

**Datum:** 2026-03-15 (Session 4)
**Was gemacht:** Prio 2 + Prio 3 (Village-Streamlining) implementiert. Quick-Reenter per [R] nach Tod/Flucht, pulsierender Dungeon-Eingang-Glow, 8% Soul Shard Drop von normalen Gegnern.
**Was offen blieb:** "Village-Gebäude reduzieren" (niedrige Prio). Alles ungetestet — Spieler-Test nach Rückkehr.
**Geänderte Dateien:** `dungeon.js`, `player.js`, `enemies.js`, `villageScene.js`

---

## Session-Protokoll

| Datum | Fokus | Ergebnis |
|---|---|---|
| 2026-03-15 | Game Design Audit | AUDIT.md erstellt, MEMORY.md + CLAUDE.md aktualisiert |
| 2026-03-15 | Prio 1: Kampfgefühl | Alle 7 Pakete implementiert (Shake, Hitstop, Flash, Arc, Sound, KB, Kill-FX) |
| 2026-03-15 | Prio 2: Dichte & Pacing | Alle 5 Pakete implementiert (Map-Size, Enemy-Count, Cluster, Speed, Aggro) |
| 2026-03-15 | Prio 3: Village-Streamlining | 3/4 Pakete implementiert (Quick-Reenter, Entrance-Glow, Soul-Shard-Drops) |
