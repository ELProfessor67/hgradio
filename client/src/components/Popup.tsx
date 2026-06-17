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

/** Get initials from a name */
function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Deterministic avatar color */
function getAvatarColor(name: string): string {
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#e91e63', '#00bcd4', '#ff5722'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

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
    const avatarColor = getAvatarColor(show.name);
    const initials = getInitials(show.name);

    return (
        <div
            className={`fixed bottom-4 left-4 bg-white shadow-2xl rounded-xl p-4 max-w-[22rem] transition-all duration-500 transform ${hide ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}
            style={{ zIndex: 9999 }}
        >
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="min-w-[4rem] min-h-[4rem] max-w-[4rem] max-h-[4rem] relative flex-shrink-0">
                    {show.profilePicUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            alt={show.name}
                            loading="lazy"
                            src={show.profilePicUrl}
                            className="w-16 h-16 rounded-full object-cover"
                        />
                    ) : (
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl"
                            style={{ backgroundColor: avatarColor }}
                        >
                            {initials}
                        </div>
                    )}
                    {/* Live badge */}
                    {status === 'live' && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                            LIVE
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="text-gray-800 text-sm leading-relaxed">
                    <span className="font-bold text-black text-lg">{show.name}</span>
                    {status === 'upcoming' && (
                        <span className="ml-1 text-xs text-blue-600 font-semibold">Up Next</span>
                    )}
                    <br />
                    {show.eventName && (
                        <>
                            <span className="text-gray-600 text-xs">{show.eventName}</span>
                            <br />
                        </>
                    )}
                    <span className="font-semibold text-black">
                        {utcToLocalAmPm(show.startTime)} – {utcToLocalAmPm(show.endTime)}
                    </span>
                    <br />
                    <span className="text-gray-500 text-xs">{show.timezone}</span>
                    <br />
                    <span className="text-gray-700 text-xs">
                        A blessed, powerful broadcast that will{' '}
                        <span className="font-semibold text-black">uplift</span> and{' '}
                        <span className="font-semibold text-black">inspire</span>.
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Popup