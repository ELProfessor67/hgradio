// liveState.js — drop into /root/djpanel_backend next to server.js.
//
// Gives the socket backend three things it never had:
//   1. Live state that survives a restart (Redis mirror of roomsowners,
//      roomCurrentSongPlay, scheduleActive; restored on boot).
//   2. A reconciler: every 5 s compare "backend says live" with "LiveKit has
//      an unmuted admin microphone". If they disagree for longer than GRACE,
//      the backend corrects ITSELF and tells the listeners, instead of
//      leaving the website muted on dead air (Oct 21 2026) or playing Auto DJ
//      over a DJ (Oct 20 2026).
//   3. /ops/health, /ops/state, /ops/metrics for the synthetic listener,
//      the reconciliation report and Grafana.
//
// Dependencies (add to package.json, pinned): ioredis@5.6.1 livekit-server-sdk@2.14.2
// Env: REDIS_URL (default redis://127.0.0.1:6379), LIVEKIT_URL, LIVEKIT_API_KEY,
//      LIVEKIT_API_SECRET (same as the panel's .env.local), OPS_TOKEN.
//
// Wiring (done by patch-djbackend-v2.js):
//   const liveState = require('./liveState')({ io, app, roomsowners, ownersSocketId,
//       roomCurrentSongPlay, scheduleActive, listeners, currentSong, djPanelId, userModel, mongoose });
//   owner-join  -> liveState.onOwnerJoin(roomId, user)
//   user-join   -> const owner = liveState.liveOwnerFor(roomId)   (instead of roomsowners[roomId])
//   next-song   -> liveState.onSongChange(roomId, { nextSong, currentSong })
//   disconnect  -> liveState.onOwnerLeft(roomId)
'use strict';

const Redis = require('ioredis');
const { RoomServiceClient } = require('livekit-server-sdk');

const GRACE_MS = Number(process.env.RECONCILE_GRACE_MS || 20000);
const INTERVAL_MS = Number(process.env.RECONCILE_INTERVAL_MS || 5000);
const LIVE_TTL_S = 40; // heartbeat every 10 s; a dead backend's key expires on its own
const ADMIN = 'admin';
const isAdminIdentity = (id) => typeof id === 'string' && (id === ADMIN || id.startsWith(ADMIN + '-'));
const TONE_BOT = 'tone-player-bot';
const MIC = 2; // livekit TrackSource.MICROPHONE

