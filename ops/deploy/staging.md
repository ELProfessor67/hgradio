# Staging station

Goal: a place where a DJ can go live, 100 soak listeners can hammer the socket and LiveKit, and the backend can be restarted mid-show, with **zero** chance of touching production listeners or data.

## Shape (recommended): one extra droplet + one LiveKit room

| Piece | Prod | Staging |
|---|---|---|
| App box | 24.199.119.194 (EOL Ubuntu, compromised Oct 20) | new 2 vCPU/4 GB droplet, Ubuntu 24.04, `staging.hgdjlive.com` wildcard DNS |
| Panel | /root/audio_stream pm2 "audio stream" :3000 | same repo, `panel.staging.hgdjlive.com`, `.env.local` → staging Mongo DB, same LiveKit URL, **separate** LIVEKIT key pair (LiveKit supports several keys in `livekit.yaml`) |
| Socket backend | /root/djpanel_backend pm2 "audio backend" :4000 | same repo (push the server's local git repo to a remote first), `backend.staging.hgdjlive.com`, `config/.env` → staging DB, `djPanelId` = staging station id, local Redis |
| Icecast + Liquidsoap | same box :8000 | same box, `icecast.staging.hgdjlive.com`, its own icecast.xml passwords |
| Website | /root/hgradio/client pm2 "hgc frontend" :7502 | same repo, `staging.hgcradio.org`, `constants.js` URLs → staging hosts (make them env-driven: `NEXT_PUBLIC_*`), `streamId` → staging station id |
| LiveKit | 144.126.215.246 docker | **shared SFU**, different room (station id differs) and different API key; or a second `livekit-server` container on another port if you want to test LiveKit upgrades |
| Mongo | Atlas prod cluster | Atlas free-tier cluster `hgradio-staging`, seeded with `mongodump --db <prod> | mongorestore --db staging` **after** removing real DJ passwords/JWTs (`db.users.updateMany({}, {$set:{password:<bcrypt of "staging"> , jwt:null}})`) |
| App build | Play Store | an EAS "staging" profile whose `urls.ts` points at staging hosts |

Everything is created with `ops/deploy/deploy.sh <app> <ref> --staging` using `/root/staging.env`:

```bash
# /root/staging.env on the staging box
STAGING_DIR=/root/audio_stream        # overridden per app by deploy.sh
STAGING_PANEL_URL=https://panel.staging.hgdjlive.com
STAGING_WEBSITE_URL=https://staging.hgcradio.org
STAGING_SOCKET_URL=https://backend.staging.hgdjlive.com
STAGING_ICECAST_URL=https://icecast.staging.hgdjlive.com
STAGING_LIVEKIT_HTTP=https://webrtc.hgdjlive.com
STAGING_STATION=<staging owner _id>
```

## Hard-coded ids to make configurable first (otherwise staging will talk to prod)
- Backend `server.js`: `djPanelId = "655347b59c00a7409d9181c3"` → `process.env.STATION_ID || "6553…"`; `rr.liq`/`scheduled.liq` mount names and Icecast passwords.
- Website `client/src/constants.js` and `context/RadioContext.jsx` (`streamId`); `httpService.js` uses `NEXT_PUBLIC_PANEL_URL` already.
- App `src/constants/urls.ts` (SOCKET_URL, RADIO_URL, ICECAST_URL, STREAM_ID).
- Panel `.env.local` (`NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_ICE_CAST_SERVER`, `LIVEKIT_*`, `DB_URL`). Remove `NODE_TLS_REJECT_UNAUTHORIZED=0` on both environments.
- `checker.js` ("sog changer") polls `http://127.0.0.1:8000` and posts to `/api/v1/change-metadata` — fine as long as it runs on the staging box.

## Bring-up order and the evidence it worked
1. DNS + Caddy/nginx with TLS for the four staging hosts → `curl -I` 200 on each.
2. Mongo staging seeded → panel login as the staging owner works.
3. Backend up → `ops/deploy/smoke-test.sh backend --staging` ALL PASS (includes WebSocket 101 and Icecast bytes).
4. Panel + website up → `smoke-test.sh all --staging` ALL PASS; token route returns the **staging** station id.
5. Synthetic listener with `.env` → staging → GREEN, mode AUTODJ.
6. A DJ goes live on staging → synthetic listener `S=true L=true A=true` within 10 s; prod synthetic listener unchanged (proves isolation).
7. `soak.mjs --listeners 100 --minutes 60` → `pass: true`.
8. Rehearsal checklist → all PASS on phones over mobile data.

Then production changes follow: staging deploy → rehearsal/smoke → prod `deploy.sh` with the same ref.

## Cost
One droplet (~$24/mo for 4 GB; 100 LiveKit subscribers on the shared SFU is light: ~100 × 48 kbps). Atlas free tier. No new LiveKit box.
