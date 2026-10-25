import http from 'node:http';
import client from 'prom-client';
import { config } from './config.mjs';
import { CONDITIONS } from './evaluator.mjs';

// Prometheus exposition for Grafana, plus /health (Uptime Kuma HTTP keyword
// monitor) and /state (the full snapshot, for humans and the reconciler).
const reg = new client.Registry();
reg.setDefaultLabels({ probe: config.probeId, station: config.stationId });

const g = (name, help, labelNames = []) => { const x = new client.Gauge({ name, help, labelNames }); reg.registerMetric(x); return x; };
const c = (name, help, labelNames = []) => { const x = new client.Counter({ name, help, labelNames }); reg.registerMetric(x); return x; };

export const M = {
  green: g('synthetic_listener_green', '1 when no red condition is open'),
  mode: g('synthetic_listener_mode', 'current mode', ['mode']),
  correctAudio: g('synthetic_listener_correct_audio', '1 when the probe hears what a listener should hear right now'),
  socketConnected: g('socket_connected', 'socket.io connected to backend'),
  socketLive: g('socket_live', 'backend says DJ live (room-active)'),
  socketPolling: g('socket_transport_polling', '1 when on long-polling'),
  socketReconnects: g('socket_reconnects_total_gauge', 'socket reconnects since probe start'),
  lkConnected: g('livekit_connected', 'probe joined the station room'),
  lkAdminMic: g('livekit_admin_mic_published', 'client view: admin unmuted mic publication'),
  lkAdminPresent: g('livekit_admin_present', 'client view: admin participant present'),
  lkServerParticipants: g('livekit_server_participants', 'server truth: participants in station room'),
  lkServerPublishers: g('livekit_server_publishers', 'server truth: participants with tracks'),
  lkServerAdminMic: g('livekit_server_admin_mic', 'server truth: admin publishing unmuted mic'),
  lkDuplicateAdmins: g('livekit_duplicate_admins', 'server truth: number of admin participants'),
  lkTokenRouteUp: g('livekit_token_route_up', 'panel token route returns a JWT for the right room'),
  lkTokenRouteMs: g('livekit_token_route_ms', 'token route latency ms'),
  audioDbfs: g('listener_audio_dbfs', 'rolling peak dBFS of a subscribed track', ['track']),
  hearingAdmin: g('listener_hearing_admin', '1 when non-silent admin audio arrived in the last deadline window'),
  iceMountUp: g('icecast_mount_up', 'station mount present in status-json'),
  iceListeners: g('icecast_listeners', 'Icecast listeners on the station mount'),
  iceKbps: g('icecast_stream_kbps', 'measured kbps when the probe opens the mount'),
  iceStreamOk: g('icecast_stream_ok', 'mount opened and flowed at ~bitrate with MP3 sync'),
  iceMeanVolume: g('icecast_mean_volume_db', 'ffmpeg mean volume of the sample (if FFMPEG_PATH set)'),
  httpUp: g('endpoint_up', 'HTTP endpoint returned 2xx/3xx', ['endpoint']),
  httpMs: g('endpoint_ms', 'HTTP endpoint latency', ['endpoint']),
  condition: g('condition_open', '1 while the condition is raised', ['condition', 'severity']),
  scheduled: g('scheduled_show_now', '1 when the public schedule has a slot right now'),
  sinceChange: g('seconds_since_state_change', 'seconds since S/L/T last changed'),
  ttc: new client.Histogram({ name: 'time_to_correct_audio_seconds', help: 'seconds from a state change until the probe hears the right audio', buckets: [1, 2, 3, 5, 8, 10, 15, 20, 30, 60], registers: [reg] }),
  transitions: c('state_transitions_total', 'state changes observed', ['ok']),
  alerts: c('alerts_sent_total', 'alerts sent', ['severity', 'type']),
};

for (const [k, v] of Object.entries(CONDITIONS)) M.condition.set({ condition: k, severity: v.sev }, 0);

export function publish(snapshot, evaluator) {
  const s = snapshot;
  M.green.set(s.green ? 1 : 0);
  for (const m of ['LIVE', 'TONE', 'AUTODJ']) M.mode.set({ mode: m }, s.mode === m ? 1 : 0);
  M.correctAudio.set(s.correctAudio ? 1 : 0);
  M.socketConnected.set(s.socket.connected ? 1 : 0);
  M.socketLive.set(s.socket.live ? 1 : 0);
  M.socketPolling.set(s.socket.transport === 'polling' ? 1 : 0);
  M.socketReconnects.set(s.socket.reconnects);
  M.lkConnected.set(s.livekit.connected ? 1 : 0);
  M.lkAdminMic.set(s.livekit.adminMic ? 1 : 0);
  M.lkAdminPresent.set(s.livekit.adminPresent ? 1 : 0);
  if (s.livekit.server) {
    M.lkServerParticipants.set(s.livekit.server.participants ?? 0);
    M.lkServerPublishers.set(s.livekit.server.publishers ?? 0);
    M.lkServerAdminMic.set(s.livekit.server.adminMic ? 1 : 0);
    M.lkDuplicateAdmins.set(s.livekit.server.duplicateAdmins ?? 0);
  }
  M.lkTokenRouteUp.set(s.livekit.tokenRoute.ok ? 1 : 0);
  if (s.livekit.tokenRoute.ms != null) M.lkTokenRouteMs.set(s.livekit.tokenRoute.ms);
  M.audioDbfs.reset();
  for (const [k, a] of Object.entries(s.livekit.audio || {})) if (a.dbfs != null) M.audioDbfs.set({ track: k }, a.dbfs);
  M.hearingAdmin.set(s.A ? 1 : 0);
  M.iceMountUp.set(s.icecast.mountUp ? 1 : 0);
  if (s.icecast.listeners != null) M.iceListeners.set(s.icecast.listeners);
  if (s.icecast.kbps != null) M.iceKbps.set(s.icecast.kbps);
  M.iceStreamOk.set(s.icecast.streamOk ? 1 : 0);
  if (s.icecast.meanVolumeDb != null) M.iceMeanVolume.set(s.icecast.meanVolumeDb);
  for (const [name, r] of Object.entries(s.http || {})) { M.httpUp.set({ endpoint: name }, r.ok ? 1 : 0); if (r.ms != null) M.httpMs.set({ endpoint: name }, r.ms); }
  for (const [k, v] of Object.entries(CONDITIONS)) M.condition.set({ condition: k, severity: v.sev }, evaluator.open[k]?.raisedAt ? 1 : 0);
  M.scheduled.set(s.schedule ? 1 : 0);
  M.sinceChange.set(s.sinceStateChangeSeconds);
}

export function startServer(getSnapshot, getEvaluator) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/metrics') {
      res.writeHead(200, { 'content-type': reg.contentType });
      res.end(await reg.metrics());
      return;
    }
    const snap = getSnapshot();
    if (url.pathname === '/health') {
      const ok = !!snap?.green;
      res.writeHead(ok ? 200 : 503, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: ok ? 'GREEN' : 'RED', mode: snap?.mode, red: snap?.red, amber: snap?.amber, ts: snap?.ts }));
      return;
    }
    if (url.pathname === '/state') {
      const ev = getEvaluator();
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ snapshot: snap, open: ev.open, transitions: ev.transitions.slice(-50), ttc: ev.ttcStats() }, null, 2));
      return;
    }
    res.writeHead(404); res.end('metrics|health|state');
  });
  server.listen(config.metricsPort, () => console.log(JSON.stringify({ ts: new Date().toISOString(), kind: 'metrics.listen', port: config.metricsPort })));
  return server;
}
