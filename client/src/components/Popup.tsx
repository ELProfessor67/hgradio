'use client'
import React, { useEffect, useState } from 'react'

interface ScheduleEntry {
    name: string;
    profilePicUrl: string | null;
    startTime: string; // "HH:MM" UTC
    endTime: string;   // "HH:MM" UTC
    timezone: string;
    days: string[];
    eventName?: string;
}

type ScheduleData = Record<string, ScheduleEntry[]>;

/** Convert "HH:MM" UTC to a Date object for today */
function utcTimeToDate(timeStr: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setUTCHours(h, m, 0, 0);
    return d;
}

/** Format "HH:MM" UTC => local "H:MM AM/PM" */
function utcToLocalAmPm(timeStr: string): string {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const utcDate = new Date(Date.UTC(2025, 0, 1, h, m));
    return utcDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

type LiveStatus = 'live' | 'upcoming' | 'none';

interface CurrentShow {
    status: LiveStatus;
    show: ScheduleEntry;
}

/** Find currently live or next upcoming show from today's schedule */
function getCurrentShow(shows: ScheduleEntry[]): CurrentShow | null {
    const nowUTC = new Date();

    let upcoming: ScheduleEntry | null = null;
    let minDiff = Infinity;

    for (const show of shows) {
        if (!show.startTime || !show.endTime) continue;

        const start = utcTimeToDate(show.startTime);
        const end = utcTimeToDate(show.endTime);

        // Handle overnight shows
        if (end < start) end.setUTCDate(end.getUTCDate() + 1);

        if (nowUTC >= start && nowUTC <= end) {
            return { status: 'live', show };
        } else if (start > nowUTC) {
            const diff = start.getTime() - nowUTC.getTime();
            if (diff < minDiff) {
                minDiff = diff;
                upcoming = show;
            }
        }
    }

    if (upcoming) return { status: 'upcoming', show: upcoming };
    return null;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Popup = () => {
    const [hide, setHide] = useState(true);
    const [current, setCurrent] = useState<CurrentShow | null>(null);

    useEffect(() => {
        const fetchAndSet = async () => {
            try {
                const res = await fetch('https://hgdjlive.com/api/v1/schedule-public');
                if (!res.ok) return;
                const data: ScheduleData = await res.json();

                const todayName = DAYS[new Date().getDay()];
                const todayShows: ScheduleEntry[] = data[todayName] || [];

                const result = getCurrentShow(todayShows);
                if (!result) return; // No show right now or upcoming — don't show popup

                setCurrent(result);

                // Show popup after 4s, hide after 15s
                const t1 = setTimeout(() => {
                    setHide(false);
                    const t2 = setTimeout(() => setHide(true), 15000);
                    return () => clearTimeout(t2);
                }, 4000);
                return () => clearTimeout(t1);
            } catch {
                // Silently fail — popup won't show
            }
        };

        fetchAndSet();
    }, []);

    if (!current) return null;

    const { status, show } = current;

    const getDaysInitials = (daysList: string[]) => {
        if (!daysList || daysList.length === 0) {
            return [DAYS[new Date().getDay()].charAt(0)];
        }
        const mapping: Record<string, string> = {
            'Monday': 'M', 'Tuesday': 'T', 'Wednesday': 'W', 'Thursday': 'Th', 'Friday': 'F', 'Saturday': 'S', 'Sunday': 'Su'
        };
        return daysList.map(d => mapping[d] || d.charAt(0)).slice(0, 4);
    }

    const displayDays = (show.days && show.days.length > 0) ? getDaysInitials(show.days) : [DAYS[new Date().getDay()].charAt(0)];

    return (
        <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-[1200px] z-[9999] transition-all duration-1000 ease-out transform ${
                hide ? 'translate-y-[150%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
            }`}
        >
            <div className="relative flex flex-col md:flex-row w-full rounded-lg overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[#D8B257]/40 bg-[#070D18]">
                
                {/* Close Button */}
                <button 
                    onClick={() => setHide(true)}
                    className="absolute top-3 right-3 text-white/50 hover:text-white z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 transition"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Left Section */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 relative z-10">
                    <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-2">
                        HALLELUJAH
                    </h2>
                    <h2 className="text-[#D8B257] text-2xl md:text-4xl lg:text-5xl font-sans font-bold tracking-widest mb-4">
                        GOSPEL GLOBALLY
                    </h2>
                    <div className="text-white text-base md:text-xl font-sans font-bold tracking-widest mb-4 uppercase">
                        {show.name || 'KENNY ANDREWS SPECIAL'}
                    </div>
                    {/* Glowing Line */}
                    <div className="h-[2px] w-[80%] bg-gradient-to-r from-[#D8B257] via-[#FFF3B0] to-transparent shadow-[0_0_12px_rgba(216,178,87,0.9)] mb-4"></div>
                    <div className="text-[#D8B257] italic text-xl md:text-2xl font-serif">
                        Broadcasts That Uplift & Inspire
                    </div>
                </div>

                {/* Center Section */}
                <div className="bg-gradient-to-b from-[#E2C37E] to-[#B08632] md:w-[320px] flex flex-col items-center justify-center p-6 md:p-8 relative z-10 border-l border-r border-black/30 shadow-2xl">
                    <div className="text-black font-sans font-extrabold text-2xl md:text-3xl mb-4 tracking-wider uppercase">
                        {status === 'live' ? 'LIVE NOW!' : 'JOIN US!'}
                    </div>
                    <div className="bg-[#070D18] w-full rounded-lg p-5 border border-white/10 flex flex-col items-center shadow-inner">
                        <div className="flex gap-2 mb-4">
                            {displayDays.map((day, idx) => (
                                <div key={idx} className="w-10 h-10 md:w-12 md:h-12 border-2 border-white rounded flex items-center justify-center text-white font-sans font-bold text-xl md:text-2xl">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="text-white font-sans font-bold text-xl md:text-2xl whitespace-nowrap mb-1 tracking-wide">
                            {utcToLocalAmPm(show.startTime)} – {utcToLocalAmPm(show.endTime)}
                        </div>
                        <div className="text-[#D8B257] font-sans font-bold tracking-widest text-sm md:text-base mb-2 uppercase">
                            {show.timezone || 'PACIFIC TIME'}
                        </div>
                        <div className="text-white font-sans font-semibold text-sm md:text-base tracking-widest">
                            LOS ANGELES, CA
                        </div>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center items-center text-center relative z-10">
                    <div className="text-[#D8B257] font-sans font-bold text-2xl md:text-3xl lg:text-4xl tracking-widest mb-1 uppercase">
                        {show.name.split(' ')[0]} {show.name.split(' ')[1] || ''}
                    </div>
                    <div className="text-[#D8B257] font-serif italic text-3xl md:text-4xl lg:text-5xl mb-6">
                        {show.eventName || 'Special'}
                    </div>
                    <p className="text-white font-sans text-sm md:text-base font-semibold tracking-widest mb-6 max-w-[320px] leading-relaxed uppercase">
                        LISTEN TO BROADCASTS THAT LIFT YOU HIGHER AND INSPIRE YOUR DAY!
                    </p>
                    <div className="text-[#D8B257] font-sans font-bold text-base md:text-lg tracking-widest uppercase">
                        TUNE IN. BE BLESSED.
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Popup