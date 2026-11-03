# Oct 20 compromise: is it contained, and rotating every secret

## What is proven (measured Oct 20 2026 on 24.199.119.194, `journalctl`)
- Two systemd **user** services with random hex names (`11839f4cd893.service`, `eff8b0023e5f.service`, description "User Application Service") restarting every 30 s for ~905,000 cycles, exec `/root/.local/share/.r0qsv8h1/.394ly8v9/bin/node` (binary now missing → `203/EXEC`). Hidden random directories + user-level persistence is a malware pattern; which campaign is **inferred** (post-React2Shell/CVE-2025-55182 droppers use this shape).
- Root SSH with password login enabled and actively brute-forced (62.138.26.131 and others). The operator logs in as root with a password.
- Ubuntu release is EOL; uptime 353 days (no kernel updates applied in that time).
- Every secret on that box is in plaintext `.env` files readable by root: Mongo Atlas URI (prod DB), JWT secret, LiveKit API key/secret, SMTP, Cloudinary, Stripe, Authorize.Net, OpenAI, Resend; `iceserver.txt` TURN credentials; Icecast source/admin passwords in `icecast.xml` and `rr.liq`; the website's hard-coded TURN credentials (metered.ca, expressturn) are in the public JS bundle anyway.
- The panel's `.env.local` sets `NODE_TLS_REJECT_UNAUTHORIZED=0` (every outbound HTTPS from the panel accepts any certificate). The developer machine has the same variable set system-wide (seen in this session's npm output).
- The panel token route is unauthenticated and grants `canPublish: true` to **every** caller, and identity `admin` to anyone who passes `isAdmin=true`: anyone on the internet can publish audio into the station room or kick the real DJ (DUPLICATE_IDENTITY). This is not the malware, but it is an open door that must close in the same pass.

## What is NOT known (needs `../evidence/collect-evidence.sh` items 50–56)
- Whether the unit files, the hidden dirs, or any other persistence (cron, authorized_keys, new users, setuid binaries, modified system binaries) still exist.
- Whether the payload ever ran successfully (the binary is missing now; was it removed by an update, by the attacker, or did it never fully drop?).
- Outbound connections to unknown hosts right now (`ss -tupn`).
- Whether the LiveKit box (144.126.215.246, same hostname string, same operator practices) shows the same indicators.
- Whether secrets were read. Assume yes.

**Verdict today: not provably contained.** A box with unknown-origin persistence, EOL OS and 353 days uptime cannot be certified clean by inspection; the credible path is rebuild + rotate. Containment "proven" will mean: fresh box from a clean image, deployed by `ops/deploy/deploy.sh` from git refs, with the evidence script showing zero unknown units/cron/keys, password SSH disabled, and 14 days of `debsums -c` clean and no unexplained outbound connections.

## Containment steps (in order; the client decides rebuild vs clean, but rotate regardless)

1. **Stop the bleeding (10 min, no restart of apps):**
   `systemctl --user disable --now 11839f4cd893.service eff8b0023e5f.service` (or whatever `50-systemd-user.txt` lists), move the unit files and `/root/.local/share/.r0qsv8h1` to `/root/quarantine-<date>/` (keep for forensics, do not delete), `passwd -l` nothing yet (root needed), add your SSH key, then `PasswordAuthentication no` + `PermitRootLogin prohibit-password` in sshd_config, `systemctl reload ssh`, install fail2ban. Evidence: `last -a` shows only your IP from then on; `grep "Failed password" /var/log/auth.log` still grows but `Accepted password` never appears again.
2. **Rotate every secret (below).** Each rotation lists the place it is used and the check that proves the new value works.
3. **Rebuild the app box** on Ubuntu 24.04 using `deploy.sh` for all three apps and `collect-evidence.sh` as the acceptance (the "staging" build in `../deploy/staging.md` is the dress rehearsal for this exact procedure). Point DNS when smoke-test passes. Keep the old box powered off for 30 days, not deleted.
4. **Audit the LiveKit box** the same way; it runs Docker as root and shares the operator's habits.

