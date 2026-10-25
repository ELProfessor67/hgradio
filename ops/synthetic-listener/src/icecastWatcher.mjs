import { spawn } from 'node:child_process';
import { config } from './config.mjs';
import { log } from './log.mjs';

// Auto DJ path: Liquidsoap -> Icecast mount -> <audio id="auto-dj"> on the site.
// Two checks: the mount exists in status-json.xsl, and bytes actually flow at
// roughly the advertised bitrate when we open it like a browser would.
export class IcecastWatcher {
  constructor() {
    this.state = {
      status: { ok: null, mountUp: null, listeners: null, listenerPeak: null, bitrate: null, title: null, streamStart: null, serverStart: null, ms: null, error: null, checkedAt: null },
      stream: { ok: null, http: null, bytes: 0, seconds: 0, kbps: null, mp3Sync: null, meanVolumeDb: null, error: null, checkedAt: null },
    };
  }

  async checkStatus() {
    const t0 = Date.now();
    const s = { ok: false, mountUp: false, listeners: null, listenerPeak: null, bitrate: null, title: null, streamStart: null, serverStart: null, ms: null, error: null, checkedAt: Date.now() };
    try {
      const res = await fetch(`${config.icecastUrl}/status-json.xsl`, { signal: AbortSignal.timeout(10000) });
      s.ms = Date.now() - t0;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      s.serverStart = j?.icestats?.server_start_iso8601 ?? null;
      let sources = j?.icestats?.source ?? [];
      if (!Array.isArray(sources)) sources = [sources];
      const mount = sources.find((m) => (m.listenurl || m.server_name || '').endsWith(config.stationId));
      s.mountUp = !!mount;
      if (mount) {
        s.listeners = mount.listeners ?? null;
        s.listenerPeak = mount.listener_peak ?? null;
        s.bitrate = mount.bitrate ?? null;
        s.title = mount.title ?? null;
        s.streamStart = mount.stream_start_iso8601 ?? null;
      }
      s.ok = true;
    } catch (e) {
      s.error = e.message;
      s.ms = Date.now() - t0;
    }
    this.state.status = s;
    log('icecast.status', { ok: s.ok, mountUp: s.mountUp, listeners: s.listeners, title: s.title, streamStart: s.streamStart, ms: s.ms, error: s.error });
    return s;
  }

  // Open the mount for N seconds and measure. Optionally pipe through ffmpeg
  // volumedetect so "bytes flowing but silent" is also caught.
  async sampleStream() {
    const seconds = config.icecastSampleSeconds;
    const r = { ok: false, http: null, bytes: 0, seconds, kbps: null, mp3Sync: null, meanVolumeDb: null, error: null, checkedAt: Date.now() };
    const url = `${config.icecastUrl}/${config.stationId}`;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), seconds * 1000 + 1500);
    const chunks = [];
    const t0 = Date.now();
    try {
      const res = await fetch(url, { signal: ac.signal, headers: { 'Icy-MetaData': '0' } });
      r.http = res.status;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      while (Date.now() - t0 < seconds * 1000) {
        const { value, done } = await reader.read();
        if (done) break;
        r.bytes += value.length;
        if (chunks.length < 64) chunks.push(Buffer.from(value));
      }
      reader.cancel().catch(() => {});
    } catch (e) {
      if (e.name !== 'AbortError') r.error = e.message;
    } finally {
      clearTimeout(timer);
    }
    const elapsed = Math.max(0.5, (Date.now() - t0) / 1000);
    r.kbps = Math.round((r.bytes * 8) / elapsed / 1000);
    const buf = Buffer.concat(chunks);
    r.mp3Sync = hasMp3Sync(buf);
    const advertised = this.state.status.bitrate || 128;
    r.ok = r.http === 200 && r.kbps >= advertised * config.icecastMinBitrateFraction && r.mp3Sync === true;
    if (config.ffmpegPath && buf.length > 0) {
      r.meanVolumeDb = await meanVolume(buf).catch(() => null);
      if (r.meanVolumeDb !== null && r.meanVolumeDb < config.silenceDbfs) r.ok = false;
    }
    this.state.stream = r;
    log('icecast.stream', { ok: r.ok, http: r.http, kbps: r.kbps, bytes: r.bytes, mp3Sync: r.mp3Sync, meanVolumeDb: r.meanVolumeDb, error: r.error });
    return r;
  }
}

// MPEG audio frame sync: 11 set bits. Look for two syncs to avoid random hits.
function hasMp3Sync(buf) {
  if (!buf || buf.length < 4) return null;
  let found = 0;
  for (let i = 0; i < buf.length - 1 && found < 2; i++) {
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) found++;
  }
  return found >= 2;
}

function meanVolume(buf) {
  return new Promise((resolve, reject) => {
    const ff = spawn(config.ffmpegPath, ['-hide_banner', '-nostats', '-f', 'mp3', '-i', 'pipe:0', '-af', 'volumedetect', '-f', 'null', '-'], { stdio: ['pipe', 'ignore', 'pipe'] });
    let err = '';
    ff.stderr.on('data', (d) => { err += d.toString(); });
    ff.on('error', reject);
    ff.on('close', () => {
      const m = err.match(/mean_volume:\s*(-?[\d.]+) dB/);
      resolve(m ? Number(m[1]) : null);
    });
    ff.stdin.on('error', () => {});
    ff.stdin.end(buf);
  });
}
