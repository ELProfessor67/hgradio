/**
 * ⚠️ AIR TIMES ARRIVE AS UTC — AND ARE NOT THE VIEWER'S.
 *
 * `GET hgdjlive.com/api/v1/schedule-public` sends each show as:
 *
 *     { "startTime": "21:56", "endTime": "22:27",
 *       "timezone": "America/Los_Angeles", "days": ["Sunday", …] }
 *
 * `startTime` / `endTime` are UTC — confirmed by the panel developer, who owns
 * the storage. The `timezone` beside them is NOT the zone those digits belong
 * to: the panel captures it for its own auto-scheduling, so it is metadata
 * about the DJ. Do not convert *from* it.
 *
 * The schedule used to print the digits verbatim — "09:56 PM" — with no
 * conversion and no timezone label, so every viewer read raw UTC as if it were
 * their own clock. The popup was worse: it read them as UTC and then converted
 * "UTC to Pacific" a second time, under a hardcoded "LOS ANGELES, CA".
 *
 * Everything here resolves a show to a real INSTANT, then renders it on the
 * viewer's own clock. A show's WEEKDAY can therefore move: a 21:56 UTC
 * Saturday show is 2:56 AM Sunday in Karachi and is filed under Sunday there.
 * The day column and the time always describe the same moment.
 *
 * This mirrors hgradioApp/src/utils/schedule.ts. Keep the two in step.
 */

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface ScheduleEntry {
  name: string;
  profilePicUrl: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  days: string[];
  eventName?: string;
  showTopics?: string;
}

export type ScheduleData = Record<string, ScheduleEntry[]>;

/**
 * WHAT THE FEED'S DIGITS MEAN — settled, kept as a switch.
 *
 * "utc"   — "21:56" is 21:56 UTC. ✅ THIS IS THE ANSWER, confirmed by the
 *           panel developer: the per-entry `timezone` is captured for
 *           auto-scheduling, and the time itself is UTC.
 * "zoned" — "21:56" would be a wall clock in the entry's own `timezone`.
 *
 * Kept as a constant because the two readings differ by the station's whole
 * offset, so if the panel ever changes how it stores times this is the one
 * line to move.
 *
 * ⚠️ Keep in step with FEED_TIME_BASIS in hgradioApp/src/utils/schedule.ts —
 * the app and the website must never disagree about this.
 */
export type FeedTimeBasis = "zoned" | "utc";
export const FEED_TIME_BASIS: FeedTimeBasis = "utc";

export interface ShowOccurrence {
  show: ScheduleEntry;
  start: Date;
  end: Date;
  /** Weekday this airing falls on FOR THE VIEWER. */
  localDay: string;
}

export type LocalSchedule = Record<string, ShowOccurrence[]>;

/**
 * Offset of `timeZone` from UTC, in ms, at a given instant. DST-correct by
 * construction: Intl applies whichever rule is in force at that instant.
 */
function zoneOffsetMs(timeZone: string, at: Date): number | null {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts: Record<string, string> = {};
    for (const p of dtf.formatToParts(at)) {
      if (p.type !== "literal") parts[p.type] = p.value;
    }
    if (!parts.year || !parts.hour) return null;
    const asUTC = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );
    return asUTC - at.getTime();
  } catch {
    return null;
  }
}

/**
 * A wall-clock reading in `timeZone` → the instant it refers to.
 *
 * Two passes: the offset is measured at the naive guess, then again at the
 * corrected instant, which is what makes the hour either side of a DST change
 * come out right.
 */
function zonedTimeToInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date | null {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const first = zoneOffsetMs(timeZone, new Date(naive));
  if (first === null) return null;
  const second = zoneOffsetMs(timeZone, new Date(naive - first));
  return new Date(naive - (second ?? first));
}

function todayInZone(timeZone: string, now: Date) {
  const offset = zoneOffsetMs(timeZone, now);
  if (offset === null) return null;
  const shifted = new Date(now.getTime() + offset);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
  };
}

/**
 * A show's wall-clock reading → a real instant, honouring FEED_TIME_BASIS.
 * The single place the disputed interpretation is applied.
 */
function resolveInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  zone: string
): Date | null {
  if (FEED_TIME_BASIS === "utc") {
    return new Date(Date.UTC(year, month - 1, day, hour, minute));
  }
  return zonedTimeToInstant(year, month, day, hour, minute, zone);
}

