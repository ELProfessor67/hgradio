# Soak test and rehearsal

- The soak script lives inside the listener package so it shares its dependencies: `ops/synthetic-listener/src/soak.mjs`.

```bash
cd ops/synthetic-listener
cp .env.example .env     # point SOCKET_URL / PANEL_URL / ICECAST_URL / STATION_ID at STAGING
npm ci
node src/soak.mjs --listeners 100 --minutes 60          # refuses prod hosts unless --i-know-this-is-prod
```

It writes `soak-<timestamp>.jsonl` (one line per join, background, foreground return, minute summary) and prints a summary; exit code 0 = pass (100 % of foreground returns in correct state within 10 s, p95 ≤ 10 s, 0 crashes).

- `rehearsal-checklist.md` is the written checklist for the full rehearsal show on staging with two phones on mobile data.

Harness validation on Oct 22 2026 06:41–06:43 UTC (production, Auto DJ mode, no show scheduled): 3 listeners, 1.5 min, shortened cycle (`--fg-min-s 8 --fg-max-s 15 --bg-min-s 4 --bg-max-s 8`): 9/9 foreground returns in correct state within the deadline, p50 6.4 s, p95 7.1 s (from Pakistan to SFO; includes token fetch + socket + LiveKit join), 0 crashes, LiveKit server truth saw all 3. The real run is 100 listeners × 60 min on staging with the default phone-like cycle.
