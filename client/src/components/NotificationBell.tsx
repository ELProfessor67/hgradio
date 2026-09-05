/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IoNotificationsSharp, IoCheckmarkDoneSharp } from "react-icons/io5";
import { useData } from "@/context/Context";

/*
  The artist's notification bell — the same interaction as the admin TopBar bell,
  against the artist's own feed (/api/user/notifications, scoped to the token).

  Notifications used to appear only as a panel buried inside the Love Gifts
  section, which meant an artist had to scroll past their albums to discover that
  a payment had been sent.
*/

interface Notif {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

/* Money events get a distinct colour so they stand out from approvals. */
const toneFor = (type: string) => {
  if (type.startsWith("payout") || type.startsWith("withdraw") || type.includes("gift")) {
    return "text-emerald-300";
  }
  if (type.endsWith("_rejected")) return "text-red-300";
  if (type.endsWith("_approved")) return "text-green-300";
  return "text-[#66FCF1]";
};

const NotificationBell = () => {
  const { userData } = useData();
  const token = (userData as any)?.token as string;

  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/notifications?limit=8`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setNotifs(data.notifications || []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      /* the bell just shows no badge */
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load, so the badge is correct before the bell is ever opened.
  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  // Close when clicking anywhere outside the bell.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAllRead = async () => {
    if (!token) return;
    // Updated locally first so the badge clears immediately; a failed request
    // only means the next fetch puts it back.
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      fetchNotifs();
    }
  };

  if (!token) return null;

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) fetchNotifs();
        }}
        className="relative cursor-pointer group px-3 py-2"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      >
        <IoNotificationsSharp
          className={`text-[1.6rem] transition-colors ${
            open ? "text-second" : "text-white group-hover:text-second"
          }`}
        />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 shadow">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] w-[340px] sm:w-[360px] bg-[#071126] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[9999]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <IoNotificationsSharp className="text-second" />
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-second/15 border border-second/30 text-second text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-second transition-colors"
              >
                <IoCheckmarkDoneSharp size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto divide-y divide-white/5">
            {loading && notifs.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>
            ) : notifs.length === 0 ? (
              <div className="py-10 px-4 text-center text-gray-400 text-sm">
                Nothing yet. You will be told here when your account or albums are
                reviewed, and when a payment is on its way.
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-3 text-left ${!n.isRead ? "bg-white/[0.035]" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-sm font-medium flex-1 ${toneFor(n.type)}`}>
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-second flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  {n.message && <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>}
                  <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
