# ops/ — observability, reconciliation and release discipline for the HGC Radio platform

Built Oct 22 2026 after five client-discovered outages in seven days. Nothing in this folder is part of the website build (`client/` is its own root); it lives in this repo so it is versioned next to the code it watches.

| Item | Folder | Status |
|---|---|---|
| 1. Blameless review of the five incidents | `incident-review/2026-10-22-blameless-review.md`, `incident-review/compromise-containment.md` | written; proven vs inferred tagged |
| 2. Synthetic listener + Uptime Kuma + Grafana | `synthetic-listener/`, `monitoring/` | code complete; `--once` verified against prod (GREEN); needs an external host and one alert channel |
| 3. State reconciliation (LiveKit-gated "live", Redis-persisted backend state) | `backend-patches/`, website `client/src/hooks/useSocketUser.js`, app `useSocketUser.ts` | patch verified against the Sep 30 + Oct 20 server.js and functionally tested with a mock server (gating, stale-owner clear, socket-loss debounce); **not deployed** |
| Root-cause code fixes (see review table) | panel: `hooks/useSocket.js`, `dashboard/go-live/page.jsx`; website: `hooks/useConnect.jsx`, `hooks/useSocketUser.js`; app: `contexts/LiveContext.tsx`, `hooks/useSocketUser.ts`, `PlaybackCoordinator.ts`; both `package.json` pinned | re-join/reconnect paths and socket-not-LiveKit trust removed; only changes confirmed by reading the code they talk to. The per-DJ identity / authenticated token route and the panel socket transport change were written and reverted as unconfirmable from here |
| 4. Staging, deploy script, smoke test, pinning, clean trees | `deploy/` | scripts written; staging not built |
| 5. Soak test + rehearsal checklist | `synthetic-listener/src/soak.mjs`, `soak/` | harness validated (3 listeners, 9/9 reconnect cycles within 10 s, prod off-hours); 100×60 min run pending staging |
| 6. One-page runbook | `runbook/runbook.md` | written; fill in `MONITOR_HOST` |
| Evidence collection (the raw material this review still needs) | `evidence/` | scripts and instructions; run on your side |

Start here: `synthetic-listener/README.md` → `runbook/runbook.md` → `backend-patches/README.md` → `deploy/staging.md`.

Everything that touches production says what evidence will show it worked; nothing here has been run against production except read-only probes (socket user-join, LiveKit listener join, Icecast GET, token route GET).
