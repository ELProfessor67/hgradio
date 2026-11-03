#!/usr/bin/env bash
# Prove "clean git trees on every box": run on each box, paste the output.
# Exit 1 if any tree is dirty, detached from its remote, or unpinned.
set -uo pipefail
FAIL=0
row() { printf '%-28s %-12s %-10s %-8s %s\n' "$@"; }
row DIR HEAD DIRTY LOCK REMOTE_STATUS
for d in /root/audio_stream /root/hgradio /root/djpanel_backend /root/hg-app-web /root/radio_interation /opt/livekit /root/livekit; do
  [ -d "$d/.git" ] || continue
  cd "$d"
  head=$(git rev-parse --short HEAD 2>/dev/null)
  dirty=$(git status --porcelain | wc -l)
  lock="no"; { [ -f package-lock.json ] || [ -f client/package-lock.json ]; } && lock="yes"
  if git remote get-url origin >/dev/null 2>&1; then
    git fetch --quiet origin 2>/dev/null
    ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo '?'); behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo '?')
    rs="ahead=$ahead behind=$behind"
  else
    rs="NO REMOTE (local-only repo: back it up / push it)"
  fi
  row "$d" "$head" "$dirty" "$lock" "$rs"
  [ "$dirty" = 0 ] || FAIL=1
  [ "$lock" = yes ] || FAIL=1
  [ "$dirty" = 0 ] || { echo "   dirty files:"; git status --porcelain | sed 's/^/     /'; }
done
echo
echo "node: $(node -v 2>/dev/null)  pm2: $(pm2 -v 2>/dev/null)  nvm default: $(nvm alias default 2>/dev/null | tail -1)"
echo "pm2 processes (name | status | restarts | uptime):"
pm2 jlist 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{for(const p of JSON.parse(s))console.log('  '+p.name+' | '+p.pm2_env.status+' | restarts='+p.pm2_env.restart_time+' | since '+new Date(p.pm2_env.pm_uptime).toISOString()+' | cwd='+p.pm2_env.pm_cwd+' | node '+p.pm2_env.node_version)})" 2>/dev/null
if command -v docker >/dev/null 2>&1; then
  echo "docker images in use (pin these by digest, see pinning.md):"
  docker ps --format '  {{.Names}}  {{.Image}}  up {{.RunningFor}}' 2>/dev/null
  for img in $(docker ps --format '{{.Image}}' 2>/dev/null | sort -u); do echo "    $img -> $(docker inspect --format '{{index .RepoDigests 0}}' "$img" 2>/dev/null)"; done
fi
[ "$FAIL" = 0 ] && echo "RESULT: clean" || echo "RESULT: NOT CLEAN"
exit $FAIL
