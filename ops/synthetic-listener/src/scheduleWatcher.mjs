import { config } from './config.mjs';
import { log } from './log.mjs';

// Reads the panel's public schedule feed (same one the website shows) so the
// probe knows whether a DJ is SUPPOSED to be live. A quiet station during a
// slot is a different alert ("DJ did not go live") from a platform failure.
//
// Feed entry: { name, startTime:"HH:mm", endTime:"HH:mm", timezone, days:[...] }
// Times are wall-clock in `timezone` on each listed weekday.
export class ScheduleWatcher {
  constructor() {
    this.entries = [];
    this.fetchedAt = null;
    this.error = null;
  }

  async refresh() {
    try {
      const res = await fetch(`${config.panelUrl}/api/v1/schedule-public`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const seen = new Set();
      const out = [];
      for (const list of Object.values(j)) {
        for (const e of list || []) {
          const key = `${e.name}|${e.startTime}|${e.endTime}|${e.timezone}|${(e.days || []).join(',')}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(e);
        }
      }
      this.entries = out;
      this.fetchedAt = Date.now();
      this.error = null;
      log('schedule.refresh', { entries: out.length });
    } catch (e) {
      this.error = e.message;
      log('schedule.error', { message: e.message });
    }
  }

  // Current slot (if any) and the next one, both as UTC instants.
  current(now = new Date()) {
    let cur = null;
    let next = null;
    for (const e of this.entries) {
      for (const dayOffset of [-1, 0, 1]) {
        const slot = slotInstant(e, now, dayOffset);
        if (!slot) continue;
        if (slot.start <= now && now < slot.end) {
          if (!cur || slot.start > cur.start) cur = { ...slot, name: e.name, eventName: e.eventName };
        } else if (slot.start > now && (!next || slot.start < next.start)) {
          next = { ...slot, name: e.name, eventName: e.eventName };
        }
      }
    }
    return { current: cur, next };
  }
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Build the UTC start/end for entry `e` on (today + dayOffset) in e.timezone.
function slotInstant(e, now, dayOffset) {
  const tz = e.timezone || 'UTC';
  let parts;
  try {
    parts = zonedParts(new Date(now.getTime() + dayOffset * 86400000), tz);
  } catch { return null; }
  const weekday = WEEKDAYS[parts.weekday];
  if (!(e.days || []).includes(weekday)) return null;
  const [sh, sm] = (e.startTime || '00:00').split(':').map(Number);
  const [eh, em] = (e.endTime || '00:00').split(':').map(Number);
  const start = zonedToUtc(parts.year, parts.month, parts.day, sh, sm, tz);
  let end = zonedToUtc(parts.year, parts.month, parts.day, eh, em, tz);
  if (end <= start) end = new Date(end.getTime() + 86400000); // crosses midnight
  return { start, end, timezone: tz };
}

function zonedParts(date, tz) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short' });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour, minute: +p.minute, weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
}

// Wall-clock in tz -> UTC Date, by iterating the offset once (handles DST).
function zonedToUtc(y, mo, d, h, mi, tz) {
  let guess = Date.UTC(y, mo - 1, d, h, mi);
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(new Date(guess), tz);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess += Date.UTC(y, mo - 1, d, h, mi) - asUtc;
  }
  return new Date(guess);
}
