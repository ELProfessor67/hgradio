import { io } from 'socket.io-client';
const t0 = Date.now();
const ts = () => ((Date.now() - t0) / 1000).toFixed(2) + 's';
const s = io('https://backend.hgdjlive.com', { transports: ['websocket', 'polling'], timeout: 10000 });
s.io.engine?.on?.('upgrade', () => console.log(ts(), 'transport upgraded'));
s.on('connect', () => {
  console.log(ts(), 'connected transport=', s.io.engine.transport.name);
  s.emit('user-join', { roomId: '655347b59c00a7409d9181c3' }, (cb) => console.log(ts(), 'user-join ack activeDJName=', JSON.stringify(cb)));
});
s.onAny((ev, ...args) => {
  const a = JSON.stringify(args).slice(0, 400);
  console.log(ts(), 'event', ev, a);
});
s.on('connect_error', (e) => console.log(ts(), 'connect_error', e.message));
setTimeout(() => { s.emit('auto-dj', { roomId: '655347b59c00a7409d9181c3' }); }, 3000);
setTimeout(() => { s.close(); process.exit(0); }, 9000);
