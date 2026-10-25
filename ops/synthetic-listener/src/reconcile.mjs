#!/usr/bin/env node
// State reconciliation report: compares the three sources of truth every
// INTERVAL seconds and writes one JSONL line per check plus a daily summary.
//
//   backend   GET $SOCKET_URL/ops/state  (added by ops/backend-patches; falls back
//             to a socket user-join if the endpoint is absent)
//   livekit   RoomServiceClient.listParticipants(station)   (needs API key)
//   icecast   status-json.xsl
//
// A "divergence" is any of:
//   backend live  && livekit has no unmuted admin mic          (dead air)
//   livekit admin publishing && backend not live               (site on Auto DJ)
//   backend not live && icecast mount down                     (silence)
//   more than one admin participant                            (duplicate Go Live)
//   backend /ops/state unreachable while / answers             (patch not deployed / crashed)
//
// Acceptance: a full day with divergences = 0 (see summary at midnight UTC).
import fs from 'node:fs';
import path from 'node:path';
import { io } from 'socket.io-client';
import { RoomServiceClient } from 'livekit-server-sdk';
import { config } from './config.mjs';
import { isAdminIdentity } from './livekitWatcher.mjs';

const INTERVAL = Number(process.env.RECONCILE_INTERVAL_SECONDS || 30);
const DIR = path.join(config.logDir, 'reconcile');
fs.mkdirSync(DIR, { recursive: true });
const day = () => new Date().toISOString().slice(0, 10);
const file = () => path.join(DIR, `reconcile-${day()}.jsonl`);

