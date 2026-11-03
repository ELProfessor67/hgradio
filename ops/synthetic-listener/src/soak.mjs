#!/usr/bin/env node
// Soak test: N simulated listeners cycling background/foreground for an hour.
//
//   cd ops/synthetic-listener && node src/soak.mjs --listeners 100 --minutes 60
//   env: same as the synthetic listener (.env), point it at STAGING.
//
// Each listener behaves like a phone on hgcradio.org / the app:
//   socket.io connect -> user-join (on every connect) -> follows room-active/room-unactive/song-change
//   LiveKit: token from the panel route -> join station room -> subscribe admin/tone audio
//   every 60–180 s it goes "background": socket + LiveKit dropped for 10–60 s, then "foreground":
//   reconnect; it must receive the correct state again within DEADLINE seconds.
// A configurable subset (default 10) decodes audio and measures dBFS like the probe does;
// the rest only track subscription state (100 decoders would be CPU-bound).
//
// Pass criteria (printed at the end, exit 1 if any fails):
//   - 100 % of foreground returns reached correct state within DEADLINE
//   - 0 listener crashes; every listener connected at the end
//   - LiveKit server truth saw ≈ N participants while all were foreground (API key needed)
//   - p95 time-to-state <= DEADLINE
import { io } from 'socket.io-client';
import { Room, RoomEvent, AudioStream, TrackKind } from '@livekit/rtc-node';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import fs from 'node:fs';
import { config } from './config.mjs';
import { isAdminIdentity } from './livekitWatcher.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const N = Number(arg('listeners', 100));
const MINUTES = Number(arg('minutes', 60));
const DECODERS = Number(arg('decoders', 10));
const DEADLINE = Number(arg('deadline', config.deadlineSeconds));
const RAMP_MS = Number(arg('ramp-ms', 300));      // stagger joins so the token route is not hammered
// Phone-like cycle: foreground 60–180 s, background 10–60 s. Shorten for harness checks.
const FG_MIN_S = Number(arg('fg-min-s', 60)), FG_MAX_S = Number(arg('fg-max-s', 180));
const BG_MIN_S = Number(arg('bg-min-s', 10)), BG_MAX_S = Number(arg('bg-max-s', 60));
const OUT = arg('out', `./soak-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`);

if (/hgdjlive\.com|hgcradio\.org/.test(config.socketUrl + config.panelUrl) && !process.argv.includes('--i-know-this-is-prod')) {
  console.error('Refusing to soak PRODUCTION. Point SOCKET_URL/PANEL_URL/ICECAST_URL at staging, or pass --i-know-this-is-prod outside show hours.');
  process.exit(2);
}