## Secret rotation list

| Secret | Where used | How to rotate | Evidence it worked |
|---|---|---|---|
| Mongo Atlas user password | panel `.env.local DB_URL`, backend `config/.env DB_URL`, website backend `.env`, Compass on the dev machine | Atlas → Database Access → edit user → new password; **also** Network Access: remove `0.0.0.0/0` if present, allow only the box IPs | all three apps log `database connect with …`; Atlas "Database Access History" shows only the new user from the box IPs |
| `JWT_SECRET` (panel) | panel `.env.local`; every DJ's `user.jwt` | new 48-byte random; this logs every DJ out (the auth middleware also compares `user.jwt`) | DJs must log in again; old cookies get 501 "user unauthorized" |
| LiveKit API key/secret | `livekit.yaml` on the LiveKit box (can hold several keys), panel `.env.local`, backend (new, for the reconciler), synthetic listener `.env`, `lk` CLI | add a new key pair to `livekit.yaml`, `docker compose restart livekit` (ends any live show, do it outside slots), switch the apps, then remove the old pair | token route returns a JWT whose `iss` is the new key; `lk room list` works with the new pair and fails with the old |
| TURN credentials | `livekit.yaml` (if TURN auth is static), `iceserver.txt`, website `useSocketUser.js` `peerConfig` (dead legacy WebRTC code, but the metered.ca / expressturn credentials are public in the bundle) | rotate in the provider dashboards; delete `peerConfig` from the website (it is unused since LiveKit) | the strings no longer appear in `grep -r` of the repos or the built bundle |
| Icecast source + admin + relay passwords | `icecast.xml`, `rr.liq` / `scheduled.liq` / `stream.liq` (`password=`), `checker.js` if it uses admin | edit both, `systemctl restart icecast2`, restart the socket backend (Liquidsoap) | Icecast `status-json.xsl` `stream_start` = restart time; error.log shows no 401 from the source |
| SMTP, Resend | panel `.env.local` | provider dashboard → new credential | 2FA email code and DJ-form emails still arrive (send a test) |
| Cloudinary | website backend `.env`, panel if it syncs album art | Cloudinary → Settings → Access keys → regenerate; old key invalidated | album upload from the admin works |
| Stripe / Authorize.Net | website backend `.env`, website `NEXT_PUBLIC_*` publishable key, Authorize.Net seal id | Stripe: roll keys (24 h grace); Authorize.Net: new API login/transaction key | a $1 test transaction succeeds, then refund |
| OpenAI key | panel `.env.local` | platform.openai.com → revoke, new key | whatever feature uses it still answers |
| DigitalOcean API tokens, GitHub PATs/deploy keys on the box | `~/.config/doctl`, `~/.git-credentials`, repo remotes | revoke in DO / GitHub; use a deploy key per box with read-only scope | `git fetch` on the box works with the new key only |
| `OPS_TOKEN` (new), Grafana admin, Uptime Kuma admin | ops stack | generate at install | n/a |

Rotation order that avoids a show outage: Mongo + JWT + SMTP first (no audio impact, do it now), Icecast + LiveKit together in one maintenance window outside slots, payments and Cloudinary any time.

## Things to remove, not rotate
- `NODE_TLS_REJECT_UNAUTHORIZED=0` from the panel `.env.local` and from the developer machine's environment. If something then fails with a certificate error, that failure is the real bug (most likely an outdated CA bundle on the EOL box; the rebuild fixes it).
- The unauthenticated token route: require the panel session cookie for `isAdmin=true` (reuse `middleswares/auth.js`), issue listeners `canPublish: false`, and give the DJ identity `admin-<djOriginalId>` instead of the shared `admin` once the website/app accept any identity whose metadata says `role: dj` (both already key on `participant.identity === 'admin'`; change them to a prefix match in the same release). Evidence: `curl "…/token?room=…&isAdmin=true"` without a cookie → 401; a listener JWT decodes with `"canPublish":false`.
- Root-password SSH and the EOL OS (rebuild).
