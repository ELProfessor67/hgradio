#!/usr/bin/env bash
# Post-deploy smoke test. Exit 0 = every check passed. Runs from the box or anywhere.
#   smoke-test.sh [panel|website|backend|all] [--staging]
# Staging hosts come from /root/staging.env (STAGING_PANEL_URL etc.).
set -uo pipefail
APP="${1:-all}"; STAGING=0; [ "${2:-}" = "--staging" ] && STAGING=1

PANEL_URL=https://hgdjlive.com; WEBSITE_URL=https://hgcradio.org; SOCKET_URL=https://backend.hgdjlive.com
ICECAST_URL=https://icecast.hgdjlive.com; LIVEKIT_HTTP=https://webrtc.hgdjlive.com; STATION=655347b59c00a7409d9181c3
if [ "$STAGING" = 1 ] && [ -f /root/staging.env ]; then
  # shellcheck disable=SC1091
  source /root/staging.env
  PANEL_URL="${STAGING_PANEL_URL:-$PANEL_URL}"; WEBSITE_URL="${STAGING_WEBSITE_URL:-$WEBSITE_URL}"; SOCKET_URL="${STAGING_SOCKET_URL:-$SOCKET_URL}"
  ICECAST_URL="${STAGING_ICECAST_URL:-$ICECAST_URL}"; LIVEKIT_HTTP="${STAGING_LIVEKIT_HTTP:-$LIVEKIT_HTTP}"; STATION="${STAGING_STATION:-$STATION}"
fi

FAIL=0
ok()   { echo "  PASS  $*"; }
bad()  { echo "  FAIL  $*"; FAIL=1; }
code() { curl -s -o /dev/null -m 15 -w '%{http_code}' "$@"; }

check_website() {
  echo "[website] $WEBSITE_URL"
  c=$(code -L "$WEBSITE_URL/"); [ "$c" = 200 ] && ok "GET / $c" || bad "GET / $c"
  body=$(curl -s -L -m 15 "$WEBSITE_URL/"); echo "$body" | grep -qi '<html' && ok "HTML body" || bad "no HTML body"
  # The Next build must not ship a broken chunk: _next/static must resolve for the first script tag.
  js=$(echo "$body" | grep -oE '/_next/static/[^"]+\.js' | head -1)
  if [ -n "$js" ]; then c=$(code "$WEBSITE_URL$js"); [ "$c" = 200 ] && ok "static chunk $c" || bad "static chunk $js $c"; fi
}