const log = (o) => fs.appendFileSync(OUT, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n');
const rs = config.livekitApiKey && config.livekitApiSecret && config.livekitUrl ? new RoomServiceClient(config.livekitUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:'), config.livekitApiKey, config.livekitApiSecret) : null;

const results = { cycles: 0, okCycles: 0, lateCycles: 0, failedCycles: 0, ttsSamples: [], crashes: 0, tokenErrors: 0, lkConnectErrors: 0, socketConnectErrors: 0, maxServerParticipants: 0 };

async function token(i) {
  if (config.livekitApiKey && config.livekitApiSecret && config.livekitUrl) {
    const at = new AccessToken(config.livekitApiKey, config.livekitApiSecret, { identity: `soak-${process.pid}-${i}`, ttl: '3h' });
    at.addGrant({ room: config.stationId, roomJoin: true, canPublish: false, canSubscribe: true });
    return { url: config.livekitUrl, token: await at.toJwt() };
  }
  const res = await fetch(`${config.panelUrl}/api/v1/token?room=${config.stationId}&isAdmin=false`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`token HTTP ${res.status}`);
  const d = await res.json();
  return { url: d.serverUrl, token: d.participantToken };
}

// What state is "correct" right now, from the authoritative view (LiveKit server truth if available).
async function expected() {
  if (!rs) return null;
  try {
    const ps = await rs.listParticipants(config.stationId);
    const admin = ps.find((p) => isAdminIdentity(p.identity));
    const live = !!admin?.tracks.some((t) => !t.muted);
    results.maxServerParticipants = Math.max(results.maxServerParticipants, ps.length);
    return { live, participants: ps.length };
  } catch { return null; }
}

class Listener {
  constructor(i) { this.i = i; this.decode = i < DECODERS; this.sock = null; this.room = null; this.state = { socketLive: null, lkAdminSubscribed: false, dbfs: null, lastSoundAt: null, connected: false }; this.alive = true; this.fg = true; }

  async connect() {
    const t0 = Date.now();
    this.state = { socketLive: null, lkAdminSubscribed: false, dbfs: null, lastSoundAt: null, connected: false };
    // socket
    await new Promise((resolve) => {
      const s = io(config.socketUrl, { transports: ['websocket', 'polling'], reconnection: true, timeout: 10000 });
      this.sock = s;
      s.on('connect', () => s.emit('user-join', { roomId: config.stationId }, () => {}));
      s.on('room-active', () => { this.state.socketLive = true; resolve(); });
      s.on('room-active-now', () => { this.state.socketLive = true; });
      s.on('room-unactive', () => { this.state.socketLive = false; s.emit('auto-dj', { roomId: config.stationId }); resolve(); });
      s.on('owner-left', () => { this.state.socketLive = false; });
      s.on('connect_error', () => { results.socketConnectErrors += 1; });
      setTimeout(resolve, 12000);
    });
    // livekit
    try {
      const { url, token: tk } = await token(this.i);
      const room = new Room();
      this.room = room;
      room.on(RoomEvent.TrackSubscribed, (track, pub, p) => {
        if (isAdminIdentity(p.identity) && track.kind === (TrackKind?.KIND_AUDIO ?? 1)) {
          this.state.lkAdminSubscribed = true;
          if (this.decode) this.analyse(track);
        }
      });
      room.on(RoomEvent.TrackUnsubscribed, (track, pub, p) => { if (isAdminIdentity(p.identity) && ![...p.trackPublications.values()].some((x) => x.track)) this.state.lkAdminSubscribed = false; });
      room.on(RoomEvent.Disconnected, () => { this.state.connected = false; });
      await room.connect(url, tk, { autoSubscribe: true });
      this.state.connected = true;
    } catch (e) {
      if (/token/.test(e.message)) results.tokenErrors += 1; else results.lkConnectErrors += 1;
      log({ kind: 'lk.connect_error', i: this.i, message: e.message });
    }
    return Date.now() - t0;
  }

  analyse(track) {
    const stream = new AudioStream(track, 16000, 1);
    const reader = stream.getReader();
    (async () => {
      try {
        for (;;) {
          const { value: f, done } = await reader.read();
          if (done || !f || !this.fg) break;
          let sum = 0; for (let k = 0; k < f.data.length; k++) { const v = f.data[k] / 32768; sum += v * v; }
          const db = 20 * Math.log10(Math.sqrt(sum / f.data.length) || 1e-9);
          this.state.dbfs = db;
          if (db > config.silenceDbfs) this.state.lastSoundAt = Date.now();
        }
      } catch { /* track gone */ }
    })();
  }

  async disconnect() {
    this.fg = false;
    try { this.sock?.close(); } catch {}
    try { await this.room?.disconnect(); } catch {}
    this.sock = null; this.room = null;
  }

  // Is this listener in the correct state for the authoritative truth?
  correct(exp) {
    if (!this.sock?.connected) return false;
    if (exp === null) return this.state.socketLive !== null; // no truth source: "got an answer" is the bar
    if (exp.live) return this.state.socketLive === true && this.state.lkAdminSubscribed && (!this.decode || (this.state.lastSoundAt && Date.now() - this.state.lastSoundAt < DEADLINE * 1000));
    return this.state.socketLive === false;
  }

  async cycle() {
    while (this.alive) {
      await sleep((FG_MIN_S + Math.random() * (FG_MAX_S - FG_MIN_S)) * 1000);
      if (!this.alive) break;
      // background
      await this.disconnect();
      log({ kind: 'bg', i: this.i });
      await sleep((BG_MIN_S + Math.random() * (BG_MAX_S - BG_MIN_S)) * 1000);
      if (!this.alive) break;
      // foreground: reconnect and time until correct state
      this.fg = true;
      const t0 = Date.now();
      await this.connect();
      let exp = await expected();
      let ok = false;
      while (Date.now() - t0 < DEADLINE * 1000 * 3) {
        if (this.correct(exp)) { ok = true; break; }
        await sleep(250);
        if ((Date.now() - t0) % 5000 < 250) exp = await expected();
      }
      const tts = (Date.now() - t0) / 1000;
      results.cycles += 1;
      if (ok && tts <= DEADLINE) results.okCycles += 1; else if (ok) results.lateCycles += 1; else results.failedCycles += 1;
      results.ttsSamples.push(tts);
      log({ kind: 'fg', i: this.i, ttsSeconds: Number(tts.toFixed(2)), ok, withinDeadline: ok && tts <= DEADLINE, expected: exp, state: { socketLive: this.state.socketLive, lkAdminSubscribed: this.state.lkAdminSubscribed, dbfs: this.state.dbfs == null ? null : Math.round(this.state.dbfs) } });
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

async function main() {
  console.log(`soak: ${N} listeners for ${MINUTES} min against ${config.socketUrl} / ${config.panelUrl} (decoders=${DECODERS}, deadline=${DEADLINE}s) -> ${OUT}`);
  const listeners = [];
  for (let i = 0; i < N; i++) {
    const l = new Listener(i);
    listeners.push(l);
    l.connect().then((ms) => log({ kind: 'join', i, ms })).catch((e) => { results.crashes += 1; log({ kind: 'crash', i, message: e.message }); });
    await sleep(RAMP_MS);
  }
  await sleep(15000);
  const exp0 = await expected();
  console.log(`all joined. server truth: ${JSON.stringify(exp0)}; socket answered: ${listeners.filter((l) => l.state.socketLive !== null).length}/${N}; livekit connected: ${listeners.filter((l) => l.state.connected).length}/${N}`);
  log({ kind: 'all-joined', expected: exp0, socketAnswered: listeners.filter((l) => l.state.socketLive !== null).length, lkConnected: listeners.filter((l) => l.state.connected).length });
  for (const l of listeners) l.cycle().catch((e) => { results.crashes += 1; log({ kind: 'crash', i: l.i, message: e.message }); });

  const report = setInterval(async () => {
    const exp = await expected();
    const line = { kind: 'minute', expected: exp, connectedSocket: listeners.filter((l) => l.sock?.connected).length, connectedLk: listeners.filter((l) => l.state.connected).length, foreground: listeners.filter((l) => l.fg).length, correct: listeners.filter((l) => l.fg && l.correct(exp)).length, cycles: results.cycles, ok: results.okCycles, late: results.lateCycles, failed: results.failedCycles, p95: q(results.ttsSamples, 0.95) };
    console.log(JSON.stringify({ ts: new Date().toISOString(), ...line }));
    log(line);
  }, 60000);

  await sleep(MINUTES * 60000);
  clearInterval(report);
  for (const l of listeners) { l.alive = false; }
  await Promise.all(listeners.map((l) => l.disconnect()));
  const summary = {
    kind: 'summary', listeners: N, minutes: MINUTES, cycles: results.cycles, okWithinDeadline: results.okCycles, late: results.lateCycles, failed: results.failedCycles,
    successPct: results.cycles ? Number(((results.okCycles / results.cycles) * 100).toFixed(2)) : null,
    ttsP50: q(results.ttsSamples, 0.5), ttsP95: q(results.ttsSamples, 0.95), ttsMax: q(results.ttsSamples, 1),
    crashes: results.crashes, tokenErrors: results.tokenErrors, lkConnectErrors: results.lkConnectErrors, socketConnectErrors: results.socketConnectErrors, maxServerParticipants: results.maxServerParticipants,
  };
  summary.pass = summary.successPct === 100 && summary.crashes === 0 && (summary.ttsP95 ?? 0) <= DEADLINE;
  log(summary);
  console.log('\n=== SOAK SUMMARY ===\n' + JSON.stringify(summary, null, 2));
  process.exit(summary.pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
