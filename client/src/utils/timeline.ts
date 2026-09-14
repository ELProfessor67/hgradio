/*
  Anything on the site that states an age, a span or a year is computed here
  rather than typed into a page.

  The client's rule: a number that describes time has to move with time. A
  hardcoded "3+ years" is wrong the day after it is written and keeps getting
  more wrong — the same way a birthday shown on a profile counts up instead of
  freezing at whatever it was when the page was built. Same for the footer's
  copyright year.

  One place to change, every surface follows. The mobile app carries a copy of
  this file at hgradioApp/src/constants/timeline.ts — keep the two in step.
*/

/**
 * When the ministry went on air. Everything that says "X years" counts from
 * here, so this is the ONLY line to edit if the date is corrected.
 *
 * ⚠️ Needs the client's confirmation. The pages previously read "3+ years",
 * but the client says the real figure is "over 17 years" in the industry —
 * which puts the start around 2009. Set the exact month and year here and the
 * website, the app and anything added later all update together.
 */
export const ON_AIR_SINCE = new Date(2009, 0, 1); // January 2009

/** Full years elapsed between `from` and now, never negative. */
export function yearsSince(from: Date, now: Date = new Date()): number {
  let years = now.getFullYear() - from.getFullYear();
  const monthDelta = now.getMonth() - from.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < from.getDate())) {
    years -= 1;
  }
  return Math.max(0, years);
}

/** Years on air as of right now — the number behind the "Experience" stat. */
export function yearsOnAir(now: Date = new Date()): number {
  return yearsSince(ON_AIR_SINCE, now);
}

/** "17+ years" — the stat as it is printed. */
export function yearsOnAirLabel(now: Date = new Date()): string {
  return `${yearsOnAir(now)}+ years`;
}

/** The year to print in a copyright line. */
export function currentYear(now: Date = new Date()): number {
  return now.getFullYear();
}
