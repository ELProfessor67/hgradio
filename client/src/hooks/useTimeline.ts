"use client";

import { useEffect, useState } from "react";
import { currentYear, yearsOnAirLabel } from "@/utils/timeline";

/*
  Time-based text, re-read in the browser after mount.

  Next prerenders these pages, so a value computed once during the render pass
  is really the value as of the last build. Reading it again on the client is
  what keeps "17+ years" and the copyright year honest on a page that was
  built months ago and hasn't been rebuilt since — which is the whole point of
  putting these numbers on a clock.
*/

/** "17+ years", recomputed in the browser. */
export function useYearsOnAir(): string {
  const [label, setLabel] = useState(() => yearsOnAirLabel());
  useEffect(() => setLabel(yearsOnAirLabel()), []);
  return label;
}

/** The year for a copyright line, recomputed in the browser. */
export function useCurrentYear(): number {
  const [year, setYear] = useState(() => currentYear());
  useEffect(() => setYear(currentYear()), []);
  return year;
}
