// Headless UI test of the panel ChatBox against the real backend in a scratch room.
//   PANEL_URL=http://localhost:3002 node scripts/panel-chat-ui-test.mjs
// Needs playwright-core + Chrome (see PW_DIR / CHROME env).
import { createRequire } from 'node:module';
import { io } from 'socket.io-client';
const require = createRequire(process.env.PW_DIR ? process.env.PW_DIR + '/package.json' : import.meta.url);
const { chromium } = require('playwright-core');

const PANEL = process.env.PANEL_URL || 'http://localhost:3002';
const SOCKET = process.env.SOCKET_URL || 'https://backend.hgdjlive.com';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const room = 'pwtest-' + Date.now();
const results = {};
const fail = (k, why) => { results[k] = 'FAIL ' + why; };
const pass = (k, note = '') => { results[k] = 'PASS ' + note; };

const bot = io(SOCKET, { transports: ['websocket'] });
const received = [];
bot.on('receive-message', (d) => received.push(d));
await new Promise((r) => bot.on('connect', () => { bot.emit('user-join', { roomId: room }, () => {}); r(); }));

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ permissions: ['microphone'], viewport: { width: 1200, height: 800 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message));

await page.goto(`${PANEL}/call/${room}`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3000);

// Chat is only enabled while a DJ is live; this is a scratch room, so enable it to test the box itself.
const opened = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Chat');
  if (!btn) return false;
  btn.disabled = false;
  btn.click();
  return true;
});
if (!opened) fail('open', 'no Chat button in DOM');
await page.waitForTimeout(500);
const dialog = page.locator('[role="dialog"][aria-label="Live chat"]');
(await dialog.count()) ? pass('open') : fail('open', 'dialog not rendered');

// Empty state
const emptyText = await page.locator('text=No messages yet').count();
emptyText ? pass('emptyState') : fail('emptyState', 'no empty-state text');

// Send via Enter
await page.fill('#chat-name', 'PW Tester');
await page.fill('#chat-message', 'hello from playwright');
await page.press('#chat-message', 'Enter');
await page.waitForTimeout(1500);
const got = received.find((m) => m.message === 'hello from playwright');
got ? pass('sendReachesBackend', `name=${got.name}`) : fail('sendReachesBackend', `received=${JSON.stringify(received).slice(0, 200)}`);
const inputCleared = (await page.inputValue('#chat-message')) === '';
inputCleared ? pass('inputCleared') : fail('inputCleared', 'input still has text');
const ownEcho = await page.locator('text=hello from playwright').count();
ownEcho ? pass('ownMessageRendered') : fail('ownMessageRendered', 'own message not in list');

// Incoming from another listener renders
bot.emit('send-message', { message: 'reply from listener bot', roomId: room, name: 'Listener Bot', isOwner: false });
await page.waitForTimeout(1500);
(await page.locator('text=reply from listener bot').count()) ? pass('incomingRendered') : fail('incomingRendered', 'not rendered');

// Many messages: list must stay scrolled to the bottom (the old react-scroll-to-bottom broke here)
for (let i = 0; i < 25; i++) bot.emit('send-message', { message: `bulk message ${i}`, roomId: room, name: 'Bulk', isOwner: false });
await page.waitForTimeout(2500);
const scroll = await page.evaluate(() => {
  const el = document.querySelector('[role="dialog"][aria-label="Live chat"] .overflow-y-auto');
  return el ? { atBottom: el.scrollHeight - el.scrollTop - el.clientHeight < 40, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight } : null;
});
scroll && scroll.scrollHeight > scroll.clientHeight && scroll.atBottom ? pass('autoScroll', JSON.stringify(scroll)) : fail('autoScroll', JSON.stringify(scroll));

await page.screenshot({ path: process.env.SHOT || 'chat-ui.png' });

// Escape closes
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
(await dialog.count()) === 0 ? pass('escapeCloses') : fail('escapeCloses', 'still open');

const relevantErrors = consoleErrors.filter((e) => !/favicon|ERR_BLOCKED|hydrat|Download the React DevTools|AudioContext/i.test(e));
relevantErrors.length === 0 ? pass('noConsoleErrors') : fail('noConsoleErrors', relevantErrors.slice(0, 3).join(' | ').slice(0, 400));

console.log(JSON.stringify({ room, results }, null, 2));
await browser.close();
bot.close();
process.exit(Object.values(results).some((v) => v.startsWith('FAIL')) ? 1 : 0);
