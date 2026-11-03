#!/usr/bin/env node
// HGC Radio synthetic listener.
//
//   node src/index.mjs          long-running: persistent socket + LiveKit, 1 s evaluation,
//                               60 s scorecard, alerts, Prometheus on :9101
//   node src/index.mjs --once   ~30 s single probe, prints the verdict, exit 1 on RED
//                               (cron / deploy smoke test / "is it me or the platform")
//
// It behaves like a real listener on hgcradio.org: same socket events, same
// token route, same LiveKit room, same Icecast mount. Unlike a browser it
// measures the audio it receives, and it never publishes.
import { config } from './config.mjs';
import { log } from './log.mjs';
import { SocketWatcher } from './socketWatcher.mjs';
import { LiveKitWatcher } from './livekitWatcher.mjs';
import { IcecastWatcher } from './icecastWatcher.mjs';
import { ScheduleWatcher } from './scheduleWatcher.mjs';
import { Evaluator } from './evaluator.mjs';
import { Alerter } from './alerts.mjs';
import { M, publish, startServer } from './metrics.mjs';

const once = process.argv.includes('--once');

const socket = new SocketWatcher();
const livekit = new LiveKitWatcher();
const icecast = new IcecastWatcher();
const schedule = new ScheduleWatcher();
const evaluator = new Evaluator();
const alerter = new Alerter();
let http = {};

async function checkHttp() {
  const targets = { website: config.websiteUrl, panel: config.panelUrl, backend: `${config.socketUrl}/`, icecastStatus: `${config.icecastUrl}/status-json.xsl` };
  const out = {};
  await Promise.all(Object.entries(targets).map(async ([name, url]) => {
    const t0 = Date.now();
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(10000) });
      out[name] = { ok: res.status < 400, status: res.status, ms: Date.now() - t0 };
    } catch (e) {
      out[name] = { ok: false, status: null, ms: Date.now() - t0, error: e.message };
    }
  }));
  http = out;
  log('http.check', out);
}

// Slow checks, once per tick: server truth, Icecast, HTTP, schedule age.
async function tick() {
  await Promise.all([
    livekit.refreshServerTruth(),
    livekit.checkTokenRoute(),
    icecast.checkStatus().then(() => icecast.sampleStream()),
    checkHttp(),
    (Date.now() - (schedule.fetchedAt || 0) > 10 * 60000) ? schedule.refresh() : Promise.resolve(),
  ]);
  if (!livekit.state.connected && !livekit.room?.isConnected) await livekit.connect();
  if (!socket.state.connected) socket.rejoin();
}

function scorecard() {
  const s = evaluator.lastSnapshot;
  if (!s) return;
  publish(s, evaluator);
  log('scorecard', {
    green: s.green, mode: s.mode, red: s.red, amber: s.amber, correctAudio: s.correctAudio,
    socket: { live: s.socket.live, owner: s.socket.owner, song: s.socket.song, transport: s.socket.transport },
    livekit: { adminMic: s.livekit.adminMic, server: s.livekit.server, audio: s.livekit.audio, tokenRoute: s.livekit.tokenRoute.ok },
    icecast: { mountUp: s.icecast.mountUp, listeners: s.icecast.listeners, kbps: s.icecast.kbps, title: s.icecast.title },
    schedule: s.schedule, nextShow: s.nextShow, ttc: evaluator.ttcStats(),
  });
  alerter.pushHeartbeat(s).catch(() => {});
  alerter.remind(evaluator, s).catch(() => {});
}

async function evaluateNow() {
  const { snapshot, events } = evaluator.evaluate({ socket, livekit, icecast, schedule, http });
  if (events.length) {
    for (const e of events) M.alerts.inc({ severity: e.sev, type: e.type });
    await alerter.handle(events, snapshot);
    publish(snapshot, evaluator);
  }
  return snapshot;
}

async function main() {
  log('probe.start', { once, config: { ...config, livekitApiKey: config.livekitApiKey ? '<set>' : '', livekitApiSecret: config.livekitApiSecret ? '<set>' : '', backendOpsToken: config.backendOpsToken ? '<set>' : '', alerts: Object.fromEntries(Object.entries(config.alerts).map(([k, v]) => [k, v ? (typeof v === 'number' ? v : '<set>') : ''])) } });
  await schedule.refresh();
  socket.start();
  await tick();

  if (once) {
    // Give the socket its room-active/room-unactive + song-change, LiveKit its
    // subscriptions, and the audio analyser a full window.
    await new Promise((r) => setTimeout(r, Math.max(15000, (config.deadlineSeconds + 5) * 1000)));
    livekit.refreshServerTruth && await livekit.refreshServerTruth();
    const snapshot = await evaluateNow();
    // --once has no grace period: report what is true right now.
    const raw = { S: snapshot.S, L: snapshot.L, T: snapshot.T, A: snapshot.A, I: snapshot.I };
    const verdictRed = [];
    if (!snapshot.socket.connected) verdictRed.push('SOCKET_BACKEND_DOWN');
    if (snapshot.livekit.tokenRoute.ok === false) verdictRed.push('TOKEN_ROUTE_BROKEN');
    if (!snapshot.livekit.connected) verdictRed.push('LIVEKIT_UNREACHABLE');
    if (raw.S && !raw.L && !raw.T) verdictRed.push('DEAD_AIR_SOCKET_LIVE_NO_PUBLISHER');
    if (raw.L && !raw.A && !snapshot.livekit.adminSong) verdictRed.push('LIVE_BUT_SILENT');
    if (!raw.S && !raw.L && !raw.T && !raw.I) verdictRed.push('AUTODJ_DOWN');
    for (const [n, r] of Object.entries(http)) if (!r.ok && (n === 'website' || n === 'panel')) verdictRed.push(`${n.toUpperCase()}_DOWN`);
    const verdict = { ts: snapshot.ts, verdict: verdictRed.length ? 'RED' : 'GREEN', red: verdictRed, mode: snapshot.mode, ...raw, socket: snapshot.socket, livekit: snapshot.livekit, icecast: snapshot.icecast, http, schedule: snapshot.schedule };
    console.log('\n=== SYNTHETIC LISTENER VERDICT ===\n' + JSON.stringify(verdict, null, 2));
    await livekit.stop();
    socket.stop();
    process.exit(verdictRed.length ? 1 : 0);
  }

  startServer(() => evaluator.lastSnapshot, () => evaluator);
  // Re-evaluate on every state change AND every second; the 1 s loop is what
  // enforces the "within 10 s" deadline.
  const onChange = () => { evaluateNow().catch((e) => log('evaluate.error', { message: e.message })); };
  socket.on('change', onChange);
  livekit.on('change', onChange);
  setInterval(onChange, 1000);
  setInterval(() => tick().catch((e) => log('tick.error', { message: e.message })), config.tickSeconds * 1000);
  setInterval(scorecard, config.tickSeconds * 1000);
  setTimeout(scorecard, 20000);
}

process.on('unhandledRejection', (r) => log('unhandledRejection', { message: r?.message || String(r) }));
process.on('uncaughtException', (e) => { log('uncaughtException', { message: e.message, stack: e.stack }); });
process.on('SIGTERM', async () => { await livekit.stop(); socket.stop(); process.exit(0); });
process.on('SIGINT', async () => { await livekit.stop(); socket.stop(); process.exit(0); });

main().catch((e) => { log('probe.fatal', { message: e.message, stack: e.stack }); process.exit(2); });
