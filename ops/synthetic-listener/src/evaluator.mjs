import { config } from './config.mjs';
import { log } from './log.mjs';

// The assertion, in one place.
//
// Inputs are three independent views of "is the station live":
//   S  socket backend says live (room-active)            -> what the site/app UI believes
//   L  LiveKit has 'admin' publishing an unmuted mic      -> what can actually be heard live
//   A  this probe is receiving non-silent PCM from admin  -> what a listener HEARS
//   T  tone bot publishing / tone heard
//   I  Icecast mount up and bytes flowing                 -> Auto DJ audio
//
// Expected listener experience:
//   L or T        -> A (or tone heard) within deadline            else LIVE_BUT_SILENT
//   S and not L   -> site muted Auto DJ, nothing to hear          DEAD_AIR_SOCKET_LIVE_NO_PUBLISHER
//   L and not S   -> site still playing Auto DJ over the DJ       DJ_PUBLISHING_SITE_ON_AUTODJ
//   not S, not L  -> Icecast must flow                            else AUTODJ_DOWN
// Every condition must hold continuously for `deadlineSeconds` before it is
// raised, so a legitimate transition never alerts.

export const CONDITIONS = {
  SOCKET_BACKEND_DOWN:               { sev: 'red',   what: 'Socket backend unreachable: site/app get no live or song events' },
  LIVEKIT_UNREACHABLE:               { sev: 'red',   what: 'Probe cannot join the LiveKit station room: no listener can hear a live DJ' },
  TOKEN_ROUTE_BROKEN:                { sev: 'red',   what: 'Panel token route failing or issuing the wrong room: listeners join nothing' },
  DEAD_AIR_SOCKET_LIVE_NO_PUBLISHER: { sev: 'red',   what: 'Backend says DJ live but LiveKit has no admin session at all: listeners hear silence' },
  LIVE_BUT_SILENT:                   { sev: 'amber', what: 'Admin mic is open but only silence has arrived for 20 s', graceSeconds: 20 },
  LIVE_MUTED:                        { sev: 'amber', what: 'Backend says live; the admin session is present but every track is muted for 60 s', graceSeconds: 60 },
  DJ_PUBLISHING_SITE_ON_AUTODJ:      { sev: 'red',   what: 'DJ is publishing to LiveKit but backend never said live: site keeps Auto DJ' },
  AUTODJ_DOWN:                       { sev: 'red',   what: 'Nobody live and the Icecast mount is down or not streaming' },
  WEBSITE_DOWN:                      { sev: 'red',   what: 'hgcradio.org not returning 200' },
  PANEL_DOWN:                        { sev: 'red',   what: 'hgdjlive.com not returning 200' },
  DUPLICATE_ADMIN:                   { sev: 'amber', what: 'More than one admin participant in the station room (Go Live from two places)' },
  AUTODJ_METADATA_STALE:             { sev: 'amber', what: 'Song shown to listeners ended long ago: title/artist are wrong' },
  ICECAST_SILENT:                    { sev: 'amber', what: 'Icecast bytes flow but decode to silence' },
  SCHEDULED_SHOW_NO_DJ:              { sev: 'info',  what: 'A show is scheduled now and no DJ has gone live' },
  SOCKET_ON_POLLING:                 { sev: 'info',  what: 'socket.io fell back to long-polling (WebSocket upgrade failing at nginx?)' },
};

export class Evaluator {
  constructor() {
    this.open = {};        // key -> { since, raisedAt|null, detail }
    this.transitions = []; // last 200 state changes with outcome
    this.lastSnapshot = null;
    this.lastStateKey = null;
    this.lastStateChangeAt = Date.now();
    this.ttc = [];         // time-to-correct-audio samples (s)
    this.pendingTransition = null;
  }

