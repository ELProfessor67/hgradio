# HGC Radio synthetic listener

A listener that never sleeps, runs **outside** the platform, and asserts one thing:

> Within 10 seconds of any state change, a listener on hgcradio.org hears the right audio.

"Right audio" means: the DJ when LiveKit has the DJ's microphone, the tone when the tone bot plays, Auto DJ (Icecast) otherwise. It alerts you before the client calls.

## How it measures

| Path | What the probe does | Same as a real listener? |
|---|---|---|
| socket.io `backend.hgdjlive.com` | persistent connection, `user-join` on every connect, follows `room-active` / `room-unactive` / `song-change` | yes, byte for byte (`useSocketUser.js`) |
| Token route `hgdjlive.com/api/v1/token?room=…&isAdmin=false` | every minute; checks HTTP 200 and that the JWT's `video.room` is the bare station id (the Oct 20 bug) | yes |
| LiveKit `wss://webrtc.hgdjlive.com` | joins the station room, subscribes to `admin` and `tone-player-bot` audio, **decodes the PCM and measures dBFS** | joins like a listener; additionally hears |
| LiveKit server API | `listParticipants` every minute: is `admin` really publishing an unmuted mic? how many admins? | no (server truth; needs API key) |
| Icecast `icecast.hgdjlive.com/<station>` | mount present in `status-json.xsl`; opens the mount for 4 s and checks ≥70 % of 128 kbps and MP3 frame sync; optional ffmpeg silence check | yes |
| Schedule feed | knows when a show is supposed to be on, so "no DJ showed up" is an info alert, not a platform alert | — |

Conditions and the exact rule for each are in `src/evaluator.mjs` (`CONDITIONS`). Every red condition must hold for 10 s before it alerts, so a normal hand-over never pages.

## Run it

```bash
cd ops/synthetic-listener
cp .env.example .env            # fill LIVEKIT_* (recommended) and one alert channel
npm ci
npm run once                    # 30 s probe, prints a verdict, exit 1 on RED
npm start                       # long-running; Prometheus on :9101, /health, /state
```

With Docker (recommended on a small droplet in another region, e.g. DigitalOcean FRA1 for $6):

```bash
docker compose up -d --build
# Uptime Kuma  http://host:3001   add monitors (below)
# Grafana      http://host:3000   dashboard "HGC Radio — Platform Health" is provisioned
# Prometheus   http://host:9090
```

### Uptime Kuma monitors to create

| Monitor | Type | Target | Interval |
|---|---|---|---|
| Synthetic listener verdict | Push | paste its push URL into `UPTIME_KUMA_PUSH_URL` | 60 s, grace 90 s |
| Probe alive | HTTP keyword | `http://listener:9101/health`, keyword `GREEN` | 60 s |
| Website | HTTP | https://hgcradio.org | 60 s |
| Panel | HTTP | https://hgdjlive.com | 60 s |
| Backend | HTTP keyword | https://backend.hgdjlive.com/ keyword `its working` | 60 s |
| Backend WebSocket | HTTP (expect 101 is not supported) → use keyword on `https://backend.hgdjlive.com/socket.io/?EIO=4&transport=polling` keyword `"sid"` | 60 s |
| Icecast status | HTTP keyword | https://icecast.hgdjlive.com/status-json.xsl keyword `655347b59c00a7409d9181c3` | 60 s |
| LiveKit | HTTP | https://webrtc.hgdjlive.com/ (returns `OK`) | 60 s |
| Backend restarts (after backend patch) | HTTP JSON query | `/ops/health` `$.uptimeSeconds` > 300 | 60 s |

Point Kuma's notifications at the same Telegram/Slack channel as the probe.

## Reading an alert

Each alert names the condition, the current `mode`, and the four booleans `S L A I` (backend says live / LiveKit admin mic / probe hears DJ / Icecast flowing). The runbook check to run is in the last line. `GET /state` on the probe has the full snapshot and the last 50 transitions with time-to-correct-audio.

## Acceptance tracking

- `logs/listener-YYYY-MM-DD.jsonl`: every event, every `scorecard` (per minute), every `condition.open/resolve`, every `state.transition` with `ttcSeconds`. "14 consecutive days green across every scheduled show" = zero `condition.open` with `sev:"red"` while `schedule` is non-null, and every `state.transition` has `ok:true`.
- `logs/reconcile/summary.jsonl`: one line per UTC day from `reconcile.mjs`; acceptance is `divergentChecks: 0`.

```bash
# 14-day check
grep -h '"kind":"condition.open"' logs/listener-*.jsonl | grep '"sev":"red"' | wc -l      # want 0
grep -h '"kind":"state.transition"' logs/listener-*.jsonl | grep -c '"ok":false'          # want 0
```

## Files

- `src/index.mjs` wiring, `--once` mode, 1 s evaluation loop
- `src/socketWatcher.mjs`, `src/livekitWatcher.mjs`, `src/icecastWatcher.mjs`, `src/scheduleWatcher.mjs` the four views
- `src/evaluator.mjs` the assertion and the condition catalogue
- `src/alerts.mjs` Telegram / Discord / Slack / webhook / Uptime Kuma push
- `src/metrics.mjs` Prometheus + `/health` + `/state`
- `src/reconcile.mjs` backend ⟷ LiveKit ⟷ Icecast divergence report (daily zero-divergence acceptance)
- `scripts/socket-probe.mjs` 9 s raw socket dump, handy when debugging the backend by hand

## Limits (honest)

- It is one listener in one place. A regional network problem between a real listener and the platform (the Oct 20 PTCL→Cogent drop) is invisible to it unless you run a second instance there (`PROBE_ID=synthetic-listener-khi`).
- It hears LiveKit through Node's WebRTC, not Chrome's. Browser-only autoplay/audio-focus bugs (the app's audio focus issue, iOS Safari) are out of scope; the soak test and rehearsal checklist cover those on real phones.
- Server-truth checks and the recognisable `synthetic-listener-*` identity need the LiveKit API key. Without it the probe still works, but joins under a random uuid like any listener.
