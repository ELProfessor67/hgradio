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

                // Show popup after 4s, hide after 10s
                const t1 = setTimeout(() => {
                    setHide(false);
                    const t2 = setTimeout(() => setHide(true), 10000);
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

    return (
        <div
            className={`fixed bottom-4 left-4 bg-white shadow-2xl rounded-xl p-5 max-w-[22rem] transition-all duration-500 transform ${hide ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}
            style={{ zIndex: 9999 }}
        >
            {/* Info */}
            <div className="text-gray-800 text-sm leading-relaxed relative">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="font-bold text-black text-lg">{show.name}</span>
                    {status === 'upcoming' && (
                        <span className="text-xs text-blue-600 font-bold uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded">Up Next</span>
                    )}
                    {status === 'live' && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wide">
                            LIVE
                        </span>
                    )}
                </div>
                
                {show.eventName && (
                    <div className="text-gray-600 text-xs mb-1 font-medium">{show.eventName}</div>
                )}
                
                <div className="text-gray-600 mb-2">
                    <span className="font-semibold text-black">
                        {utcToLocalAmPm(show.startTime)} – {utcToLocalAmPm(show.endTime)}
                    </span>
                    <span className="text-gray-500 text-xs ml-1">({show.timezone})</span>
                </div>
                
                <div className="text-gray-700 text-xs pt-2 border-t border-gray-100">
                    A blessed, powerful broadcast that will{' '}
                    <span className="font-semibold text-blue-600">uplift</span> and{' '}
                    <span className="font-semibold text-blue-600">inspire</span>.
                </div>
            </div>
        </div>
    );
}

export default Popup