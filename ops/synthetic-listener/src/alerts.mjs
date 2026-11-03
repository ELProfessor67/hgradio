import { config } from './config.mjs';
import { log } from './log.mjs';

// Fan-out to whatever is configured. Each OPEN is sent once, reminded every
// ALERT_REMIND_MINUTES while it stays open, and followed by a RESOLVED.
export class Alerter {
  constructor() {
    this.lastReminder = {};
  }

  async handle(events, snapshot) {
    for (const ev of events) {
      const text = format(ev, snapshot);
      await this.send(text, ev.sev, ev.type);
      if (ev.type === 'open') this.lastReminder[ev.key] = Date.now();
      if (ev.type === 'resolve') delete this.lastReminder[ev.key];
    }
  }

  async remind(evaluator, snapshot) {
    const now = Date.now();
    for (const [key, o] of Object.entries(evaluator.open)) {
      if (!o.raisedAt) continue;
      const last = this.lastReminder[key] || o.raisedAt;
      if (now - last >= config.alerts.remindMinutes * 60000) {
        this.lastReminder[key] = now;
        const { CONDITIONS } = await import('./evaluator.mjs');
        await this.send(format({ type: 'remind', key, sev: CONDITIONS[key].sev, what: CONDITIONS[key].what, detail: o.detail, since: new Date(o.since).toISOString() }, snapshot), CONDITIONS[key].sev, 'remind');
      }
    }
  }

  // Uptime Kuma "push" monitor: up while green, down while any red is open.
  async pushHeartbeat(snapshot) {
    const u = config.alerts.uptimeKumaPush;
    if (!u) return;
    const status = snapshot.green ? 'up' : 'down';
    const msg = snapshot.green ? `${snapshot.mode} ok` : snapshot.red.join(',');
    const url = `${u}${u.includes('?') ? '&' : '?'}status=${status}&msg=${encodeURIComponent(msg)}&ping=`;
    await fetch(url, { signal: AbortSignal.timeout(8000) }).catch((e) => log('alert.kumaError', { message: e.message }));
  }

  async send(text, sev, type) {
    const a = config.alerts;
    const jobs = [];
    if (a.telegramToken && a.telegramChatId) {
      jobs.push(fetch(`https://api.telegram.org/bot${a.telegramToken}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: a.telegramChatId, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(8000),
      }));
    }
    if (a.discordWebhook) jobs.push(fetch(a.discordWebhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: text.slice(0, 1900) }), signal: AbortSignal.timeout(8000) }));
    if (a.slackWebhook) jobs.push(fetch(a.slackWebhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }), signal: AbortSignal.timeout(8000) }));
    if (a.genericWebhook) jobs.push(fetch(a.genericWebhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sev, type, text, probe: config.probeId, ts: new Date().toISOString() }), signal: AbortSignal.timeout(8000) }));
    if (!jobs.length) { log('alert.unsent', { reason: 'no channel configured', text }); return; }
    const results = await Promise.allSettled(jobs);
    results.forEach((r, i) => { if (r.status === 'rejected') log('alert.sendError', { channel: i, message: r.reason?.message }); });
    log('alert.sent', { sev, type, channels: jobs.length });
  }
}

const ICON = { red: '🔴', amber: '🟠', info: 'ℹ️' };

function format(ev, s) {
  const head = ev.type === 'open' ? `${ICON[ev.sev]} ${ev.key}` : ev.type === 'resolve' ? `✅ RESOLVED ${ev.key}` : `${ICON[ev.sev]} STILL OPEN ${ev.key}`;
  const lines = [
    `${head} — ${config.probeId}`,
    ev.what,
    ev.type === 'resolve' ? `Lasted ${ev.durationSeconds}s.` : `Since ${ev.since} UTC.`,
    `Now: mode=${s.mode} socketLive=${s.S} livekitAdminMic=${s.L} hearingDJ=${s.A} icecast=${s.I}${s.schedule ? ` scheduled=${s.schedule.name}` : ''}`,
    `Owner=${s.socket.owner ?? '-'} song=${s.socket.song ?? '-'} listeners(icecast)=${s.icecast.listeners ?? '-'} livekitParticipants=${s.livekit.server?.participants ?? s.livekit.participants.length}`,
  ];
  if (ev.detail) lines.push(`Detail: ${String(ev.detail).slice(0, 600)}`);
  lines.push(`Runbook: ops/runbook/runbook.md → ${runbookHint(ev.key)}`);
  return lines.join('\n');
}

function runbookHint(key) {
  if (/SOCKET|DEAD_AIR|METADATA|AUTODJ_DOWN/.test(key)) return 'check 2 (backend)';
  if (/LIVEKIT|TOKEN|SILENT|DUPLICATE|PUBLISHING/.test(key)) return 'check 3 (LiveKit)';
  if (/WEBSITE/.test(key)) return 'check 1 (website)';
  if (/PANEL/.test(key)) return 'check 1 (panel)';
  return 'check 1';
}
