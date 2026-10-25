#!/usr/bin/env bash
# Read-only evidence collection. Run on each box as root:
#   bash collect-evidence.sh            -> /root/evidence-<host>-<UTC>.tar.gz
# Copy the tarballs to Desktop/evidence2026-10-22C02/ (currently empty).
# Nothing here changes state. Secrets: .env files are NOT copied; only their key names.
set -uo pipefail
TS=$(date -u +%Y%m%dT%H%M%SZ); H=$(hostname); OUT=/root/evidence-$H-$TS; mkdir -p "$OUT"
R() { local name=$1; shift; { echo "# $(date -u +%FT%TZ) $*"; "$@"; } >"$OUT/$name.txt" 2>&1; }
echo "collecting into $OUT"

# ---- identity, time, OS ----
R 00-host bash -c 'hostname; hostname -I; date -u; timedatectl 2>/dev/null | head -8; uptime; cat /etc/os-release; uname -a'
R 01-versions bash -c 'node -v; npm -v; pm2 -v; nginx -v 2>&1; dpkg -l icecast2 nginx redis-server docker-ce docker.io 2>/dev/null | awk "/^ii/{print \$2, \$3}"; /root/.opam/default/bin/liquidsoap --version 2>/dev/null | head -2; docker --version 2>/dev/null; docker compose version 2>/dev/null'

# ---- processes and ports ----
R 10-pm2 bash -c 'pm2 jlist'
R 11-pm2-describe bash -c 'for n in $(pm2 jlist | node -e "let s=\"\";process.stdin.on(\"data\",d=>s+=d).on(\"end\",()=>console.log(JSON.parse(s).map(p=>p.pm_id).join(\" \")))"); do pm2 describe $n; done'
R 12-ps bash -c 'ps -eo pid,ppid,user,lstart,etime,rss,args --sort=start_time'
R 13-liquidsoap bash -c 'ps -o pid,ppid,lstart,args -C liquidsoap; echo; pgrep -af "node server.js"'
R 14-ports bash -c 'ss -lntup; echo; ss -tupn | head -200'
R 15-docker bash -c 'docker ps -a; echo; docker images --digests; echo; for c in $(docker ps -q); do echo "== $c"; docker inspect --format "{{.Name}} {{.Config.Image}} {{.State.StartedAt}} restarts={{.RestartCount}}" $c; done'
R 16-docker-compose bash -c 'for f in $(find / -maxdepth 4 -name "docker-compose*.y*ml" -not -path "*/node_modules/*" 2>/dev/null); do echo "== $f"; cat "$f"; done'
R 17-livekit-config bash -c 'for c in $(docker ps --format "{{.Names}}" | grep -i livekit); do echo "== $c /etc/livekit.yaml"; docker exec $c cat /etc/livekit.yaml 2>/dev/null | sed -E "s/(api_secret|secret|key|password)(.*):.*/\1\2: <redacted>/I"; done; for f in /etc/livekit.yaml /opt/livekit/livekit.yaml /root/livekit.yaml; do [ -f $f ] && { echo "== $f"; sed -E "s/(secret|key|password)(.*):.*/\1\2: <redacted>/I" $f; }; done'

# ---- git state of every app ----
R 20-git bash -c 'for d in /root/audio_stream /root/hgradio /root/djpanel_backend /root/hg-app-web /root/radio_interation; do [ -d $d/.git ] || continue; echo "=== $d"; (cd $d && git log --oneline -5 && git status --porcelain && git remote -v && git stash list); done'
R 21-env-keys bash -c 'for f in /root/audio_stream/.env.local /root/djpanel_backend/config/.env /root/hgradio/client/.env* /root/hgradio/backend/.env* /root/hg-app-web/.env*; do [ -f "$f" ] && { echo "== $f"; sed -E "s/=.*/=<redacted>/" "$f"; }; done'
R 22-lockfiles bash -c 'for f in /root/audio_stream/package-lock.json /root/hgradio/client/package-lock.json /root/djpanel_backend/package-lock.json; do [ -f $f ] && echo "$f $(md5sum < $f | cut -c1-12) $(stat -c %y $f)"; done; for d in /root/audio_stream /root/hgradio/client; do echo "== $d next version: $(node -p "require(\"$d/node_modules/next/package.json\").version" 2>/dev/null)"; done'

