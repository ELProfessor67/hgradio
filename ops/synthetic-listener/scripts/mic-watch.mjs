// 90-second watch: joins the station room as a listener and prints peak dBFS per track every 5 s.
import { Room, RoomEvent, AudioStream } from '@livekit/rtc-node';
const STATION = '655347b59c00a7409d9181c3';
const j = await (await fetch(`https://hgdjlive.com/api/v1/token?room=${STATION}&isAdmin=false`)).json();
const room = new Room();
const levels = {};
room.on(RoomEvent.TrackSubscribed, (track, pub, p) => {
  if (p.identity !== 'admin') return;
  const key = pub.name || 'mic';
  levels[key] = { peak: -Infinity, frames: 0 };
  (async () => {
    const stream = new AudioStream(track, 16000, 1);
    for await (const f of stream) {
      const d = f.data; let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i];
      const rms = Math.sqrt(s / d.length) / 32768; const db = 20 * Math.log10(rms || 1e-9);
      const e = levels[key]; e.frames++; if (db > e.peak) e.peak = db;
    }
  })();
});
await room.connect(j.serverUrl, j.participantToken, { autoSubscribe: true, dynacast: false });
console.log('connected; admin present:', [...room.remoteParticipants.values()].some(p => p.identity === 'admin'));
for (let t = 5; t <= 90; t += 5) {
  await new Promise(r => setTimeout(r, 5000));
  const line = Object.entries(levels).map(([k, e]) => `${k}=${Number.isFinite(e.peak) ? e.peak.toFixed(0) : '-'}dB`).join('  ');
  console.log(`${String(t).padStart(2)}s  ${line}`);
  for (const e of Object.values(levels)) e.peak = -Infinity;
}
await room.disconnect(); process.exit(0);
