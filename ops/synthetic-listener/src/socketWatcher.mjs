import { io } from 'socket.io-client';
import { EventEmitter } from 'node:events';
import { config } from './config.mjs';
import { log } from './log.mjs';

// Mirrors exactly what hgradio/client/src/hooks/useSocketUser.js does:
// connect, emit user-join on EVERY connect, treat room-active as "DJ live",
// room-unactive as Auto DJ (then ask for the current song with auto-dj).
export class SocketWatcher extends EventEmitter {
  constructor() {
    super();
    this.state = {
      connected: false,
      transport: null,
      connectedAt: null,
      disconnectedAt: null,
      lastDisconnectReason: null,
      reconnects: 0,
      live: false,          // room-active with an owner
      liveSince: null,
      owner: null,          // { name, _id } only; never keep the full record
      scheduleActive: false,
      currentSong: null,    // { title, artist, _id, duration }
      songStartedAt: null,  // currentSong.currentTime from the backend (ms epoch)
      lastSongChangeAt: null,
      lastEventAt: null,
      lastEvent: null,
      toneActive: false,
      events: 0,
    };
  }

  start() {
    const s = io(config.socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    this.socket = s;

    s.on('connect', () => {
      const first = this.state.connectedAt === null;
      this.state.connected = true;
      this.state.connectedAt = Date.now();
      this.state.transport = s.io.engine?.transport?.name || null;
      if (!first) this.state.reconnects += 1;
      s.io.engine?.on('upgrade', () => { this.state.transport = s.io.engine.transport.name; });
      s.emit('user-join', { roomId: config.stationId }, (activeDJName) => {
        this._touch('user-join:ack', { activeDJName });
      });
      log('socket.connect', { transport: this.state.transport, reconnect: !first });
      this.emit('change', 'socket.connect');
    });

    s.on('disconnect', (reason) => {
      this.state.connected = false;
      this.state.disconnectedAt = Date.now();
      this.state.lastDisconnectReason = reason;
      log('socket.disconnect', { reason });
      this.emit('change', 'socket.disconnect');
    });
    s.on('connect_error', (e) => log('socket.connect_error', { message: e.message }));

    s.on('room-active', (d) => this._setLive(true, d, 'room-active'));
    s.on('room-active-now', (d) => this._setLive(true, d, 'room-active-now'));
    s.on('room-unactive', (d) => {
      this._setLive(false, d, 'room-unactive');
      this.state.scheduleActive = !!d?.butScheduleActive;
      // Like the clients: ask the backend what Auto DJ is playing now.
      s.emit('auto-dj', { roomId: config.stationId });
    });
    s.on('owner-left', () => this._setLive(false, {}, 'owner-left'));
    s.on('schedule-active', () => { this.state.scheduleActive = true; this._touch('schedule-active'); });
    s.on('schedule-unactive', () => { this.state.scheduleActive = false; this._touch('schedule-unactive'); });
    s.on('song-change', (d) => {
      const cs = d?.currentSong;
      this.state.currentSong = pickSong(cs?.currentSong);
      this.state.songStartedAt = typeof cs?.currentTime === 'number' ? cs.currentTime : null;
      this.state.lastSongChangeAt = Date.now();
      this._touch('song-change', { title: this.state.currentSong?.title, startedAt: this.state.songStartedAt });
    });
    s.on('next-song', (d) => {
      this.state.currentSong = pickSong(d?.currentSong);
      this.state.lastSongChangeAt = Date.now();
      this._touch('next-song', { title: this.state.currentSong?.title });
    });
    s.on('play-welcome-tone', () => { this.state.toneActive = true; this._touch('play-welcome-tone'); });
    s.on('welcome-tone-played', () => { this.state.toneActive = false; this._touch('welcome-tone-played'); });
    s.on('play-ending-tone', () => { this.state.toneActive = true; this._touch('play-ending-tone'); });
    s.on('ending-tone-played', () => { this.state.toneActive = false; this._touch('ending-tone-played'); });
    s.on('receive-message', () => this._touch('receive-message'));
  }

  _setLive(live, d, ev) {
    const was = this.state.live;
    this.state.live = live;
    if (live) {
      this.state.owner = d?.user ? { name: d.user.name, _id: d.user._id } : this.state.owner;
      if (!was) this.state.liveSince = Date.now();
      if (d?.currentSong) this.state.currentSong = pickSong(d.currentSong);
    } else {
      this.state.owner = null;
      this.state.liveSince = null;
    }
    this._touch(ev, { live, owner: this.state.owner?.name });
    if (was !== live) this.emit('change', ev);
  }

  _touch(ev, extra = {}) {
    this.state.lastEventAt = Date.now();
    this.state.lastEvent = ev;
    this.state.events += 1;
    log('socket.event', { event: ev, ...extra });
  }

  // Ask the backend to re-send state; used by --once mode and after reconnects.
  rejoin() { this.socket?.emit('user-join', { roomId: config.stationId }, () => {}); }

  stop() { this.socket?.close(); }
}

function pickSong(s) {
  if (!s) return null;
  return { _id: s._id, title: s.title, artist: s.artist, duration: s.duration };
}
