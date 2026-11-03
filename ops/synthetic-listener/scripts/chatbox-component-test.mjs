// Headless test of the panel ChatBox/Message components via the temporary /__chat-test page.
import { createRequire } from 'node:module';
const require = createRequire(process.env.PW_DIR + '/package.json');
const { chromium } = require('playwright-core');
const URL = process.env.URL || 'http://localhost:3003/__chat-test';
const results = {};
const pass = (k, n = '') => (results[k] = 'PASS ' + n);
const fail = (k, n) => (results[k] = 'FAIL ' + n);

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 760 } })).newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 });

await page.click('#open');
const dialog = page.locator('[role="dialog"][aria-label="Live chat"]');
(await dialog.count()) === 1 ? pass('open') : fail('open', 'no dialog');
(await page.locator('text=No messages yet').count()) ? pass('emptyState') : fail('emptyState', 'missing');
await page.waitForTimeout(200);
(await page.evaluate(() => document.activeElement?.id)) === 'chat-message' ? pass('inputFocused') : fail('inputFocused', String(await page.evaluate(() => document.activeElement?.id)));

// Send button disabled on empty/whitespace, enabled on text; Enter sends; input clears
(await page.isDisabled('[role="dialog"] button:has-text("Send")')) ? pass('sendDisabledEmpty') : fail('sendDisabledEmpty', 'enabled');
await page.fill('#chat-message', '   ');
(await page.isDisabled('[role="dialog"] button:has-text("Send")')) ? pass('sendDisabledWhitespace') : fail('sendDisabledWhitespace', 'enabled');
await page.fill('#chat-message', 'hello from DJ');
(await page.isEnabled('[role="dialog"] button:has-text("Send")')) ? pass('sendEnabledText') : fail('sendEnabledText', 'disabled');
await page.press('#chat-message', 'Enter');
await page.waitForTimeout(200);
(await page.locator('text=hello from DJ').count()) ? pass('ownMessageRendered') : fail('ownMessageRendered', 'not rendered');
(await page.inputValue('#chat-message')) === '' ? pass('inputCleared') : fail('inputCleared', 'not cleared');
const ownRight = await page.evaluate(() => { const el = [...document.querySelectorAll('[role="dialog"] p')].find((p) => p.textContent === 'hello from DJ'); return el?.closest('.flex')?.className.includes('justify-end'); });
ownRight ? pass('ownMessageRightAligned') : fail('ownMessageRightAligned', 'not right-aligned');

// Incoming renders left-aligned with name + time
await page.evaluate(() => document.querySelector('#incoming1').click());
await page.waitForTimeout(200);
const inLeft = await page.evaluate(() => { const el = [...document.querySelectorAll('[role="dialog"] p')].find((p) => p.textContent === 'bulk message 1'); return el?.closest('.flex')?.className.includes('justify-start') && !!el?.parentElement?.textContent.match(/Listener Bot/) && /\d{1,2}:\d{2}/.test(el?.parentElement?.textContent || ''); });
inLeft ? pass('incomingLeftWithNameTime') : fail('incomingLeftWithNameTime', 'layout/name/time missing');

// Auto-scroll with many messages
await page.evaluate(() => document.querySelector('#incoming25').click());
await page.waitForTimeout(500);
const sc = await page.evaluate(() => { const el = document.querySelector('[role="dialog"] .overflow-y-auto'); return { atBottom: el.scrollHeight - el.scrollTop - el.clientHeight < 40, sh: el.scrollHeight, ch: el.clientHeight }; });
sc.sh > sc.ch && sc.atBottom ? pass('autoScrollToBottom', JSON.stringify(sc)) : fail('autoScrollToBottom', JSON.stringify(sc));

// Reading older messages: scroll up, new message must NOT yank to bottom
await page.evaluate(() => { const el = document.querySelector('[role="dialog"] .overflow-y-auto'); el.scrollTop = 0; el.dispatchEvent(new Event('scroll')); });
await page.evaluate(() => document.querySelector('#incoming1').click());
await page.waitForTimeout(300);
const stay = await page.evaluate(() => document.querySelector('[role="dialog"] .overflow-y-auto').scrollTop < 60);
stay ? pass('keepsPositionWhileReading') : fail('keepsPositionWhileReading', 'jumped');

await page.screenshot({ path: process.env.SHOT || 'chatbox.png' });

// Escape closes; reopen scrolls to bottom
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
(await dialog.count()) === 0 ? pass('escapeCloses') : fail('escapeCloses', 'open');
await page.click('#open');
await page.waitForTimeout(300);
const reopened = await page.evaluate(() => { const el = document.querySelector('[role="dialog"] .overflow-y-auto'); return el.scrollHeight - el.scrollTop - el.clientHeight < 40; });
reopened ? pass('reopenAtBottom') : fail('reopenAtBottom', 'not at bottom');

// Phone width
await page.setViewportSize({ width: 390, height: 780 });
await page.waitForTimeout(300);
const fits = await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const r = d.getBoundingClientRect(); return r.width <= 390 && r.height <= 780 && r.right <= 391; });
fits ? pass('fitsPhoneWidth') : fail('fitsPhoneWidth', 'overflows');
await page.screenshot({ path: (process.env.SHOT || 'chatbox.png').replace('.png', '-phone.png') });

const relevant = errs.filter((e) => !/favicon|Download the React DevTools|hydrat|501 (Not Implemented)/i.test(e));
relevant.length === 0 ? pass('noConsoleErrors') : fail('noConsoleErrors', relevant.slice(0, 3).join(' | '));
console.log(JSON.stringify(results, null, 2));
await browser.close();
process.exit(Object.values(results).some((v) => v.startsWith('FAIL')) ? 1 : 0);
