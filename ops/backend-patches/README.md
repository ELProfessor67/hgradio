# Backend patch: durable live state + LiveKit reconciliation + ops endpoints

Target: `/root/djpanel_backend` on 24.199.119.194 (pm2 "audio backend", port 4000, the socket.io server the website, app and panel talk to). This is the Sep 30 snapshot plus the Oct 20 crash fixes; the anchors below were verified against that snapshot with the Oct 20 patch applied.

## What changes

| Before | After |
|---|---|
| `roomsowners` etc. live only in process memory; a restart forgets who is live and listeners stay on whatever they last heard | Mirrored to Redis (`hg:live:*`, `hg:song:*`, `hg:sched:*`) and restored on boot, but a live owner is restored **only if LiveKit confirms** the admin is publishing |
| `user-join` answers `room-active` whenever an owner socket once said `owner-join` | `user-join` answers `room-active` only when LiveKit has an unmuted `admin` mic/song or tone bot (20 s grace after owner-join for the mic to come up) |
| Nothing ever compares backend state with LiveKit | Every 5 s: backend-live-but-nobody-publishing for 20 s → `room-unactive` to listeners, owner cleared, panel gets `reconcile-not-publishing`; LiveKit-admin-publishing-but-no-owner for 20 s → owner restored from Redis/DB, `room-active` sent |
| No way to see in-memory state | `GET /ops/health`, `GET /ops/state`, `GET /ops/metrics` (header `x-ops-token: $OPS_TOKEN`) |
| The DJ's socket dropping (phone network, nginx reload) deleted the owner and sent `owner-left` + `room-unactive` to every listener **instantly**, while the DJ was still publishing to LiveKit | `disconnect` → 20 s grace; if the panel re-announces (`owner-join` on reconnect, panel fix in `useSocket.js`) or LiveKit still has the admin publishing, the show continues; otherwise listeners are told |
| Only the exact identity `admin` counted as the broadcaster | Any `admin-<userId>` counts (per-DJ identities from the panel token route) |

Nothing else in server.js changes. Liquidsoap, tones, cron, chat and calls are untouched.

## Before authenticating the panel token route (not done yet): check the tone bot

An authenticated, per-DJ-identity token route was written and reverted because this could not be checked from the dev machine. The welcome/ending tone is published by a server-side participant `tone-player-bot`; the Sep 30 snapshot pushes it over RTMP to `rtmp://webrtc.hgdjlive.com:1935` (a LiveKit ingress, which has its own identity and needs no token). Before requiring a login for `isAdmin=true`, confirm on the server that nothing fetches an admin token without a cookie:

```bash
grep -rn "api/v1/token\|isAdmin=true" /root/djpanel_backend --include=*.js | grep -v node_modules
```

Expected: no matches. If there is one, that code must send the cookie of a service login, or mint its own token with `livekit-server-sdk` (the backend has the LiveKit keys after this patch anyway).

## Apply (outside any DJ slot — the restart ends a live show)

```bash
# on the server, as root
cd /root/djpanel_backend
git status --short                      # must be clean (it is a local git repo since Oct 20)
cp -r /path/to/hgradio/ops/backend-patches /root/ops-backend-patches   # scp from your machine
node /root/ops-backend-patches/patch-djbackend-v2.js /root/djpanel_backend
npm install --save-exact --no-audit --no-fund ioredis@5.6.1 livekit-server-sdk@2.14.2
# Redis: `redis-cli ping` must answer PONG (install: apt install redis-server; bind 127.0.0.1 only)
cat >> config/.env <<'EOF'
REDIS_URL=redis://127.0.0.1:6379
LIVEKIT_URL=wss://webrtc.hgdjlive.com
LIVEKIT_API_KEY=<same as /root/audio_stream/.env.local, AFTER rotation>
LIVEKIT_API_SECRET=<same as /root/audio_stream/.env.local, AFTER rotation>
OPS_TOKEN=<openssl rand -hex 24>
EOF
node --check server.js && node --check liveState.js
git add -A && git commit -m "liveState: Redis mirror, LiveKit reconciler, /ops endpoints"
pm2 restart "audio backend" --time        # --time: timestamped pm2 logs from now on
```

## Evidence that it worked (collect all of these)

1. `pm2 logs "audio backend" --lines 50 --nostream` shows `[liveState] redis ready` and `[liveState] restore done: ... redis=true livekit=true`.
2. `curl -s -H "x-ops-token: $OPS_TOKEN" http://127.0.0.1:4000/ops/health` → `{"status":"ok", ... "mongo":1, "redis":{"connected":true}, "livekit":{"configured":true,"lastOkAgeSeconds":<60}}`.
3. `curl -s -H "x-ops-token: $OPS_TOKEN" http://127.0.0.1:4000/ops/state` → `roomsowners` is `{}` when nobody is live, `listenersCount` ≈ Icecast + site listeners.
4. **Restart test (staging first, then prod outside a slot):** have a DJ go live, confirm `/ops/state` shows the owner and `redis-cli get hg:live:655347b59c00a7409d9181c3` has it; `pm2 restart "audio backend"`; within 25 s the log shows `restored live owner <name> from redis (LiveKit adminMic=true)` and a listener page that was already open shows the DJ again **without reload**. Before the patch this listener stayed muted/blank until reload.
5. **Dead-air test:** DJ presses Go Live, then closes the browser tab *without* pressing stop (socket keeps the room alive on polling for a while, or kill the LiveKit admin with `lk room remove-participant`). Within 25 s the log shows `RECONCILE: owner ... but LiveKit has no admin publishing -> telling listeners room-unactive` and the website resumes Auto DJ. The synthetic listener's `DEAD_AIR_SOCKET_LIVE_NO_PUBLISHER` must **not** open (reconciler fixes it inside the 10 s + 20 s window; tune `RECONCILE_GRACE_MS` down to 10000 once comfortable).
6. `ops/synthetic-listener/src/reconcile.mjs` daily summary: `divergentChecks: 0`.

## Rollback

```bash
cd /root/djpanel_backend
cp server.js.before-livestate-20261022 server.js && pm2 restart "audio backend"
```

## Client side (same item)

- Website `client/src/hooks/useSocketUser.js` (this repo): `room-active` no longer pauses Auto DJ; `LiveContext.jsx` already does that on the admin/tone track subscription. Deployed with the next website deploy.
- App `hgradioApp/src/hooks/useSocketUser.ts` `handleRoomActive` still calls `playback.enterLive(...)` on the socket event; move that call to the admin-mic `TrackSubscribed` branch in `contexts/LiveContext.tsx` (same reasoning). Not done here: the app file could not be read in this session.
- Panel: on `reconcile-not-publishing` show the existing red "Listeners cannot hear you" notice (hook it in `useSocket.js` next to `connectionError`). Optional; the notice already appears on LiveKit disconnects since 4c88b34.
