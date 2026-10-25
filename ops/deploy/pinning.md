# Pinning: lockfiles, Node, Docker images

Why this is item 4 and not housekeeping: the Oct 20 outage ("DJ live, site plays Auto DJ") was caused by `next: ^14` resolving to 16.3.5 when the panel was rebuilt on Sep 13, which changed how `request.url` is parsed in the token route. Nobody upgraded Next on purpose. Unpinned ranges turn every rebuild into a release.

## Node packages

1. Commit `package-lock.json` for all three apps and deploy with `npm ci` (deploy.sh refuses otherwise). `npm install` on a server is how a lockfile drifts.
2. In `package.json`, pin the frameworks exactly (no `^`): panel and website `next`, `react`, `react-dom`, `livekit-client`, `socket.io-client`; backend `socket.io`, `mongoose`, `express`, `fluent-ffmpeg`. Run `npm install --save-exact <pkg>@<version-you-run-today>` for each, commit.
   - Panel currently declares `react: ^18` but runs React 19 under Next 16 (panel-local-run memory). Pin to what the lockfile actually installs, and remove `yarn.lock` (two lockfiles, two truths).
3. `.nvmrc` = `22.14.0` in each repo (this folder has one for deploy.sh). `nvm alias default 22.14.0` on the box; the app box's system Node is irrelevant once pm2 is started from nvm's Node.
4. Renovate/Dependabot is fine **against staging only**; prod moves by deploy.sh with a ref.

## Docker (LiveKit box 144.126.215.246)

`docker-compose` services `webrtchgdjlivecom_*` (LiveKit, probably Redis/Caddy). Pin each image to tag **and** digest:

```bash
# capture what runs today
for img in $(docker ps --format '{{.Image}}' | sort -u); do echo "$img  $(docker inspect --format '{{index .RepoDigests 0}}' "$img")"; done
# then in docker-compose.yml:
#   image: livekit/livekit-server:v1.8.4@sha256:<digest-from-above>
docker compose config | grep image:    # verify
```

Unpinned `livekit/livekit-server:latest` would upgrade the SFU on any `docker compose pull`/host reboot with `pull_policy: always`. Also commit `/etc/livekit.yaml` (it lives inside the container today; mount it from the repo instead) and the compose file to a git repo on the box, so `git-clean-check.sh` covers it.

## Apt / opam (app box)

Icecast (2.4.4, apt) and Liquidsoap (opam, `/root/.opam/default/bin/liquidsoap`) have no lockfile. Record `dpkg -l icecast2 nginx redis-server | awk '/^ii/{print $2,$3}'` and `liquidsoap --version` in `ops/evidence/versions-<box>-<date>.txt` (collect-evidence.sh does this) so a rebuild can match them. Ubuntu on the app box is EOL (see compromise-containment.md): the rebuild target is 24.04 LTS with the same pinned versions.

## Lint rule

`deploy.sh` refuses a deploy when `package-lock.json` is missing. Add to each repo's CI (or a pre-push hook):

```bash
npm ci --dry-run >/dev/null || { echo "lockfile out of sync with package.json"; exit 1; }
grep -E '"(next|react|react-dom|livekit-client|socket.io(-client)?)": *"[\^~]' package.json && { echo "unpinned framework range"; exit 1; }
```