  // Called every second with the current raw states.
  evaluate({ socket, livekit, icecast, schedule, http }) {
    const now = Date.now();
    const hear = livekit.hearing();
    const srv = livekit.state.server;
    const S = socket.state.connected && socket.state.live;
    const Lclient = livekit.state.connected && livekit.state.adminMicPublished;
    // Prefer server truth when available; the client view confirms subscription.
    const L = srv && !srv.error ? srv.adminPublishingMic : Lclient;
    const Lany = srv && !srv.error ? srv.adminPublishingAny : (Lclient || livekit.state.adminSongPublished);
    // An admin SESSION exists (tracks may be muted). A muted DJ is not dead air;
    // a kicked/dead session has no participant at all.
    const adminSession = srv && !srv.error ? srv.adminPresent : livekit.state.adminPresent;
    const T = (srv && !srv.error ? srv.toneBotPublishing : livekit.state.toneBotPublishing) || socket.state.toneActive;
    const A = hear.admin;
    const I = icecast.state.status.mountUp === true && icecast.state.stream.ok !== false;
    const sched = schedule.current();

    const snapshot = {
      ts: new Date(now).toISOString(),
      S, L, Lany, T, A, I,
      toneHeard: hear.tone,
      socket: { connected: socket.state.connected, transport: socket.state.transport, live: socket.state.live, owner: socket.state.owner?.name ?? null, song: socket.state.currentSong?.title ?? null, songStartedAt: socket.state.songStartedAt, reconnects: socket.state.reconnects, lastEvent: socket.state.lastEvent },
      livekit: { connected: livekit.state.connected, participants: livekit.state.participants, adminPresent: livekit.state.adminPresent, adminMic: livekit.state.adminMicPublished, adminSong: livekit.state.adminSongPublished, toneBot: livekit.state.toneBotPublishing, audio: hear.keys, tokenRoute: livekit.state.tokenRoute, server: srv ? { participants: srv.numParticipants, publishers: srv.numPublishers, adminPresent: srv.adminPresent, adminMic: srv.adminPublishingMic, duplicateAdmins: srv.duplicateAdmins, error: srv.error } : null, reconnects: livekit.state.reconnects, lastError: livekit.state.lastError },
      icecast: { mountUp: icecast.state.status.mountUp, listeners: icecast.state.status.listeners, title: icecast.state.status.title, kbps: icecast.state.stream.kbps, streamOk: icecast.state.stream.ok, meanVolumeDb: icecast.state.stream.meanVolumeDb, streamStart: icecast.state.status.streamStart },
      http,
      schedule: sched.current ? { name: sched.current.name, start: sched.current.start.toISOString(), end: sched.current.end.toISOString() } : null,
      nextShow: sched.next ? { name: sched.next.name, start: sched.next.start.toISOString() } : null,
    };

    // ---- state-change bookkeeping: "within 10 s of any state change" ----
    const stateKey = `${S ? 'S' : '-'}${L ? 'L' : '-'}${T ? 'T' : '-'}`;
    if (stateKey !== this.lastStateKey) {
      if (this.lastStateKey !== null) {
        log('state.change', { from: this.lastStateKey, to: stateKey, owner: snapshot.socket.owner });
        this.pendingTransition = { from: this.lastStateKey, to: stateKey, at: now };
      }
      this.lastStateKey = stateKey;
      this.lastStateChangeAt = now;
    }
    const correctAudioNow = this._correctAudio({ S, L, T, A, I, toneHeard: hear.tone });
    if (this.pendingTransition && correctAudioNow) {
      const ttc = (now - this.pendingTransition.at) / 1000;
      this.ttc.push(ttc);
      if (this.ttc.length > 500) this.ttc.shift();
      this._recordTransition({ ...this.pendingTransition, ttc, ok: ttc <= config.deadlineSeconds });
      this.pendingTransition = null;
    } else if (this.pendingTransition && now - this.pendingTransition.at > config.deadlineSeconds * 1000 && !this.pendingTransition.lateLogged) {
      this.pendingTransition.lateLogged = true;
      log('state.transition.late', { ...this.pendingTransition, deadline: config.deadlineSeconds });
    }

    // ---- conditions ----
    const want = {};
    want.SOCKET_BACKEND_DOWN = !socket.state.connected;
    want.TOKEN_ROUTE_BROKEN = livekit.state.tokenRoute.ok === false;
    want.LIVEKIT_UNREACHABLE = !livekit.state.connected && !!livekit.state.lastError;
    want.DEAD_AIR_SOCKET_LIVE_NO_PUBLISHER = S && !adminSession && !T;
    want.LIVE_MUTED = S && adminSession && !Lany && !T;
    want.LIVE_BUT_SILENT = L && livekit.state.connected && livekit.state.adminMicPublished && !A && !hear.tone && !livekit.state.adminSongPublished;
    want.DJ_PUBLISHING_SITE_ON_AUTODJ = Lany && socket.state.connected && !S && !T;
    want.AUTODJ_DOWN = !S && !Lany && !T && !I;
    want.WEBSITE_DOWN = http?.website?.ok === false;
    want.PANEL_DOWN = http?.panel?.ok === false;
    want.DUPLICATE_ADMIN = (srv?.duplicateAdmins ?? 0) > 1;
    want.ICECAST_SILENT = icecast.state.stream.meanVolumeDb !== null && icecast.state.stream.meanVolumeDb !== undefined && icecast.state.stream.meanVolumeDb < config.silenceDbfs && !S && !Lany;
    want.SOCKET_ON_POLLING = socket.state.connected && socket.state.transport === 'polling' && now - (socket.state.connectedAt || 0) > 30000;
    // Auto DJ metadata: song should have ended by startedAt + duration (+ grace).
    const song = socket.state.currentSong;
    want.AUTODJ_METADATA_STALE = !S && !!song?.duration && !!socket.state.songStartedAt && now > socket.state.songStartedAt + song.duration * 1000 + config.metadataStaleGraceSeconds * 1000;
    want.SCHEDULED_SHOW_NO_DJ = !!sched.current && !L && !T && (now - sched.current.start.getTime()) > config.scheduledNoDjMinutes * 60000;

    const events = [];
    for (const [key, active] of Object.entries(want)) {
      const grace = (CONDITIONS[key].graceSeconds ?? (CONDITIONS[key].sev === 'info' ? 0 : config.deadlineSeconds)) * 1000;
      const cur = this.open[key];
      if (active) {
        if (!cur) this.open[key] = { since: now, raisedAt: null, detail: this._detail(key, snapshot) };
        const o = this.open[key];
        if (!o.raisedAt && now - o.since >= grace) {
          o.raisedAt = now;
          o.detail = this._detail(key, snapshot);
          events.push({ type: 'open', key, sev: CONDITIONS[key].sev, what: CONDITIONS[key].what, detail: o.detail, since: new Date(o.since).toISOString() });
          log('condition.open', { key, sev: CONDITIONS[key].sev, detail: o.detail });
        }
      } else if (cur) {
        delete this.open[key];
        if (cur.raisedAt) {
          const dur = Math.round((now - cur.since) / 1000);
          events.push({ type: 'resolve', key, sev: CONDITIONS[key].sev, what: CONDITIONS[key].what, durationSeconds: dur, detail: cur.detail });
          log('condition.resolve', { key, durationSeconds: dur });
        }
      }
    }

    const redOpen = Object.entries(this.open).filter(([k, o]) => o.raisedAt && CONDITIONS[k].sev === 'red').map(([k]) => k);
    const amberOpen = Object.entries(this.open).filter(([k, o]) => o.raisedAt && CONDITIONS[k].sev === 'amber').map(([k]) => k);
    snapshot.green = redOpen.length === 0;
    snapshot.red = redOpen;
    snapshot.amber = amberOpen;
    snapshot.mode = S || L ? 'LIVE' : T ? 'TONE' : 'AUTODJ';
    snapshot.correctAudio = correctAudioNow;
    snapshot.sinceStateChangeSeconds = Math.round((now - this.lastStateChangeAt) / 1000);
    this.lastSnapshot = snapshot;
    return { snapshot, events };
  }

