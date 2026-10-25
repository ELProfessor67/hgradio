#!/usr/bin/env bash
# Deploy one app to one box from a pinned git ref, with smoke test and rollback.
#
#   deploy.sh <panel|website|backend> <git-ref> [--force-live] [--staging]
#
# Refuses when: working tree dirty, lockfile missing, a DJ is publishing in
# LiveKit (unless --force-live), or the ref is not fetched. Every step is logged
# to /root/deploys.log with timestamps so "what changed at 18:19?" has an answer.
set -euo pipefail

APP="${1:-}"; REF="${2:-}"; shift 2 || true
FORCE_LIVE=0; STAGING=0
for a in "$@"; do case "$a" in --force-live) FORCE_LIVE=1;; --staging) STAGING=1;; esac; done
[ -n "$APP" ] && [ -n "$REF" ] || { echo "usage: deploy.sh <panel|website|backend> <git-ref> [--force-live] [--staging]"; exit 2; }

LOG=/root/deploys.log
HERE="$(cd "$(dirname "$0")" && pwd)"
ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log() { echo "$(ts) [$APP] $*" | tee -a "$LOG"; }

# ---- app table (prod). Staging overrides via env STAGING_* in /root/staging.env ----
case "$APP" in
  panel)   DIR=/root/audio_stream;    PM2="audio stream"; BUILD=1; SUBDIR=.;      ALLOW_UNTRACKED='^\?\? server\.js$' ;;
  website) DIR=/root/hgradio;         PM2="hgc frontend"; BUILD=1; SUBDIR=client; ALLOW_UNTRACKED='^$' ;;
  backend) DIR=/root/djpanel_backend; PM2="audio backend"; BUILD=0; SUBDIR=.;     ALLOW_UNTRACKED='^$' ;;
  *) echo "unknown app $APP"; exit 2;;
esac
if [ "$STAGING" = 1 ]; then
  # shellcheck disable=SC1091
  [ -f /root/staging.env ] && source /root/staging.env
  DIR="${STAGING_DIR:-$DIR}"; PM2="${STAGING_PM2:-$PM2}"
fi
NODE_REQ="$(cat "$HERE/.nvmrc" 2>/dev/null || echo 22.14.0)"

log "deploy start ref=$REF dir=$DIR pm2='$PM2' staging=$STAGING by=$(whoami)@$(hostname)"

# ---- preflight ----
cd "$DIR"
[ "$(node -v)" = "v$NODE_REQ" ] || log "WARN node $(node -v) != required v$NODE_REQ (set with: nvm use $NODE_REQ)"
DIRTY="$(git status --porcelain | grep -Ev "$ALLOW_UNTRACKED" || true)"
if [ -n "$DIRTY" ]; then log "REFUSED: working tree dirty:"; echo "$DIRTY" | tee -a "$LOG"; exit 1; fi
git fetch --all --tags --quiet
git rev-parse --verify --quiet "$REF^{commit}" >/dev/null || { log "REFUSED: ref $REF not found after fetch"; exit 1; }
PREV="$(git rev-parse HEAD)"; NEW="$(git rev-parse "$REF^{commit}")"
log "from $PREV to $NEW"
[ -f "$SUBDIR/package-lock.json" ] || { log "REFUSED: $SUBDIR/package-lock.json missing (pin first, see pinning.md)"; exit 1; }

# ---- is a DJ live? (LiveKit truth; needs lk CLI or the probe) ----
if [ "$FORCE_LIVE" = 0 ] && [ "$STAGING" = 0 ]; then
  if command -v lk >/dev/null 2>&1 && [ -n "${LIVEKIT_API_KEY:-}" ]; then
    if lk room participants list --room 655347b59c00a7409d9181c3 2>/dev/null | grep -q '^admin'; then
      log "REFUSED: a DJ ('admin') is in the LiveKit station room. Deploy after the show or --force-live."; exit 1
    fi
  else
    log "WARN: cannot check LiveKit for a live DJ (no lk CLI / LIVEKIT_API_KEY); continuing"
  fi
fi

# ---- apply ----
git checkout --quiet --detach "$NEW"
cd "$SUBDIR"
log "npm ci"
npm ci --no-audit --no-fund 2>&1 | tail -3 | tee -a "$LOG"
if [ "$BUILD" = 1 ]; then
  rm -rf .next.prev; [ -d .next ] && mv .next .next.prev
  log "npm run build"
  if ! npm run build 2>&1 | tail -15 | tee -a "$LOG"; then
    log "BUILD FAILED: rolling back"; rm -rf .next; [ -d .next.prev ] && mv .next.prev .next
    cd "$DIR"; git checkout --quiet --detach "$PREV"; exit 1
  fi
fi
cd "$DIR"
log "pm2 restart '$PM2' --time --update-env"
pm2 restart "$PM2" --time --update-env >/dev/null
sleep 6

# ---- smoke test; roll back on failure ----
if "$HERE/smoke-test.sh" "$APP" $([ "$STAGING" = 1 ] && echo --staging) 2>&1 | tee -a "$LOG"; then
  log "deploy OK $PREV -> $NEW"
  [ "$BUILD" = 1 ] && rm -rf "$SUBDIR/.next.prev"
  pm2 describe "$PM2" | grep -E 'status|restarts|uptime' | tee -a "$LOG"
else
  log "SMOKE FAILED: rolling back to $PREV"
  git checkout --quiet --detach "$PREV"
  if [ "$BUILD" = 1 ]; then cd "$SUBDIR"; rm -rf .next; [ -d .next.prev ] && mv .next.prev .next; cd "$DIR"; fi
  pm2 restart "$PM2" --time >/dev/null; sleep 6
  "$HERE/smoke-test.sh" "$APP" 2>&1 | tee -a "$LOG" || log "ROLLBACK SMOKE ALSO FAILED: investigate now"
  exit 1
fi
