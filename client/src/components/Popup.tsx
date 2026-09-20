'use client'
import React, { useEffect, useState } from 'react'
import {
    DAYS as WEEK_DAYS,
    buildLocalSchedule,
    canConvertTimeZones,
    formatOccurrenceTime,
    formatRawTime,
    getCurrentAndUpcoming,
    viewerTimezone,
    type ScheduleData,
    type ShowOccurrence,
} from '@/utils/localSchedule'

/**
 * ⚠️ This popup used to be doubly wrong about time.
 *
 * It read the feed's "HH:MM" as UTC (it is not — see utils/localSchedule.ts),
 * and then "converted UTC to Pacific" for display, shifting already-Pacific
 * digits by another 7 hours. It also captioned every show "LOS ANGELES, CA"
 * while the feed carries four different zones.
 *
 * It now runs the same resolution as the schedule page and the app: real
 * instants, rendered on the viewer's own clock.
 */

type LiveStatus = 'live' | 'upcoming';

interface CurrentShow {
    status: LiveStatus;
    occurrence: ShowOccurrence;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Popup = () => {
    const [hide, setHide] = useState(true);
    const [current, setCurrent] = useState<CurrentShow | null>(null);
    const [schedule, setSchedule] = useState<ReturnType<typeof buildLocalSchedule> | null>(null);

    useEffect(() => {
        const fetchAndSet = async () => {
            try {
                const res = await fetch('https://hgdjlive.com/api/v1/schedule-public');
                if (!res.ok) return;
                const data: ScheduleData = await res.json();

                // Resolved to real instants and re-bucketed onto the viewer's
                // clock before anything is picked — "what is on now" is a
                // question about moments, not about digits.
                const schedule = buildLocalSchedule(data);
                const { current: live, upcoming } = getCurrentAndUpcoming(schedule, 1);
                const result: CurrentShow | null = live
                    ? { status: 'live', occurrence: live }
                    : upcoming[0]
                        ? { status: 'upcoming', occurrence: upcoming[0] }
                        : null;
                if (!result) return; // Nothing on now or next — don't show popup

                setCurrent(result);
                setSchedule(schedule);

                // Show popup after 10s, hide after 60s
                const t1 = setTimeout(() => {
                    setHide(false);
                    const t2 = setTimeout(() => setHide(true), 60000);
                    return () => clearTimeout(t2);
                }, 10000);
                return () => clearTimeout(t1);
            } catch {
                // Silently fail — popup won't show
            }
        };

        fetchAndSet();
    }, []);

    if (!current) return null;

    const { status, occurrence } = current;
    const show = occurrence.show;
    const canConvert = canConvertTimeZones();
    const viewerZone = viewerTimezone();

    const getDaysInitials = (daysList: string[]) => {
        if (!daysList || daysList.length === 0) {
            return [DAYS[new Date().getDay()].charAt(0)];
        }
        const mapping: Record<string, string> = {
            'Monday': 'M', 'Tuesday': 'T', 'Wednesday': 'W', 'Thursday': 'Th', 'Friday': 'F', 'Saturday': 'S', 'Sunday': 'Su'
        };
        return daysList.map(d => mapping[d] || d.charAt(0)).slice(0, 4);
    }

    /**
     * The days this show lands on FOR THE VIEWER, taken from the re-bucketed
     * schedule. `show.days` is the panel's station-local list and would
     * contradict the converted time printed right below it.
     */
    const localDays = schedule
        ? WEEK_DAYS.filter((day) =>
              (schedule[day] ?? []).some(
                  (o) =>
                      o.show.name === show.name &&
                      o.show.eventName === show.eventName &&
                      o.show.startTime === show.startTime
              )
          )
        : [];
    const displayDays = localDays.length > 0
        ? getDaysInitials(localDays)
        : [DAYS[new Date().getDay()].charAt(0)];

    return (
        <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-[900px] z-[9999] transition-all duration-1000 ease-out transform ${hide ? 'translate-y-[150%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
                }`}
        >
            <div className="relative flex flex-col md:flex-row w-full rounded-lg overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[#D8B257]/40 bg-[#070D18]/60 md:bg-[#070D18] backdrop-blur-xl md:backdrop-blur-none">

                {/* Close Button */}
                <button
                    onClick={() => setHide(true)}
                    className="absolute top-2 right-2 text-white/50 hover:text-white z-20 p-1.5 md:p-2 rounded-full bg-black/40 hover:bg-black/60 transition"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Left Section */}
                <div className="flex-1 p-4 md:p-6 flex flex-col justify-center border-b md:border-b-0 relative z-10">
                    <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-serif font-bold tracking-tight mb-1 md:mb-2 uppercase">
                        HALLELUJAH
                    </h2>
                    <h2 className="text-[#D8B257] text-xl md:text-2xl lg:text-3xl font-serif font-bold tracking-widest mb-2 md:mb-4 uppercase">
                        GOSPEL GLOBALLY
                    </h2>
                    <div className="text-white text-sm md:text-base font-sans font-bold tracking-widest mb-2 md:mb-4 uppercase">
                        {show.name || 'KENNY ANDREWS SPECIAL'}
                    </div>
                    {/* Glowing Line */}
                    <div className="h-[2px] w-[80%] bg-gradient-to-r from-[#D8B257] via-[#FFF3B0] to-transparent shadow-[0_0_12px_rgba(216,178,87,0.9)] mb-2 md:mb-4"></div>
                    <div className="text-[#D8B257] text-sm md:text-lg font-sans uppercase">
                        Broadcasts That Uplift & Inspire
                    </div>
                </div>

                {/* Center Section */}
                <div className="bg-gradient-to-b from-[#E2C37E]/30 to-[#B08632]/30 backdrop-blur-xl md:backdrop-blur-none md:w-[260px] flex flex-col items-center justify-center p-4 md:p-6 relative z-10 border-l border-r border-white/20 shadow-[0_8px_32px_rgba(226,195,126,0.2)]">
                    <div className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-serif font-extrabold text-xl md:text-2xl mb-2 md:mb-3 tracking-wider uppercase">
                        {status === 'live' ? 'LIVE NOW!' : 'JOIN US!'}
                    </div>
                    <div className="bg-[#070D18]/60 backdrop-blur-md md:backdrop-blur-none w-full rounded-lg p-3 md:p-4 border border-white/10 flex flex-col items-center shadow-inner">
                        <div className="flex gap-1.5 md:gap-2 mb-2 md:mb-3">
                            {displayDays.map((day, idx) => (
                                <div key={idx} className="w-8 h-8 md:w-10 md:h-10 border-2 border-white rounded flex items-center justify-center text-white font-sans font-bold text-lg md:text-xl uppercase">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="text-white font-sans font-bold text-lg md:text-xl whitespace-nowrap mb-1 tracking-wide uppercase">
                            {canConvert
                                ? `${formatOccurrenceTime(occurrence.start)} – ${formatOccurrenceTime(occurrence.end)}`
                                : `${formatRawTime(show.startTime)} – ${formatRawTime(show.endTime)}`}
                        </div>

                        {/* Was hardcoded "LOS ANGELES, CA" — wrong for the
                            three other zones in the feed, and wrong now that
                            the time above is the viewer's own. */}
                        <div className="text-white font-sans font-semibold text-xs md:text-sm tracking-widest uppercase">
                            {canConvert
                                ? viewerZone
                                    ? viewerZone.replace(/_/g, ' ')
                                    : 'YOUR LOCAL TIME'
                                : show.timezone.replace(/_/g, ' ')}
                        </div>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex-1 p-4 md:p-6 flex flex-col justify-center items-center text-center relative z-10">
                    <div className="text-white text-2xl md:text-3xl lg:text-4xl font-serif font-bold tracking-tight mb-1 md:mb-2 uppercase">
                        {show.name.split(' ')[0]} {show.name.split(' ')[1] || ''}
                    </div>
                    <div className="text-[#D8B257] text-xl md:text-2xl lg:text-3xl font-serif font-bold tracking-widest mb-2 md:mb-4 uppercase">
                        {show.eventName || 'Special'}
                    </div>
                    <p className="text-white font-sans text-xs md:text-sm font-semibold tracking-widest mb-3 md:mb-4 max-w-[280px] leading-relaxed uppercase">
                        LISTEN TO BROADCASTS THAT LIFT YOU HIGHER AND INSPIRE YOUR DAY!
                    </p>
                    <div className="text-[#D8B257] font-sans font-bold text-sm md:text-base tracking-widest uppercase">
                        TUNE IN. BE BLESSED.
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Popup