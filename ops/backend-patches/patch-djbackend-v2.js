// Wires liveState.js into /root/djpanel_backend/server.js.
// Usage on the server:  node ops/backend-patches/patch-djbackend-v2.js /root/djpanel_backend
// Same contract as the Oct 20 patcher: every edit must match exactly once or
// NOTHING is written; re-running skips edits already applied; the first
// backup (<file>.before-livestate-20261022) is kept.
//
// Anchors are from the Sep 30 snapshot (Desktop/djpanel_backend.tgz); the Oct 20
// patch did not touch these handlers. If an anchor fails, send the FAIL line back.
const fs = require('fs');
const path = require('path');

const dir = process.argv[2] || '/root/djpanel_backend';
const stamp = 'livestate-20261022';

const edits = {
  'server.js': [
    {
      name: 'attach liveState after djPanelId',
      marker: "require('./liveState')",
      from: 'const djPanelId = "655347b59c00a7409d9181c3"\n',
      to: `const djPanelId = "655347b59c00a7409d9181c3"

// Redis-backed live state + LiveKit reconciler + /ops/* (ops/backend-patches/liveState.js)
const liveState = require('./liveState')({
  io, app, roomsowners, ownersSocketId, roomCurrentSongPlay, scheduleActive, listeners, currentSong,
  djPanelId, userModel, mongoose,
  liquidsoapAlive: () => !!(processLiq && processLiq.exitCode === null),
});
`,
    },
    {
      name: 'owner-join persists + stamps since',
      marker: 'liveState.onOwnerJoin',
      from: 'ownersSocketId[socket.id] = data?.user?._id;\n',
      to: `ownersSocketId[socket.id] = data?.user?._id;
    if (roomsowners[data?.user?._id]) roomsowners[data?.user?._id].since = Date.now();
    liveState.onOwnerJoin(data?.user?._id?.toString(), data?.user);
`,
    },
    {
      name: 'user-join answers live only when LiveKit agrees',
      marker: 'liveState.liveOwnerFor',
      from: 'const owner = roomsowners[data.roomId];\n    listeners[socket.id] = data.roomId;',
      to: '// Only claim "live" when LiveKit really has the admin publishing (or within the grace window).\n    const owner = liveState.liveOwnerFor(data.roomId);\n    listeners[socket.id] = data.roomId;',
    },
    {
      name: 'next-song persists',
      marker: 'liveState.onSongChange',
      from: 'roomCurrentSongPlay[roomId] = { nextSong, currentSong };\n',
      to: 'roomCurrentSongPlay[roomId] = { nextSong, currentSong };\n    liveState.onSongChange(roomId, { nextSong, currentSong });\n',
    },
    {
      name: 'owner socket drop is debounced against LiveKit instead of ending the show',
      marker: 'liveState.onOwnerSocketLost',
      from: `const userId = ownersSocketId[socket.id];

    let user;
    if (userId) {
      user = roomsowners[userId];
    }
    delete roomsowners[userId];
    delete ownersSocketId[socket.id];
    io.to(userId).emit('owner-left', {});
    io.to(userId).emit('room-unactive', {});
`,
      to: `const userId = ownersSocketId[socket.id];
    delete ownersSocketId[socket.id];
    // A DJ's socket dropping (phone network, nginx reload) used to end the show
    // for every listener instantly, while the DJ kept publishing to LiveKit.
    // Now: wait a grace period, re-check LiveKit, and only then tell listeners.
    if (userId) liveState.onOwnerSocketLost(String(userId), socket.id);

    `,
    },
  ],
};

const looseRegex = (s) => new RegExp(
  s.split(/(\s+)/).map((p) => {
    if (!/^\s+$/.test(p)) return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // One or more line breaks (blank lines in the original are fine).
    return p.includes('\n') ? '(?:[ \\t]*\\n)+[ \\t]*' : '[ \\t]+';
  }).join(''), 'g');

const out = {};
let failed = false;
for (const [file, list] of Object.entries(edits)) {
  const full = path.join(dir, file);
  const original = fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n');
  let text = original;
  for (const e of list) {
    if (text.includes(e.marker)) { console.log(`skip  ${file}: ${e.name} (already applied)`); continue; }
    const re = looseRegex(e.from);
    const hits = text.match(re) || [];
    if (hits.length !== 1) { console.error(`FAIL  ${file}: ${e.name} (expected 1 match, found ${hits.length})`); failed = true; continue; }
    text = text.replace(re, () => e.to);
    console.log(`ok    ${file}: ${e.name}`);
  }
  if (text !== original) out[file] = text;
}

if (failed) { console.error('\nNothing was written. Send the FAIL lines back.'); process.exit(1); }

// liveState.js itself
const src = path.join(__dirname, 'liveState.js');
const dst = path.join(dir, 'liveState.js');
if (fs.existsSync(src)) { fs.copyFileSync(src, dst); console.log('ok    copied liveState.js'); }
else if (!fs.existsSync(dst)) { console.error('FAIL  liveState.js not found next to this script and not already in target'); process.exit(1); }

for (const [file, text] of Object.entries(out)) {
  const full = path.join(dir, file);
  const backup = `${full}.before-${stamp}`;
  if (!fs.existsSync(backup)) fs.copyFileSync(full, backup);
  fs.writeFileSync(full, text);
}
console.log(Object.keys(out).length ? `\nWrote: ${Object.keys(out).join(', ')}  (backups: <file>.before-${stamp})` : '\nNothing to change, all edits already applied.');
console.log('\nNext: npm install --save-exact ioredis@5.6.1 livekit-server-sdk@2.14.2 && add REDIS_URL, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, OPS_TOKEN to config/.env, then node --check server.js && pm2 restart "audio backend" OUTSIDE a show.');
