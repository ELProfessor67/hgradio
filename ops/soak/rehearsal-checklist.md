# Full rehearsal show on staging — checklist

Run on **staging** (ops/deploy/staging.md) with the synthetic listener pointed at staging and the soak test running in the background. Three people: DJ (laptop, Chrome), Listener A (Android, mobile data, the Play Store app build), Listener B (iPhone, mobile data, Safari on the website). Record the session start time in UTC; every line below gets a UTC timestamp and PASS/FAIL. Keep the DJ's `chrome://webrtc-internals` tab open and save a dump at the end.

Pass = every line PASS on phones on real mobile networks (not Wi-Fi), twice on different days.

## Before the show (T-15 min)
- [ ] `ops/deploy/smoke-test.sh all --staging` → ALL PASS
- [ ] Synthetic listener `/health` → GREEN, mode AUTODJ, `A=false I=true`
- [ ] Soak test started: `node src/soak.mjs --listeners 100 --minutes 90`
- [ ] Listener A and B: app/site open, Auto DJ playing, song title matches Icecast title (`status-json.xsl`); phones on cellular, Wi-Fi OFF
- [ ] DJ: logged in, slot is "now" in the Team form, welcome + ending tone uploaded; **no other Go Live tab/device open anywhere** (duplicate `admin` kicks the real one)

## Go live (T0)
- [ ] T0: DJ presses Go Live. Panel shows connected; no red "Listeners cannot hear you"
- [ ] T0+10 s: Listener A hears the DJ (not Auto DJ, not silence). Record seconds
- [ ] T0+10 s: Listener B hears the DJ. Record seconds
- [ ] T0+10 s: synthetic listener `/state` shows `S=true L=true A=true`, no condition opened; `state.transition … ok:true`
- [ ] Welcome tone (if scheduled) plays under the DJ at reduced volume on both phones; Auto DJ is NOT also audible
- [ ] Badge/"Hosted by" shows the DJ's name on both phones
- [ ] Backend `/ops/state` shows the owner; `redis-cli get hg:live:<station>` has it
- [ ] LiveKit: `lk room participants list --room <station>` shows exactly one `admin` with a mic track

## During the show (T0+5 → T0+25)
- [ ] DJ plays a song from the deck: both phones hear it mixed with the mic, no double audio
- [ ] DJ mutes mic 10 s, unmutes: phones follow; no alert fires (within grace)
- [ ] Listener A backgrounds the app 60 s (switch to WhatsApp), returns: audio resumes and the title is current within 10 s. Record seconds
- [ ] Listener B locks the phone 60 s, unlocks: Safari resumes within 10 s or shows a tap-to-play that works. Record
- [ ] Listener A toggles airplane mode 20 s: on return the app reconnects (socket re-join + LiveKit) within 10 s. Record
- [ ] Chat: Listener B sends a message; DJ sees it; chat scrolls on the phone without the page moving
- [ ] Call-in: Listener A calls; DJ accepts; both phones hear the caller; DJ ends call; show continues
- [ ] **Chaos 1 — backend restart:** `pm2 restart "audio backend" --time` on staging. Within 25 s: log `restored live owner … (LiveKit adminMic=true)`; neither phone drops the DJ; synthetic listener stays GREEN (socket reconnect only). Record
- [ ] **Chaos 2 — duplicate Go Live:** open a second Go Live tab as the same DJ, press Go Live. Expected: the second tab is refused or the first shows the red notice immediately; the synthetic listener raises `DUPLICATE_ADMIN` or nothing (never dead air for > 10 s). Record what happened
- [ ] **Chaos 3 — DJ network drop:** DJ disables Wi-Fi 20 s. Panel shows reconnecting; on return publishes again without pressing Go Live; phones hear the DJ within 10 s of the DJ's return. If not recovered within 30 s, the reconciler must send `room-unactive` and phones must fall back to Auto DJ (no silence)
- [ ] Soak test minute lines: `correct == foreground`, no `failed` cycles so far

## End of show (T0+28)
- [ ] DJ presses end. Ending tone plays on both phones
- [ ] Within 10 s after the tone: both phones are back on Auto DJ with the right title
- [ ] Synthetic listener: `S=false L=false I=true`, GREEN, transition `ok:true`
- [ ] `/ops/state` `roomsowners` is `{}`; `redis-cli get hg:live:<station>` is nil
- [ ] LiveKit room has no `admin`

## After
- [ ] Soak summary `pass: true` (100 %, p95 ≤ 10 s, 0 crashes)
- [ ] Synthetic listener log: zero `condition.open` with `sev:red` during the window; list any amber/info
- [ ] Save: DJ webrtc-internals dump, DJ console log, HAR from Listener B (Safari Web Inspector), app logs from Listener A (`adb logcat -s ReactNativeJS`), `ops/evidence/collect-evidence.sh` tarballs from both staging boxes
- [ ] Write the run up: what failed, timestamps, which log line shows it. A FAIL here is a finding, not a blocker: fix on staging, re-run the failed section the next day