  _correctAudio({ S, L, T, A, I, toneHeard }) {
    if (L) return A;                 // live: must hear the DJ
    if (T) return toneHeard || I;    // tone: tone track audible (or Auto DJ still carrying)
    if (S) return false;             // backend says live but nobody publishes
    return I;                        // Auto DJ: Icecast flowing
  }

  _detail(key, s) {
    switch (key) {
      case 'DEAD_AIR_SOCKET_LIVE_NO_PUBLISHER': return `socket owner=${s.socket.owner} since ${s.socket.live}; LiveKit participants=${JSON.stringify(s.livekit.participants)} server=${JSON.stringify(s.livekit.server)}`;
      case 'LIVE_BUT_SILENT': return `audio=${JSON.stringify(s.livekit.audio)}`;
      case 'DJ_PUBLISHING_SITE_ON_AUTODJ': return `LiveKit server=${JSON.stringify(s.livekit.server)}; socket live=${s.socket.live} lastEvent=${s.socket.lastEvent}`;
      case 'AUTODJ_DOWN': return `icecast=${JSON.stringify(s.icecast)}`;
      case 'TOKEN_ROUTE_BROKEN': return JSON.stringify(s.livekit.tokenRoute);
      case 'LIVEKIT_UNREACHABLE': return `lastError=${s.livekit.lastError}`;
      case 'SOCKET_BACKEND_DOWN': return `transport=${s.socket.transport} reconnects=${s.socket.reconnects}`;
      case 'AUTODJ_METADATA_STALE': return `song=${s.socket.song} startedAt=${s.socket.songStartedAt ? new Date(s.socket.songStartedAt).toISOString() : null}`;
      case 'SCHEDULED_SHOW_NO_DJ': return `show=${JSON.stringify(s.schedule)}`;
      case 'DUPLICATE_ADMIN': return `server=${JSON.stringify(s.livekit.server)}`;
      default: return JSON.stringify({ http: s.http, icecast: s.icecast });
    }
  }

  _recordTransition(t) {
    this.transitions.push({ ...t, atIso: new Date(t.at).toISOString() });
    if (this.transitions.length > 200) this.transitions.shift();
    log('state.transition', { from: t.from, to: t.to, ttcSeconds: Number(t.ttc.toFixed(1)), ok: t.ok });
  }

  // For the scorecard: p50/p95 time-to-correct-audio over the retained window.
  ttcStats() {
    if (!this.ttc.length) return { n: 0 };
    const s = [...this.ttc].sort((a, b) => a - b);
    const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
    return { n: s.length, p50: q(0.5), p95: q(0.95), max: s[s.length - 1], late: s.filter((x) => x > config.deadlineSeconds).length };
  }
}