function parseHHMM(t: string) {
  if (!t) return null;
  const [hs, ms] = t.split(":");
  const h = parseInt(hs, 10);
  const m = parseInt(ms, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { h, m };
}

/**
 * The whole feed, re-expressed on the viewer's clock.
 *
 * The panel files each show under the weekday it airs on in its own zone. We
 * walk the days around today, resolve each airing to a real instant, and
 * re-file it under the weekday the viewer will experience it on. The window
 * runs a day either side so an airing that crosses midnight is not lost.
 */
export function buildLocalSchedule(
  data: ScheduleData,
  now: Date = new Date()
): LocalSchedule {
  const out: LocalSchedule = {};
  for (const day of DAYS) out[day] = [];

  const seen = new Set<string>();

  for (const [stationDay, entries] of Object.entries(data ?? {})) {
    if (!Array.isArray(entries)) continue;

    for (const show of entries) {
      const s = parseHHMM(show.startTime);
      const e = parseHHMM(show.endTime);
      if (!s || !e) continue;

      /**
       * Which calendar date the panel's day bucket refers to. In UTC mode that
       * is today's UTC date, and the entry's `timezone` is ignored entirely —
       * so a show with the field missing still resolves.
       */
      const zone = show.timezone ?? "";
      const base =
        FEED_TIME_BASIS === "utc"
          ? { y: now.getUTCFullYear(), m: now.getUTCMonth() + 1, d: now.getUTCDate() }
          : zone
            ? todayInZone(zone, now)
            : null;
      if (!base) continue;

      const anchor = Date.UTC(base.y, base.m - 1, base.d);

      for (let offset = -1; offset <= 7; offset++) {
        const cursor = new Date(anchor + offset * 86_400_000);
        if (DAYS[cursor.getUTCDay()] !== stationDay) continue;

        const y = cursor.getUTCFullYear();
        const m = cursor.getUTCMonth() + 1;
        const d = cursor.getUTCDate();

        const start = resolveInstant(y, m, d, s.h, s.m, zone);
        let end = resolveInstant(y, m, d, e.h, e.m, zone);
        if (!start || !end) continue;
        // Ends "before" it starts → it runs past midnight.
        if (end.getTime() <= start.getTime()) {
          end = new Date(end.getTime() + 86_400_000);
        }

        const localDay = DAYS[start.getDay()];
        const key = `${show.name}|${show.eventName ?? ""}|${localDay}|${start.getHours()}:${start.getMinutes()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        out[localDay].push({ show, start, end, localDay });
      }
    }
  }

  /**
   * Ordered by TIME OF DAY, not by absolute instant — a weekday column can
   * hold airings resolved to different calendar dates, so sorting by instant
   * would put an 11:00 PM show above a 9:56 AM one in the same column.
   */
  for (const day of DAYS) {
    out[day].sort(
      (a, b) =>
        a.start.getHours() * 60 + a.start.getMinutes() -
        (b.start.getHours() * 60 + b.start.getMinutes())
    );
  }
  return out;
}

/** "9:56 AM" on the viewer's own clock. */
export function formatOccurrenceTime(d: Date): string {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/** Raw "HH:MM" printed unchanged — only for runtimes with no zone data. */
export function formatRawTime(t: string): string {
  const p = parseHHMM(t);
  if (!p) return t;
  const ampm = p.h >= 12 ? "PM" : "AM";
  const h = p.h % 12 || 12;
  return `${h}:${String(p.m).padStart(2, "0")} ${ampm}`;
}

export function isOccurrenceLive(o: ShowOccurrence, now: number = Date.now()): boolean {
  return now >= o.start.getTime() && now <= o.end.getTime();
}

export function hasOccurrenceEnded(o: ShowOccurrence, now: number = Date.now()): boolean {
  return now > o.end.getTime();
}

/** The airing on now plus the next `count`, across the whole week. */
export function getCurrentAndUpcoming(
  schedule: LocalSchedule,
  count: number,
  now: number = Date.now()
): { current: ShowOccurrence | null; upcoming: ShowOccurrence[] } {
  const all = DAYS.flatMap((d) => schedule[d] ?? []).sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
  const current = all.find((o) => isOccurrenceLive(o, now)) ?? null;
  const upcoming = all.filter((o) => o.start.getTime() > now).slice(0, count);
  return { current, upcoming };
}

export function canConvertTimeZones(): boolean {
  // Reading UTC onto the viewer's clock is plain Date arithmetic — no zone
  // database needed, so this is always true in UTC mode.
  if (FEED_TIME_BASIS === "utc") return true;
  return zoneOffsetMs("America/Los_Angeles", new Date()) !== null;
}

/** The viewer's own zone name, for the "times shown in…" line. */
export function viewerTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}