check_panel() {
  echo "[panel] $PANEL_URL"
  c=$(code -L "$PANEL_URL/"); [ "$c" = 200 ] && ok "GET / $c" || bad "GET / $c"
  tok=$(curl -s -m 15 "$PANEL_URL/api/v1/token?room=$STATION&isAdmin=false")
  room=$(echo "$tok" | sed -nE 's/.*"roomName":"([^"]+)".*/\1/p')
  jwt=$(echo "$tok" | sed -nE 's/.*"participantToken":"([^"]+)".*/\1/p')
  [ "$room" = "$STATION" ] && ok "token route roomName=$room" || bad "token route roomName='$room' body=$(echo "$tok" | head -c 120)"
  if [ -n "$jwt" ]; then
    payload=$(echo "$jwt" | cut -d. -f2 | tr '_-' '/+'); pad=$(( (4 - ${#payload} % 4) % 4 )); payload="$payload$(printf '=%.0s' $(seq 1 $pad 2>/dev/null))"
    jroom=$(echo "$payload" | base64 -d 2>/dev/null | sed -nE 's/.*"room":"([^"]+)".*/\1/p')
    [ "$jroom" = "$STATION" ] && ok "JWT video.room=$jroom" || bad "JWT video.room='$jroom' (the Oct 20 '?isAdmin' bug)"
  fi
  # Old clients still send the doubled '?': the route must cut it.
  tok2=$(curl -s -m 15 "$PANEL_URL/api/v1/token?room=$STATION?isAdmin=false"); echo "$tok2" | grep -q "\"roomName\":\"$STATION\"" && ok "legacy '?isAdmin' URL still lands in the right room" || bad "legacy URL returns $(echo "$tok2" | head -c 100)"
  c=$(code "$PANEL_URL/api/v1/schedule-public"); [ "$c" = 200 ] && ok "schedule-public $c" || bad "schedule-public $c"
}

check_backend() {
  echo "[backend] $SOCKET_URL"
  body=$(curl -s -m 15 "$SOCKET_URL/"); [ "$body" = "its working" ] && ok "GET / '$body'" || bad "GET / '$body'"
  # engine.io handshake over polling must return a sid
  hs=$(curl -s -m 15 "$SOCKET_URL/socket.io/?EIO=4&transport=polling"); echo "$hs" | grep -q '"sid"' && ok "socket.io polling handshake" || bad "socket.io handshake: $(echo "$hs" | head -c 100)"
  # WebSocket upgrade through nginx (Oct 20: every upgrade was 400 → clients stuck on polling)
  ws=$(curl -s -i -m 8 --http1.1 -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" "$SOCKET_URL/socket.io/?EIO=4&transport=websocket" | head -1 | tr -d '\r')
  echo "$ws" | grep -q ' 101 ' && ok "WebSocket upgrade: $ws" || bad "WebSocket upgrade: '$ws' (expect 101)"
  c=$(code "$SOCKET_URL/api/v1/channel-detail/$STATION"); [ "$c" = 200 ] && ok "channel-detail $c" || bad "channel-detail $c"
  if [ -n "${OPS_TOKEN:-}" ]; then
    h=$(curl -s -m 10 -H "x-ops-token: $OPS_TOKEN" "$SOCKET_URL/ops/health"); echo "$h" | grep -q '"status":"ok"' && ok "/ops/health ok" || bad "/ops/health: $(echo "$h" | head -c 160)"
  else
    echo "  SKIP  /ops/health (OPS_TOKEN not set)"
  fi
}

check_media() {
  echo "[icecast] $ICECAST_URL"
  st=$(curl -s -m 15 "$ICECAST_URL/status-json.xsl"); echo "$st" | grep -q "$STATION" && ok "mount $STATION present" || bad "mount missing: $(echo "$st" | head -c 160)"
  bytes=$(curl -s -m 5 -o /dev/null -w '%{size_download}' "$ICECAST_URL/$STATION" || true); [ "${bytes:-0}" -ge 40000 ] && ok "mount streams ($bytes bytes in 4-5 s)" || bad "mount streamed only ${bytes:-0} bytes"
  echo "[livekit] $LIVEKIT_HTTP"
  body=$(curl -s -m 10 "$LIVEKIT_HTTP/"); [ "$body" = "OK" ] && ok "LiveKit HTTP '$body'" || bad "LiveKit HTTP '$(echo "$body" | head -c 60)'"
  if command -v lk >/dev/null 2>&1 && [ -n "${LIVEKIT_API_KEY:-}" ]; then
    lk room list >/dev/null 2>&1 && ok "LiveKit API (lk room list)" || bad "LiveKit API unreachable with these keys"
  fi
}

case "$APP" in
  website) check_website ;;
  panel)   check_panel ;;
  backend) check_backend; check_media ;;
  all|*)   check_website; check_panel; check_backend; check_media ;;
esac

# End-to-end verdict if the synthetic listener is installed next to this script.
LISTENER="$(cd "$(dirname "$0")/.." && pwd)/synthetic-listener"
if [ -f "$LISTENER/src/index.mjs" ] && [ -d "$LISTENER/node_modules" ]; then
  echo "[synthetic listener --once]"
  if (cd "$LISTENER" && LOG_DIR=/tmp/listener-smoke timeout 90 node src/index.mjs --once >/tmp/listener-smoke.out 2>&1); then ok "verdict GREEN"; else bad "verdict RED (see /tmp/listener-smoke.out)"; fi
fi

[ "$FAIL" = 0 ] && echo "SMOKE: ALL PASS" || echo "SMOKE: FAILURES"
exit $FAIL
