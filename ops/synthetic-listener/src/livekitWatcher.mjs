import { EventEmitter } from 'node:events';
import { Room, RoomEvent, AudioStream, TrackKind, TrackSource } from '@livekit/rtc-node';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { config } from './config.mjs';
import { log } from './log.mjs';

// Participant identities the clients key on (website LiveContext.jsx, app LiveContext.tsx).
export const ADMIN = 'admin';
// Per-DJ identities are 'admin-<userId>' (panel api/v1/token); bare 'admin' = older tokens.
export const isAdminIdentity = (id) => typeof id === 'string' && (id === ADMIN || id.startsWith(ADMIN + '-'));
export const TONE_BOT = 'tone-player-bot';

// rtc-node exports the FFI enum (SOURCE_MICROPHONE = 2); fall back to the number.
const MIC = TrackSource?.SOURCE_MICROPHONE ?? 2;
const AUDIO = TrackKind?.KIND_AUDIO ?? 1;

const ANALYSIS_WINDOW_MS = 3000;

// What a real listener's browser does: fetch a token from the panel, join the
// station room, subscribe to admin + tone-bot audio, and (unlike a browser)
// actually measure whether the PCM that arrives is sound or silence.
export class LiveKitWatcher extends EventEmitter {
  constructor() {
    super();
    this.room = null;
    this.state = {
      connected: false,
      connectedAt: null,
      reconnects: 0,
      lastDisconnectReason: null,
      lastError: null,
      tokenRoute: { ok: null, status: null, room: null, identity: null, ms: null, checkedAt: null },
      participants: [],           // identities currently in the room (client view)
      adminPresent: false,
      adminMicPublished: false,   // admin has an unmuted microphone publication
      adminMicSince: null,
      adminSongPublished: false,  // song-hd / song-lo tracks
      toneBotPresent: false,
      toneBotPublishing: false,
      // Per-track audio levels, key = `${identity}/${trackName||source}`
      audio: {},                  // key -> { dbfs, lastFrameAt, lastSoundAt, frames }
      // Server-side truth (needs API key). null when not configured/unreachable.
      server: null,               // { participants:[{identity, tracks:[{source, muted, name}]}], adminPublishingMic, numPublishers, checkedAt, error }
    };
    this._streams = new Map();   // trackSid -> { stop }
    this.roomService = (config.livekitApiKey && config.livekitApiSecret && config.livekitUrl)
      ? new RoomServiceClient(config.livekitUrl.replace(/^wss?:\/\//, (m) => (m === 'wss://' ? 'https://' : 'http://')), config.livekitApiKey, config.livekitApiSecret)
      : null;
  }

  // ---- token route: the exact URL the website and app call ----
  async checkTokenRoute() {
    const url = `${config.panelUrl}/api/v1/token?room=${config.stationId}&isAdmin=false`;
    const t0 = Date.now();
    const r = { ok: false, status: null, room: null, identity: null, ms: null, checkedAt: Date.now(), error: null };
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      r.status = res.status;
      r.ms = Date.now() - t0;
      if (res.ok) {
        const data = await res.json();
        const claims = decodeJwt(data.participantToken);
        r.room = claims?.video?.room ?? null;
        r.identity = claims?.sub ?? data.participantIdentity ?? null;
        r.canPublish = claims?.video?.canPublish ?? null;
        r.serverUrl = data.serverUrl;
        // The Oct 20 '?isAdmin' bug: the room in the JWT must be the bare id.
        r.ok = r.room === config.stationId && typeof data.participantToken === 'string';
        r.token = data.participantToken;
      }
    } catch (e) {
      r.error = e.message;
      r.ms = Date.now() - t0;
    }
    this.state.tokenRoute = { ...r, token: undefined };
    log('livekit.tokenRoute', { ok: r.ok, status: r.status, room: r.room, canPublish: r.canPublish, ms: r.ms, error: r.error });
    return r;
  }

  async _mintOwnToken() {
    const at = new AccessToken(config.livekitApiKey, config.livekitApiSecret, {
      identity: `${config.probeId}-${process.pid}`,
      name: config.probeId,
      ttl: '2h',
    });
    at.addGrant({ room: config.stationId, roomJoin: true, canPublish: false, canSubscribe: true, canPublishData: false });
    return at.toJwt();
  }

  async connect() {
    const route = await this.checkTokenRoute();
    let token = route.token;
    let url = route.serverUrl || config.livekitUrl;
    if (config.livekitApiKey && config.livekitApiSecret && config.livekitUrl) {
      // Prefer our own identity so the reconciler and the LiveKit logs can tell
      // the probe apart from real listeners, and so it can never publish.
      token = await this._mintOwnToken();
      url = config.livekitUrl;
    }
    if (!token || !url) {
      this.state.lastError = `no token (route ok=${route.ok}, status=${route.status})`;
      this.emit('change', 'livekit.noToken');
      return false;
    }
    const room = new Room();
    this.room = room;
    this._wire(room);
    try {
      await room.connect(url, token, { autoSubscribe: true, dynacast: false });
      this.state.connected = true;
      this.state.connectedAt = Date.now();
      this.state.lastError = null;
      this._snapshotParticipants();
      log('livekit.connected', { url, participants: this.state.participants });
      this.emit('change', 'livekit.connected');
      return true;
    } catch (e) {
      this.state.connected = false;
      this.state.lastError = e.message;
      log('livekit.connect_error', { message: e.message });
      this.emit('change', 'livekit.connect_error');
      return false;
    }
  }

  _wire(room) {
    room.on(RoomEvent.ParticipantConnected, (p) => { this._snapshotParticipants(); log('livekit.participantConnected', { identity: p.identity }); this.emit('change', 'livekit.participant'); });
    room.on(RoomEvent.ParticipantDisconnected, (p) => { this._snapshotParticipants(); log('livekit.participantDisconnected', { identity: p.identity }); this.emit('change', 'livekit.participant'); });
    room.on(RoomEvent.TrackPublished, (pub, p) => { this._snapshotParticipants(); log('livekit.trackPublished', { identity: p.identity, name: pub.name, source: pub.source, muted: pub.muted }); this.emit('change', 'livekit.publish'); });
    room.on(RoomEvent.TrackUnpublished, (pub, p) => { this._snapshotParticipants(); log('livekit.trackUnpublished', { identity: p.identity, name: pub.name, source: pub.source }); this.emit('change', 'livekit.publish'); });
    room.on(RoomEvent.TrackMuted, (pub, p) => { this._snapshotParticipants(); log('livekit.trackMuted', { identity: p.identity, name: pub.name }); this.emit('change', 'livekit.mute'); });
    room.on(RoomEvent.TrackUnmuted, (pub, p) => { this._snapshotParticipants(); log('livekit.trackUnmuted', { identity: p.identity, name: pub.name }); this.emit('change', 'livekit.mute'); });
    room.on(RoomEvent.TrackSubscribed, (track, pub, p) => {
      log('livekit.trackSubscribed', { identity: p.identity, name: pub.name, source: pub.source, kind: track.kind });
      if (track.kind === AUDIO && (isAdminIdentity(p.identity) || p.identity === TONE_BOT)) this._analyse(track, pub, p);
      this._snapshotParticipants();
      this.emit('change', 'livekit.subscribed');
    });
    room.on(RoomEvent.TrackUnsubscribed, (track, pub, p) => {
      log('livekit.trackUnsubscribed', { identity: p.identity, name: pub.name });
      const key = trackKey(p, pub);
      this._streams.get(track.sid)?.stop();
      this._streams.delete(track.sid);
      delete this.state.audio[key];
      this._snapshotParticipants();
      this.emit('change', 'livekit.unsubscribed');
    });
    room.on(RoomEvent.TrackSubscriptionFailed, (sid, p, reason) => log('livekit.trackSubscriptionFailed', { identity: p.identity, sid, reason }));
    room.on(RoomEvent.Reconnecting, () => { log('livekit.reconnecting'); this.state.connected = false; this.emit('change', 'livekit.reconnecting'); });
    room.on(RoomEvent.Reconnected, () => { log('livekit.reconnected'); this.state.connected = true; this.state.reconnects += 1; this._snapshotParticipants(); this.emit('change', 'livekit.reconnected'); });
    room.on(RoomEvent.Disconnected, (reason) => {
      this.state.connected = false;
      this.state.lastDisconnectReason = String(reason);
      log('livekit.disconnected', { reason: String(reason) });
      for (const s of this._streams.values()) s.stop();
      this._streams.clear();
      this.state.audio = {};
      this._snapshotParticipants();
      this.emit('change', 'livekit.disconnected');
      // Reconnect with a fresh token: a kicked or expired session must not
      // leave the probe blind (the panel had exactly this bug on Oct 21).
      setTimeout(() => this.connect().catch(() => {}), 3000);
    });
  }

  _snapshotParticipants() {
    const room = this.room;
    const st = this.state;
    const ids = [];
    let adminPresent = false, adminMic = false, adminSong = false, tonePresent = false, tonePub = false;
    if (room?.isConnected) {
      for (const p of room.remoteParticipants.values()) {
        ids.push(p.identity);
        const pubs = [...p.trackPublications.values()];
        if (isAdminIdentity(p.identity)) {
          adminPresent = true;
          adminMic = pubs.some((pub) => pub.source === MIC && !pub.muted);
          adminSong = pubs.some((pub) => /^song-(hd|lo)$/.test(pub.name || '') && !pub.muted);
        }
        if (p.identity === TONE_BOT) {
          tonePresent = true;
          tonePub = pubs.some((pub) => pub.kind === AUDIO && !pub.muted);
        }
      }
    }
    if (adminMic && !st.adminMicPublished) st.adminMicSince = Date.now();
    if (!adminMic) st.adminMicSince = null;
    Object.assign(st, { participants: ids, adminPresent, adminMicPublished: adminMic, adminSongPublished: adminSong, toneBotPresent: tonePresent, toneBotPublishing: tonePub });
  }

  // Decode the subscribed track to PCM and keep a rolling dBFS. This is the
  // only part of the platform that can say "a listener would HEAR something".
  _analyse(track, pub, p) {
    const key = trackKey(p, pub);
    const entry = { dbfs: -Infinity, lastFrameAt: null, lastSoundAt: null, frames: 0, startedAt: Date.now() };
    this.state.audio[key] = entry;
    const stream = new AudioStream(track, 16000, 1);
    const reader = stream.getReader();
    let stopped = false;
    let window = [];
    const pump = async () => {
      try {
        while (!stopped) {
          const { value: frame, done } = await reader.read();
          if (done || !frame) break;
          const rms = rmsDbfs(frame.data);
          const now = Date.now();
          window.push({ t: now, rms });
          window = window.filter((w) => now - w.t <= ANALYSIS_WINDOW_MS);
          // Peak of the window: a DJ pausing between words is not "silence".
          entry.dbfs = Math.max(...window.map((w) => w.rms));
          entry.lastFrameAt = now;
          entry.frames += 1;
          if (entry.dbfs > config.silenceDbfs) entry.lastSoundAt = now;
        }
      } catch (e) {
        if (!stopped) log('livekit.audioStreamError', { key, message: e.message });
      }
    };
    pump();
    this._streams.set(track.sid, { stop: () => { stopped = true; reader.cancel().catch(() => {}); } });
  }

  // Server-side truth, independent of this client's own subscription state.
  async refreshServerTruth() {
    if (!this.roomService) return null;
    const t0 = Date.now();
    try {
      const ps = await this.roomService.listParticipants(config.stationId);
      const participants = ps.map((p) => ({
        identity: p.identity,
        state: p.state,
        canPublish: p.permission?.canPublish ?? null,
        tracks: p.tracks.map((t) => ({ name: t.name, source: t.source, muted: t.muted, type: t.type })),
      }));
      const admin = participants.find((p) => isAdminIdentity(p.identity));
      const server = {
        checkedAt: Date.now(),
        ms: Date.now() - t0,
        error: null,
        participants,
        numParticipants: participants.length,
        numPublishers: participants.filter((p) => p.tracks.length > 0).length,
        adminPresent: !!admin,
        // proto TrackSource.MICROPHONE = 2 in the server SDK too
        adminPublishingMic: !!admin?.tracks.some((t) => t.source === 2 && !t.muted),
        adminPublishingAny: !!admin?.tracks.some((t) => !t.muted),
        toneBotPublishing: !!participants.find((p) => p.identity === TONE_BOT)?.tracks.some((t) => !t.muted),
        duplicateAdmins: participants.filter((p) => isAdminIdentity(p.identity)).length,
      };
      this.state.server = server;
      return server;
    } catch (e) {
      // "room not found" simply means nobody is in it (LiveKit closes empty rooms).
      const notFound = /not found|does not exist/i.test(e.message);
      this.state.server = { checkedAt: Date.now(), ms: Date.now() - t0, error: notFound ? null : e.message, participants: [], numParticipants: 0, numPublishers: 0, adminPresent: false, adminPublishingMic: false, adminPublishingAny: false, toneBotPublishing: false, duplicateAdmins: 0, roomMissing: notFound };
      if (!notFound) log('livekit.serverTruthError', { message: e.message });
      return this.state.server;
    }
  }

  // Is anything the listener should hear arriving as sound right now?
  hearing() {
    const now = Date.now();
    const out = { admin: false, tone: false, any: false, keys: {} };
    for (const [key, a] of Object.entries(this.state.audio)) {
      const fresh = a.lastSoundAt && now - a.lastSoundAt <= config.deadlineSeconds * 1000;
      out.keys[key] = { dbfs: Number.isFinite(a.dbfs) ? Math.round(a.dbfs) : null, frames: a.frames, sound: !!fresh, lastFrameAgoMs: a.lastFrameAt ? now - a.lastFrameAt : null };
      if (fresh && isAdminKey(key)) out.admin = true;
      if (fresh && key.startsWith(TONE_BOT + '/')) out.tone = true;
    }
    out.any = out.admin || out.tone;
    return out;
  }

  async stop() {
    for (const s of this._streams.values()) s.stop();
    this._streams.clear();
    try { await this.room?.disconnect(); } catch { /* already gone */ }
  }
}

const isAdminKey = (key) => isAdminIdentity(key.split('/')[0]);

function trackKey(p, pub) {
  return `${p.identity}/${pub.name || (pub.source === MIC ? 'microphone' : 'src' + pub.source)}`;
}

function rmsDbfs(int16) {
  if (!int16?.length) return -Infinity;
  let sum = 0;
  for (let i = 0; i < int16.length; i++) { const v = int16[i] / 32768; sum += v * v; }
  const rms = Math.sqrt(sum / int16.length);
  return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
}

export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  } catch { return null; }
}
