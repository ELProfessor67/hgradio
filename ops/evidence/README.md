# Raw material: what to collect, how, and what each item will prove

`Desktop/evidence2026-10-22C02/` is empty and this machine cannot SSH to the boxes (blocked by the session's permission policy). Everything below runs on your side. Nothing in this folder changes production except the two marked ⚠️, and each of those states the evidence that will show it worked.

## 1. Logs from all three boxes (read-only)

```bash
scp ops/evidence/collect-evidence.sh root@24.199.119.194:/root/   # app box (panel, backend, Icecast, nginx)
scp ops/evidence/collect-evidence.sh root@144.126.215.246:/root/  # LiveKit box
# third box: whichever hosts hgcradio.org's backend.hgcradio.org / the site, if separate
ssh root@<box> 'bash /root/collect-evidence.sh'     # prints the tarball path
scp root@<box>:/root/evidence-*.tar.gz Desktop/evidence2026-10-22C02/
```

What it gathers: pm2 process list and every pm2 log file, pm2.log (restart history), nginx access/error logs, Icecast logs + redacted icecast.xml, Liquidsoap `.liq` and `.m3u`, journalctl 14 days, docker logs with timestamps (LiveKit), docker-compose files and redacted livekit.yaml, git status of every app, env **key names only**, lockfile hashes and the Next version actually installed, open ports, established outbound connections, systemd user units, hidden dirs, crontabs, authorized_keys, sshd settings, logins, debsums.

Proves/disproves: exact restart times of each pm2 app vs. incident times (pm2.log), whether nginx saw traffic during "outages" (access.log), LiveKit kicks and publishes per room (docker logs), what the server really runs vs. the repos (git + lockfile hash + Next version), and the compromise questions in `../incident-review/compromise-containment.md`.

## 2. ⚠️ Timestamps on pm2 logs (one-time, restarts each app)

pm2 only prefixes timestamps when a process is (re)started with `--time`. Do it **outside a slot**, one app at a time:

```bash
pm2 restart "audio backend" --time && pm2 restart "audio stream" --time && pm2 restart "hgc frontend" --time && pm2 restart "sog changer" --time
pm2 logs --lines 3 --nostream      # every line now starts with "2026-10-22T06:40:12:"
```

Evidence it worked: the first line of each `/root/.pm2/logs/*-out.log` after the restart starts with an ISO timestamp; `pm2 describe "audio backend"` shows `node args: --time`? (no: it shows in `pm2 jlist` as `pm2_env.time: true`). Do **not** `pm2 save` (the saved list is stale; see deploy-server-layout memory). Restarting the socket backend also restarts Liquidsoap (expected since the Oct 20 fix): Icecast `stream_start` moves to now.

## 3. Browser captures during a real show

**DJ (Chrome, laptop):** before Go Live open a second tab `chrome://webrtc-internals` → at the end "Create dump" (saves all PeerConnections, ICE candidates, bitrate graphs). DevTools → Network → check "Preserve log" → right-click → "Save all as HAR with content" at the end. Console → right-click → "Save as…". Keep the three files named `dj-<UTC-start>.{json,har,log}`.

**Listener (phone):** Android Chrome: `chrome://inspect` from a laptop over USB gives the same DevTools; iPhone Safari: Mac Safari → Develop → iPhone. If no laptop: the app has `liveDiagnostics.ts` — ask the developer to export its buffer; the website prints `owner ▸`, `Track subscribed:`, `Participant connected` lines in the console.

Proves: whether the DJ's `admin` publish succeeded (`mediaTrack published` on the server side, `PublishTrackError` client side), ICE path (UDP vs TURN), the exact second the listener received `room-active` vs `TrackSubscribed admin microphone`.

## 4. ⚠️ Backend state dumps alongside LiveKit and Icecast

After `../backend-patches` is deployed, every 30 s:

```bash
# on the monitor host (or any machine), as a cron/loop:
while true; do d=$(date -u +%FT%TZ); curl -s -H "x-ops-token: $OPS_TOKEN" https://backend.hgdjlive.com/ops/state > dumps/backend-$d.json; \
  lk room participants list --room 655347b59c00a7409d9181c3 --json > dumps/livekit-$d.json 2>/dev/null; \
  curl -s https://icecast.hgdjlive.com/status-json.xsl > dumps/icecast-$d.json; sleep 30; done
```

`ops/synthetic-listener/src/reconcile.mjs` does exactly this comparison continuously and writes the daily zero-divergence summary, so the loop above is only needed if you want raw files.

Until the patch is deployed the in-memory maps are invisible; the only proxy is the listener view (`scripts/socket-probe.mjs`).

## 5. Packet capture of one go-live (LiveKit box, read-only)

```bash
# on 144.126.215.246, start 1 min before the DJ presses Go Live, stop 2 min after
tcpdump -i any -w /root/golive-$(date -u +%Y%m%dT%H%M%SZ).pcap -s 200 \
  'udp portrange 50000-60000 or udp port 7882 or udp port 3478 or tcp port 7881 or tcp port 7880 or tcp port 443'
```

`-s 200` keeps headers only (SRTP payload is encrypted and useless anyway). Open in Wireshark: STUN binding requests from the DJ's IP → which candidate pair completed; whether RTP flows DJ→server on UDP or everything is TURN/TCP 443; and for listeners whether media is server→phone at ~48 kbps. Proves the "media never connected" vs "signal dead" distinction that mattered on Oct 21.

## 6. LiveKit container logs by room

```bash
docker logs --timestamps --since 168h $(docker ps --format '{{.Names}}' | grep -i livekit) 2>&1 \
  | grep -E 'room":"655347b59c00a7409d9181c3' | grep -E 'participant (joined|active|left)|mediaTrack published|DUPLICATE_IDENTITY|removing duplicate' > livekit-station-room.log
```

This is the single most useful file for the Go Live incidents: it names every `admin` session, when it was kicked and by whom, and whether a mic track was ever published.

## What is still inferred until these arrive
See the "proven vs inferred" column in `../incident-review/2026-10-22-blameless-review.md`. In particular the Oct 17 "couldn't go live" has no established cause, and whether the compromise is contained cannot be decided without items 1 and 6.
