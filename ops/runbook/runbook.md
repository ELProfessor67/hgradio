# HGC Radio — one-page runbook for the station team

**When something sounds wrong, run the three checks in order. Each takes under a minute and tells you which of the four parts is broken. Then do the matching action. Always note the UTC time.**

The four parts: **Panel** (hgdjlive.com, where the DJ presses Go Live) · **Backend** (backend.hgdjlive.com, tells the site/app who is live and what song plays) · **LiveKit** (webrtc.hgdjlive.com, carries the DJ's voice) · **Website/App** (hgcradio.org and the phone app, what listeners use). Auto DJ music comes from a fifth piece, Icecast, inside the Backend box.

---

## Check 1 — "Is it the website/app, or the station?"
Open the monitor page: **http://MONITOR_HOST:9101/health** (the synthetic listener; also mirrored in Uptime Kuma).

| You see | Meaning | Do |
|---|---|---|
| `GREEN` and the complaint is from one person | Station is fine; it is that listener's phone/network | Ask them to close and reopen the app (or reload the site), check mobile data. Nothing to fix on the station. |
| `GREEN` but **you** hear it wrong on your own phone | Possible website/app problem | Try the site in a laptop browser. If the laptop is fine → app issue, note the app version, tell the developer. If the laptop is also wrong → go to Check 2. |
| `RED` | The station really is broken | Read the `red` list and go to Check 2. |
| Page does not load | The monitor itself is down | Go to Check 2 anyway; tell the developer the monitor is down. |

## Check 2 — "Does the backend think a DJ is live?"
Open **https://backend.hgdjlive.com/** (must say `its working`) and, on the website, look at "Hosted by".

| Monitor says | Hosted by shows | Meaning | Do |
|---|---|---|---|
| `DEAD_AIR_SOCKET_LIVE_NO_PUBLISHER` | DJ name, but silence | Backend says live, LiveKit has no DJ audio | **Tell the DJ: press End, close every Go Live tab on every device, open ONE tab, press Go Live again.** Dead air clears itself within 30 s even if the DJ does nothing (reconciler). |
| `DJ_PUBLISHING_SITE_ON_AUTODJ` | "Auto DJ" while the DJ is talking | DJ audio exists, backend never heard "I'm live" | Same instruction to the DJ. Within 30 s the backend restores the DJ by itself. If it repeats → developer (socket backend). |
| `SOCKET_BACKEND_DOWN` or page not `its working` | nothing updates, chat dead | Backend process down | **Developer: `pm2 restart "audio backend" --time` on the app box.** Listeners keep hearing Auto DJ meanwhile (Icecast still runs). |
| `AUTODJ_DOWN` | Auto DJ, but silence | Icecast/Liquidsoap down | **Developer: on the app box `pm2 restart "audio backend" --time`** (restarts Liquidsoap too; the Oct 20 fix kills orphans). Check `curl https://icecast.hgdjlive.com/status-json.xsl`. |
| `AUTODJ_METADATA_STALE` | wrong song title, right music | Song announcer stalled | Not urgent. Developer: check "sog changer" (`pm2 logs "sog changer"`) and the m3u (Oct 14 fix). |

## Check 3 — "Is LiveKit carrying the DJ?"
Developer-only command (needs the LiveKit key): `lk room participants list --room 655347b59c00a7409d9181c3`, or look at the monitor's `/state` → `livekit.server`.

| You see | Meaning | Do |
|---|---|---|
| one `admin` with a microphone track | LiveKit is fine | Problem is backend (Check 2) or the listener's device (Check 1). |
| **no** `admin` while the panel says live | DJ's Go Live session is dead (kicked by a duplicate tab, or DJ's network) | DJ: end, close all tabs, one tab, Go Live. Panel shows "Listeners cannot hear you" when this happens. |
| `DUPLICATE_ADMIN` / two `admin` | Two Go Live sessions (two tabs, two devices, or two DJs) | Only ONE Go Live page may exist for the station. The newest one wins and the older one goes silent. |
| `LIVEKIT_UNREACHABLE` / `TOKEN_ROUTE_BROKEN` | Nobody can hear any DJ; Auto DJ still works | **Developer: LiveKit box** `docker ps`, `docker logs --since 10m <livekit>`; panel token route `curl "https://hgdjlive.com/api/v1/token?room=655347b59c00a7409d9181c3&isAdmin=false"`. Tell DJs to wait; do not keep pressing Go Live. |

---

## Rules that prevent most incidents
1. **One Go Live tab per station, ever.** Not two tabs, not phone + laptop, not two DJs "checking". (Two Oct 21 outages.)
2. **Never deploy or restart during a slot.** `ops/deploy/deploy.sh` refuses when a DJ is live; do not bypass it.
3. **Every change goes through git + deploy.sh**, never edited on the server. (Oct 20 compromise found hand-edited prod.)
4. **If the monitor is RED, you already know before the client does.** Reply to the client within 5 minutes with the UTC time and which part failed; the monitor message tells you.

## Who to call
- DJ-side (Go Live, tones, slot times): station admin, then developer.
- Backend/Icecast/LiveKit/deploys: developer (owns panel + socket backend since Oct 20 2026).
- Hosting (DigitalOcean) and secrets: client owner.

Monitor: `http://MONITOR_HOST:3001` (Uptime Kuma status), `http://MONITOR_HOST:3000` (Grafana "HGC Radio — Platform Health"). Alerts also arrive in the team Telegram/Slack channel.