module.exports = function attachLiveState(ctx) {
  const { io, app, roomsowners, ownersSocketId, roomCurrentSongPlay, scheduleActive, listeners, currentSong, djPanelId, userModel, mongoose } = ctx;
  const startedAt = Date.now();
  const stationId = String(djPanelId);

  // ---------------- Redis ----------------
  const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { lazyConnect: false, maxRetriesPerRequest: 2, enableOfflineQueue: false, retryStrategy: (n) => Math.min(30000, 500 * 2 ** Math.min(n, 6)) });
  const rstate = { connected: false, lastError: null, errors: 0 };
  redis.on('ready', () => { rstate.connected = true; console.log('[liveState] redis ready'); });
  redis.on('end', () => { rstate.connected = false; });
  redis.on('error', (e) => { rstate.connected = false; rstate.lastError = e.message; rstate.errors += 1; if (rstate.errors % 20 === 1) console.error('[liveState] redis error:', e.message); });
  const K = { live: (r) => `hg:live:${r}`, song: (r) => `hg:song:${r}`, sched: (r) => `hg:sched:${r}`, restarts: 'hg:backend:restarts', lastStart: 'hg:backend:lastStart' };
  const safe = async (fn) => { try { return await fn(); } catch (e) { rstate.lastError = e.message; return null; } };

  // ---------------- LiveKit truth ----------------
  const lkUrl = (process.env.LIVEKIT_URL || '').replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
  const rs = lkUrl && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET ? new RoomServiceClient(lkUrl, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET) : null;
  // adminMic / adminAny = UNMUTED tracks (what listeners can hear right now).
  // adminTracks = an admin session with any track, muted or not. A DJ muting
  // the mic for a minute is still a live session; a kicked/dead session has
  // no participant at all. Gating and reconciliation use adminTracks so a
  // mute never ends the show for listeners.
  const lk = { configured: !!rs, lastCheckAt: null, lastOkAt: null, error: null, adminMic: false, adminAny: false, adminTracks: false, admins: 0, toneBot: false, participants: 0, identities: [], publishers: 0 };
  async function checkLiveKit() {
    if (!rs) return lk;
    lk.lastCheckAt = Date.now();
    try {
      const ps = await rs.listParticipants(stationId);
      const admins = ps.filter((p) => isAdminIdentity(p.identity));
      lk.admins = admins.length;
      lk.adminMic = admins.some((p) => p.tracks.some((t) => t.source === MIC && !t.muted));
      lk.adminAny = admins.some((p) => p.tracks.some((t) => !t.muted));
      lk.adminTracks = admins.some((p) => p.tracks.length > 0);
      lk.toneBot = ps.some((p) => p.identity === TONE_BOT && p.tracks.length > 0);
      lk.participants = ps.length;
      lk.publishers = ps.filter((p) => p.tracks.length).length;
      lk.identities = ps.map((p) => p.identity);
      lk.error = null; lk.lastOkAt = Date.now();
    } catch (e) {
      if (/not found|does not exist/i.test(e.message)) { Object.assign(lk, { admins: 0, adminMic: false, adminAny: false, adminTracks: false, toneBot: false, participants: 0, publishers: 0, identities: [], error: null, lastOkAt: Date.now() }); }
      else { lk.error = e.message; }
    }
    return lk;
  }

  // ---------------- counters ----------------
  const counters = { clearedStaleOwner: 0, restoredOwnerFromLiveKit: 0, duplicateAdminSeen: 0, userJoinGated: 0, restoredFromRedis: 0, reconcileRuns: 0, reconcileErrors: 0, ownerSocketLostEnded: 0 };
  const divergence = { sinceNoPublisher: null, sinceNoOwner: null, last: null };
  let heartbeat = null;

  function slimOwner(u) {
    if (!u) return null;
    // Never persist or expose the full record: it carries the password hash and JWT.
    return { _id: String(u._id), name: u.name, avatar: u.avatar ?? null, socketId: u.socketId ?? null, welcomeTone: u.welcomeTone ?? null, endingTone: u.endingTone ?? null, isDJ: !!u.isDJ, since: u.since || Date.now(), restored: !!u.restored };
  }

  // ---------------- public hooks ----------------
  function onOwnerJoin(roomId, user) {
    if (!roomId) return;
    // Stamp the in-memory owner too: liveOwnerFor's grace window and the
    // reconciler's "live for Ns" both read it.
    if (roomsowners[roomId] && typeof roomsowners[roomId] === 'object') roomsowners[roomId].since = Date.now();
    // The panel re-announced (reconnect): cancel a pending "socket lost" end-of-show.
    if (socketLossTimers[roomId]) { clearTimeout(socketLossTimers[roomId]); delete socketLossTimers[roomId]; }
    const slim = slimOwner({ ...user, since: Date.now() });
    safe(() => redis.set(K.live(roomId), JSON.stringify(slim), 'EX', LIVE_TTL_S));
    divergence.sinceNoPublisher = null;
    if (!heartbeat) {
      heartbeat = setInterval(() => {
        for (const [r, o] of Object.entries(roomsowners)) {
          if (!o) continue;
          safe(() => redis.set(K.live(r), JSON.stringify(slimOwner(o)), 'EX', LIVE_TTL_S));
        }
        for (const [r, v] of Object.entries(scheduleActive)) safe(() => redis.set(K.sched(r), JSON.stringify(!!v)));
      }, 10000);
    }
    console.log(`[liveState] owner-join room=${roomId} name=${user?.name} livekitAdminMic=${lk.adminMic}`);
  }

  function onOwnerLeft(roomId) {
    if (!roomId) return;
    safe(() => redis.del(K.live(roomId)));
    console.log(`[liveState] owner-left room=${roomId}`);
  }

  // The owner's socket disconnected. Replaces the old instant
  // `delete roomsowners[...]; emit owner-left; emit room-unactive`.
  const socketLossTimers = {};
  function onOwnerSocketLost(roomId, socketId) {
    const owner = roomsowners[roomId];
    if (!owner) return;
    // A newer owner socket (reconnect, second tab) already took over: nothing to do.
    if (owner.socketId && owner.socketId !== socketId) return;
    owner.socketId = null;
    owner.socketLostAt = Date.now();
    console.log(`[liveState] owner socket lost room=${roomId} name=${owner.name}; waiting ${GRACE_MS / 1000}s for a reconnect or LiveKit confirmation`);
    clearTimeout(socketLossTimers[roomId]);
    socketLossTimers[roomId] = setTimeout(async () => {
      const cur = roomsowners[roomId];
      if (!cur || cur.socketId) return;              // gone already, or the panel re-announced
      await checkLiveKit();
      const stillPublishing = rs && !lk.error && lk.adminTracks;
      if (stillPublishing) {
        console.log(`[liveState] owner socket still down but LiveKit has admin publishing: keeping ${cur.name} live (reconciler watches)`);
        return;                                        // reconciler case A ends the show if audio stops
      }
      delete roomsowners[roomId];
      safe(() => redis.del(K.live(roomId)));
      counters.ownerSocketLostEnded += 1;
      console.log(`[liveState] show ended: owner socket gone and no admin publishing (room=${roomId})`);
      io.to(roomId).emit('owner-left', {});
      io.to(roomId).emit('room-unactive', { butScheduleActive: scheduleActive[roomId] });
    }, GRACE_MS);
  }

  function onSongChange(roomId, data) {
    if (!roomId) return;
    safe(() => redis.set(K.song(roomId), JSON.stringify(data)));
  }

  // The gate for user-join: say "live" only if LiveKit agrees (or the owner
  // joined moments ago and LiveKit has not been polled yet / is unconfigured).
  function liveOwnerFor(roomId) {
    const owner = roomsowners[roomId];
    if (!owner) return undefined;
    if (!rs || lk.error) return owner;              // no truth source: fall back to old behaviour
    if (lk.adminTracks || lk.toneBot) return owner;
    const age = Date.now() - (owner.since || 0);
    if (age < GRACE_MS) return owner;               // mic not published yet, give the panel GRACE
    counters.userJoinGated += 1;
    console.warn(`[liveState] user-join gated: owner ${owner.name} in memory but LiveKit has no admin publishing (age ${Math.round(age / 1000)}s)`);
    return undefined;
  }

  // ---------------- reconciler ----------------
  async function reconcile() {
    counters.reconcileRuns += 1;
    await checkLiveKit();
    if (!rs || lk.error) { if (lk.error) counters.reconcileErrors += 1; return; }
    const now = Date.now();
    const owner = roomsowners[stationId];
    const publishing = lk.adminTracks || lk.toneBot;

    if (lk.admins > 1) { counters.duplicateAdminSeen += 1; console.warn(`[liveState] ${lk.admins} admin participants in station room (two Go Live sessions)`); }

    // Case A: backend says live, LiveKit has nobody publishing.
    if (owner && !publishing) {
      if (!divergence.sinceNoPublisher) divergence.sinceNoPublisher = now;
      if (now - divergence.sinceNoPublisher >= GRACE_MS) {
        counters.clearedStaleOwner += 1;
        divergence.last = { at: new Date(now).toISOString(), type: 'cleared-stale-owner', owner: owner.name, identities: lk.identities };
        console.warn(`[liveState] RECONCILE: owner ${owner.name} live for ${Math.round((now - (owner.since || now)) / 1000)}s but LiveKit has no admin publishing -> telling listeners room-unactive`);
        if (owner.socketId) io.to(owner.socketId).emit('reconcile-not-publishing', { reason: 'no admin track in LiveKit', identities: lk.identities });
        delete roomsowners[stationId];
        for (const [sid, uid] of Object.entries(ownersSocketId)) if (String(uid) === stationId) delete ownersSocketId[sid];
        safe(() => redis.del(K.live(stationId)));
        io.to(stationId).emit('room-unactive', { butScheduleActive: scheduleActive[stationId], reconciled: true });
        divergence.sinceNoPublisher = null;
      }
    } else {
      divergence.sinceNoPublisher = null;
    }

    // Case B: LiveKit has the admin publishing, backend has no owner (restart, or owner-join never arrived).
    if (!owner && lk.adminTracks) {
      if (!divergence.sinceNoOwner) divergence.sinceNoOwner = now;
      if (now - divergence.sinceNoOwner >= GRACE_MS) {
        let restored = await safe(async () => { const v = await redis.get(K.live(stationId)); return v ? JSON.parse(v) : null; });
        if (!restored && userModel) {
          const u = await safe(() => userModel.findById(stationId).select('name avatar welcomeTone endingTone isDJ').lean());
          if (u) restored = slimOwner(u);
        }
        if (restored) {
          restored.restored = true; restored.since = now; restored.socketId = restored.socketId || null;
          roomsowners[stationId] = restored;
          counters.restoredOwnerFromLiveKit += 1;
          divergence.last = { at: new Date(now).toISOString(), type: 'restored-owner', owner: restored.name };
          console.warn(`[liveState] RECONCILE: LiveKit admin is publishing but backend had no owner -> restored ${restored.name}, telling listeners room-active`);
          const song = roomCurrentSongPlay[stationId] || {};
          io.to(stationId).emit('room-active', { user: restored, nextSong: song.nextSong, currentSong: song.currentSong, reconciled: true });
          safe(() => redis.set(K.live(stationId), JSON.stringify(restored), 'EX', LIVE_TTL_S));
        }
        divergence.sinceNoOwner = null;
      }
    } else {
      divergence.sinceNoOwner = null;
    }
  }

  // ---------------- restore on boot ----------------
  async function restore() {
    await safe(() => redis.incr(K.restarts));
    await safe(() => redis.set(K.lastStart, new Date().toISOString()));
    const songKeys = (await safe(() => redis.keys('hg:song:*'))) || [];
    for (const k of songKeys) { const v = await safe(() => redis.get(k)); if (v) { try { roomCurrentSongPlay[k.slice(8)] = JSON.parse(v); counters.restoredFromRedis += 1; } catch {} } }
    const schedKeys = (await safe(() => redis.keys('hg:sched:*'))) || [];
    for (const k of schedKeys) { const v = await safe(() => redis.get(k)); if (v) { try { scheduleActive[k.slice(9)] = JSON.parse(v); } catch {} } }
    // Live owner: restore only if LiveKit confirms within the first reconcile.
    const liveRaw = await safe(() => redis.get(K.live(stationId)));
    await checkLiveKit();
    if (liveRaw && (lk.adminTracks || (!rs))) {
      try {
        const o = JSON.parse(liveRaw); o.restored = true; o.socketId = null;
        roomsowners[stationId] = o; counters.restoredFromRedis += 1;
        console.log(`[liveState] restored live owner ${o.name} from redis (LiveKit adminMic=${lk.adminMic})`);
        io.to(stationId).emit('room-active', { user: o, ...(roomCurrentSongPlay[stationId] || {}), reconciled: true });
      } catch {}
    } else if (liveRaw) {
      console.log('[liveState] redis had a live owner but LiveKit has no admin publishing: dropping it');
      await safe(() => redis.del(K.live(stationId)));
    }
    console.log(`[liveState] restore done: songs=${songKeys.length} sched=${schedKeys.length} live=${!!roomsowners[stationId]} redis=${rstate.connected} livekit=${lk.configured}`);
  }

  // ---------------- ops endpoints ----------------
  function authorized(req) {
    const token = process.env.OPS_TOKEN;
    const given = req.get('x-ops-token') || (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (token) return given === token;
    const ip = req.ip || req.socket?.remoteAddress || '';
    return /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(ip);
  }
  const guard = (fn) => (req, res) => { if (!authorized(req)) return res.status(401).json({ error: 'ops token required' }); return fn(req, res); };

  app.get('/ops/health', guard((req, res) => {
    const mongoState = mongoose ? mongoose.connection?.readyState : null; // 1 = connected
    const lkAge = lk.lastOkAt ? Math.round((Date.now() - lk.lastOkAt) / 1000) : null;
    const ok = (mongoState === 1 || mongoState === null) && (!rs || (lkAge !== null && lkAge < 60));
    res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', uptimeSeconds: Math.round((Date.now() - startedAt) / 1000), mongo: mongoState, redis: rstate, livekit: { configured: lk.configured, lastOkAgeSeconds: lkAge, error: lk.error }, liquidsoap: typeof ctx.liquidsoapAlive === 'function' ? ctx.liquidsoapAlive() : null, pid: process.pid, node: process.version });
  }));

  app.get('/ops/state', guard(async (req, res) => {
    const mirror = await safe(async () => { const v = await redis.get(K.live(stationId)); return { owner: v ? JSON.parse(v) : null }; });
    res.json({
      ts: new Date().toISOString(),
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      roomsowners: Object.fromEntries(Object.entries(roomsowners).map(([k, v]) => [k, slimOwner(v)])),
      ownersSocketIdCount: Object.keys(ownersSocketId).length,
      listenersCount: Object.keys(listeners).length,
      listenersByRoom: Object.values(listeners).reduce((a, r) => { a[r] = (a[r] || 0) + 1; return a; }, {}),
      roomCurrentSongPlay: Object.fromEntries(Object.entries(roomCurrentSongPlay).map(([k, v]) => [k, { current: v?.currentSong?.title, next: v?.nextSong?.title }])),
      scheduleActive,
      autoDj: Object.fromEntries(Object.entries(currentSong || {}).map(([k, v]) => [k, { title: v?.currentSong?.title, startedAt: v?.currentTime ? new Date(v.currentTime).toISOString() : null, duration: v?.currentSong?.duration }])),
      redis: rstate,
      redisMirror: mirror,
      livekit: lk,
      reconciler: { graceMs: GRACE_MS, intervalMs: INTERVAL_MS, counters, divergence },
    });
  }));

  app.get('/ops/metrics', guard(async (req, res) => {
    const restarts = (await safe(() => redis.get(K.restarts))) || 0;
    const lines = [
      `# TYPE backend_process_start_time_seconds gauge`, `backend_process_start_time_seconds ${Math.floor(startedAt / 1000)}`,
      `# TYPE backend_restarts_total counter`, `backend_restarts_total ${restarts}`,
      `# TYPE backend_live gauge`, `backend_live ${roomsowners[stationId] ? 1 : 0}`,
      `# TYPE backend_listeners gauge`, `backend_listeners ${Object.keys(listeners).length}`,
      `# TYPE backend_redis_connected gauge`, `backend_redis_connected ${rstate.connected ? 1 : 0}`,
      `# TYPE backend_livekit_admin_mic gauge`, `backend_livekit_admin_mic ${lk.adminMic ? 1 : 0}`,
      `# TYPE backend_livekit_participants gauge`, `backend_livekit_participants ${lk.participants}`,
      `# TYPE backend_livekit_check_age_seconds gauge`, `backend_livekit_check_age_seconds ${lk.lastOkAt ? Math.round((Date.now() - lk.lastOkAt) / 1000) : -1}`,
      `# TYPE backend_mongo_ready gauge`, `backend_mongo_ready ${mongoose ? mongoose.connection?.readyState : -1}`,
      `# TYPE backend_reconcile_divergences_total counter`,
      ...Object.entries(counters).map(([k, v]) => `backend_reconcile_divergences_total{type="${k}"} ${v}`),
    ];
    res.set('content-type', 'text/plain; version=0.0.4').send(lines.join('\n') + '\n');
  }));

  // ---------------- start ----------------
  restore().catch((e) => console.error('[liveState] restore failed:', e.message));
  setInterval(() => reconcile().catch((e) => { counters.reconcileErrors += 1; console.error('[liveState] reconcile error:', e.message); }), INTERVAL_MS);

  return { onOwnerJoin, onOwnerLeft, onOwnerSocketLost, onSongChange, liveOwnerFor, reconcile, checkLiveKit, state: () => ({ lk, rstate, counters }) };
};