const rs = config.livekitApiKey && config.livekitApiSecret && config.livekitUrl
  ? new RoomServiceClient(config.livekitUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://'), config.livekitApiKey, config.livekitApiSecret)
  : null;

async function backendState() {
  // Preferred: the ops endpoint (exact in-memory maps, Redis mirror, uptime).
  try {
    const res = await fetch(`${config.socketUrl}/ops/state`, { headers: config.backendOpsToken ? { 'x-ops-token': config.backendOpsToken } : {}, signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const j = await res.json();
      const owner = j.roomsowners?.[config.stationId] || null;
      return { source: 'ops/state', live: !!owner, owner: owner?.name ?? null, listeners: j.listenersCount, uptimeSeconds: j.uptimeSeconds, redis: j.redis, reconciler: j.reconciler, raw: j };
    }
    if (res.status !== 404) return { source: 'ops/state', error: `HTTP ${res.status}` };
  } catch (e) {
    return { source: 'ops/state', error: e.message };
  }
  // Fallback: ask as a listener would.
  return new Promise((resolve) => {
    const s = io(config.socketUrl, { transports: ['websocket', 'polling'], timeout: 8000, reconnection: false });
    const done = (v) => { try { s.close(); } catch {} resolve(v); };
    const t = setTimeout(() => done({ source: 'socket', error: 'timeout' }), 10000);
    s.on('connect', () => s.emit('user-join', { roomId: config.stationId }, () => {}));
    s.on('room-active', (d) => { clearTimeout(t); done({ source: 'socket', live: true, owner: d?.user?.name ?? null }); });
    s.on('room-unactive', (d) => { clearTimeout(t); done({ source: 'socket', live: false, owner: null, scheduleActive: !!d?.butScheduleActive }); });
    s.on('connect_error', (e) => { clearTimeout(t); done({ source: 'socket', error: e.message }); });
  });
}

async function livekitState() {
  if (!rs) return { error: 'LIVEKIT_API_KEY/SECRET/URL not set' };
  try {
    const ps = await rs.listParticipants(config.stationId);
    const admins = ps.filter((p) => isAdminIdentity(p.identity));
    return {
      participants: ps.length,
      identities: ps.map((p) => p.identity),
      admins: admins.length,
      adminMic: admins.some((p) => p.tracks.some((t) => t.source === 2 && !t.muted)),
      adminAny: admins.some((p) => p.tracks.some((t) => !t.muted)),
      adminTracks: admins.some((p) => p.tracks.length > 0),
      toneBot: ps.some((p) => p.identity === 'tone-player-bot' && p.tracks.length),
      publishers: ps.filter((p) => p.tracks.length).length,
    };
  } catch (e) {
    if (/not found|does not exist/i.test(e.message)) return { participants: 0, identities: [], admins: 0, adminMic: false, adminAny: false, toneBot: false, publishers: 0, roomMissing: true };
    return { error: e.message };
  }
}

async function icecastState() {
  try {
    const res = await fetch(`${config.icecastUrl}/status-json.xsl`, { signal: AbortSignal.timeout(8000) });
    const j = await res.json();
    let src = j?.icestats?.source ?? [];
    if (!Array.isArray(src)) src = [src];
    const m = src.find((x) => (x.listenurl || '').endsWith(config.stationId));
    return { mountUp: !!m, listeners: m?.listeners ?? null, title: m?.title ?? null, streamStart: m?.stream_start_iso8601 ?? null };
  } catch (e) { return { error: e.message }; }
}

function diverge(b, l, i) {
  const out = [];
  if (b.error && !b.error.includes('404')) out.push({ code: 'BACKEND_STATE_UNREACHABLE', detail: b.error });
  if (l.error) out.push({ code: 'LIVEKIT_API_UNREACHABLE', detail: l.error });
  if (i.error) out.push({ code: 'ICECAST_STATUS_UNREACHABLE', detail: i.error });
  if (b.error || l.error) return out;
  // Same rule as the backend reconciler: an admin session with tracks (muted or not) is live.
  if (b.live && !l.adminTracks && !l.toneBot) out.push({ code: 'BACKEND_LIVE_LIVEKIT_NO_ADMIN_SESSION', detail: `owner=${b.owner} identities=${JSON.stringify(l.identities)}` });
  if (l.adminTracks && !b.live) out.push({ code: 'LIVEKIT_ADMIN_PUBLISHING_BACKEND_NOT_LIVE', detail: `identities=${JSON.stringify(l.identities)}` });
  if (l.admins > 1) out.push({ code: 'DUPLICATE_ADMIN', detail: `${l.admins} admin participants` });
  if (!b.live && !l.adminAny && !i.error && i.mountUp === false) out.push({ code: 'AUTODJ_MOUNT_DOWN', detail: 'nobody live and station mount absent' });
  if (b.redis && b.redis.connected === false) out.push({ code: 'BACKEND_REDIS_DISCONNECTED', detail: JSON.stringify(b.redis) });
  if (b.raw?.redisMirror && JSON.stringify(!!b.raw.redisMirror.owner) !== JSON.stringify(b.live)) out.push({ code: 'BACKEND_MEMORY_REDIS_MISMATCH', detail: `memory live=${b.live} redis owner=${!!b.raw.redisMirror.owner}` });
  return out;
}

let currentDay = day();
let total = 0, divergent = 0;
const byCode = {};

async function check() {
  const [b, l, i] = await Promise.all([backendState(), livekitState(), icecastState()]);
  const d = diverge(b, l, i);
  total += 1;
  if (d.length) { divergent += 1; for (const x of d) byCode[x.code] = (byCode[x.code] || 0) + 1; }
  const line = { ts: new Date().toISOString(), ok: d.length === 0, divergences: d, backend: { source: b.source, live: b.live, owner: b.owner, error: b.error, uptimeSeconds: b.uptimeSeconds, redis: b.redis, reconciler: b.reconciler }, livekit: l, icecast: i };
  fs.appendFileSync(file(), JSON.stringify(line) + '\n');
  console.log(`${line.ts} ${d.length ? 'DIVERGENT ' + d.map((x) => x.code).join(',') : 'ok'} backend.live=${b.live ?? '?'} lk.adminMic=${l.adminMic ?? '?'} lk.participants=${l.participants ?? '?'} ice.mount=${i.mountUp ?? '?'}`);
  if (day() !== currentDay) {
    const summary = { ts: new Date().toISOString(), kind: 'daily-summary', day: currentDay, checks: total, divergentChecks: divergent, byCode, acceptance: divergent === 0 ? 'PASS (zero divergences)' : 'FAIL' };
    fs.appendFileSync(path.join(DIR, `summary.jsonl`), JSON.stringify(summary) + '\n');
    console.log(JSON.stringify(summary));
    currentDay = day(); total = 0; divergent = 0; for (const k of Object.keys(byCode)) delete byCode[k];
  }
}

if (process.argv.includes('--once')) {
  check().then(() => process.exit(0));
} else {
  check();
  setInterval(() => check().catch((e) => console.error('check error', e.message)), INTERVAL * 1000);
}
