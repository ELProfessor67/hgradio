// Backend relay check in a scratch room (never the station): owner-join -> listener gets room-active;
// next-song -> listener gets next-song with the right title; owner disconnect -> room-unactive.
import { io } from 'socket.io-client';
const URL = process.env.SOCKET_URL || 'https://backend.hgdjlive.com';
const room = 'relaytest-' + Date.now();
const t0 = Date.now(); const ts = () => ((Date.now() - t0) / 1000).toFixed(2) + 's';
const seen = [];
const listener = io(URL, { transports: ['websocket'] });
const owner = io(URL, { transports: ['websocket'] });
listener.onAny((ev, d) => { seen.push(ev); console.log(ts(), 'listener <-', ev, JSON.stringify(d).slice(0, 160)); });
listener.on('connect', () => listener.emit('user-join', { roomId: room }, () => {}));
setTimeout(() => owner.emit('owner-join', { user: { _id: room, name: 'Relay DJ' } }), 2000);
setTimeout(() => owner.emit('next-song', { roomId: room, currentSong: { _id: 'x1', title: 'Song One.mp3', artist: 'A', cover: '/upload/cover/default.jpg', audio: '/upload/songs/x1.mp3' }, nextSong: { title: 'Song Two.mp3' } }), 4000);
setTimeout(() => owner.emit('next-song', { roomId: room, currentSong: { _id: 'x2', title: 'Song Two.mp3', artist: 'A', cover: '/upload/cover/default.jpg', audio: '/upload/songs/x2.mp3' }, nextSong: { title: 'Song Three.mp3' } }), 6000);
setTimeout(() => owner.close(), 8000);
setTimeout(() => {
  const ok = seen.includes('room-active') || seen.includes('room-active-now');
  const songs = seen.filter((e) => e === 'next-song').length;
  console.log('RESULT', { liveSeen: ok, nextSongEvents: songs, unactiveAfterOwnerLeft: seen.includes('room-unactive') });
  listener.close(); process.exit(0);
}, 11000);