# ---- logs (full, with whatever timestamps they have) ----
mkdir -p "$OUT/logs"
cp -a /root/.pm2/logs/. "$OUT/logs/pm2/" 2>/dev/null
cp -a /root/.pm2/pm2.log "$OUT/logs/" 2>/dev/null
for f in /var/log/nginx/*.log /var/log/nginx/*.log.1; do [ -f "$f" ] && cp -a "$f" "$OUT/logs/" ; done
for d in /var/log/icecast2 /var/log/icecast; do [ -d $d ] && cp -a $d "$OUT/logs/icecast"; done
cp -a /etc/nginx/sites-enabled "$OUT/nginx-sites-enabled" 2>/dev/null
cp -a /etc/icecast2/icecast.xml "$OUT/icecast.xml" 2>/dev/null && sed -i -E 's#<(source-password|relay-password|admin-password)>.*</\1>#<\1>REDACTED</\1>#' "$OUT/icecast.xml"
cp -a /root/djpanel_backend/*.liq /root/djpanel_backend/*.m3u "$OUT/" 2>/dev/null
R 30-journal-system bash -c 'journalctl --since "14 days ago" -o short-iso --no-pager | tail -20000'
R 31-journal-boots bash -c 'journalctl --list-boots --no-pager; last -x reboot shutdown | head -20'
R 32-docker-logs bash -c 'for c in $(docker ps -a --format "{{.Names}}"); do echo "=== $c"; docker logs --timestamps --since 336h $c 2>&1 | tail -50000; done'
R 33-pm2-log-dates bash -c 'echo "pm2 log date format: $(pm2 get pm2:log_date_format 2>/dev/null)"; for f in /root/.pm2/logs/*.log; do echo "$f: $(wc -l < "$f") lines, first: $(head -c 120 "$f" | head -1)"; done'

# ---- live state snapshot (no secrets) ----
R 40-icecast-status curl -s http://127.0.0.1:8000/status-json.xsl
R 41-backend-ops bash -c 'curl -s -m 5 http://127.0.0.1:4000/ ; echo; curl -s -m 5 http://127.0.0.1:4000/ops/state 2>/dev/null || echo "(no /ops/state: backend patch not deployed)"'
R 42-redis bash -c 'redis-cli ping; redis-cli --scan --pattern "hg:*" 2>/dev/null | head -50; redis-cli info server 2>/dev/null | head -20'
R 43-ws-upgrade bash -c 'curl -s -i -m 5 --http1.1 -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" "https://backend.hgdjlive.com/socket.io/?EIO=4&transport=websocket" | head -3'

# ---- compromise indicators (Oct 20) ----
R 50-systemd-user bash -c 'systemctl --user list-units --all 2>/dev/null; for u in /root/.config/systemd/user /etc/systemd/user /etc/systemd/system; do [ -d $u ] && { echo "== $u"; ls -la $u; for f in $u/*.service; do [ -f $f ] && { echo "--- $f"; cat $f; }; done; }; done'
R 51-hidden-dirs bash -c 'find /root /home /tmp /var/tmp /dev/shm -maxdepth 4 -name ".*" -type d 2>/dev/null | grep -vE "/\.(cache|npm|nvm|opam|pm2|ssh|config|local|git|next|docker)$" ; echo; ls -la /root/.local/share 2>/dev/null; find /root/.local/share -maxdepth 3 -type d -name ".*" -exec ls -la {} \; 2>/dev/null'
R 52-cron bash -c 'crontab -l; for u in $(cut -d: -f1 /etc/passwd); do crontab -l -u $u 2>/dev/null | sed "s/^/$u: /"; done; ls -la /etc/cron* ; cat /etc/cron.d/* 2>/dev/null'
R 53-auth bash -c 'cat /root/.ssh/authorized_keys 2>/dev/null | cut -c1-60; echo; grep -E "^(PasswordAuthentication|PermitRootLogin|PubkeyAuthentication)" /etc/ssh/sshd_config /etc/ssh/sshd_config.d/* 2>/dev/null; echo; last -a | head -40; echo; grep -c "Failed password" /var/log/auth.log 2>/dev/null; grep "Accepted" /var/log/auth.log 2>/dev/null | tail -30; journalctl -u ssh --since "30 days ago" --no-pager 2>/dev/null | grep -E "Accepted|session opened" | tail -40'
R 54-users bash -c 'awk -F: "\$3>=1000 || \$3==0 {print}" /etc/passwd; echo; getent group sudo docker; echo; find / -perm -4000 -type f -newermt "2026-09-01" 2>/dev/null'
R 55-outbound bash -c 'ss -tupn state established | awk "{print \$5, \$6}" | sort | uniq -c | sort -rn | head -40'
R 56-integrity bash -c 'debsums -c 2>/dev/null | head -50 || echo "debsums not installed (apt install debsums)"; echo; ls -la --time-style=full-iso /usr/bin/node* /usr/local/bin/* 2>/dev/null | head; echo; find /root /home -newermt "2026-10-18" -type f -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/.pm2/*" -not -path "*/logs/*" 2>/dev/null | head -100'

tar czf "$OUT.tar.gz" -C /root "$(basename "$OUT")" && rm -rf "$OUT"
echo "done: $OUT.tar.gz ($(du -h "$OUT.tar.gz" | cut -f1))"
echo "copy with: scp root@$(hostname -I | awk '{print $1}'):$OUT.tar.gz ."
