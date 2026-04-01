"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { IoNotificationsSharp, IoCheckmarkDoneSharp } from "react-icons/io5";
import { BsLayoutSidebar } from "react-icons/bs";
import { FaCheckCircle, FaTimesCircle, FaFileContract, FaBell } from "react-icons/fa";
import { MdOutlineLibraryMusic } from "react-icons/md";
import { IoTrashSharp } from "react-icons/io5";
import { useData } from "@/context/Context";
import Link from "next/link";
import { useParams } from "next/navigation";

/* ─── Types ────────────────────────────────────────────────────── */
type NotifType =
  | "album_approved"
  | "album_rejected"
  | "seller_approved"
  | "seller_rejected"
  | "contract_approved"
  | "contract_rejected"
  | "general";

interface Notification {
  _id: string;
  type: NotifType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/* ─── Helpers ──────────────────────────────────────────────────── */
const isApproved = (type: NotifType) =>
  ["album_approved", "seller_approved", "contract_approved"].includes(type);

const typeIcon: Record<NotifType, React.ReactNode> = {
  album_approved: <MdOutlineLibraryMusic size={14} />,
  album_rejected: <MdOutlineLibraryMusic size={14} />,
  seller_approved: <FaCheckCircle size={13} />,
  seller_rejected: <FaTimesCircle size={13} />,
  contract_approved: <FaFileContract size={13} />,
  contract_rejected: <FaFileContract size={13} />,
  general: <FaBell size={13} />,
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/* ─── TopBar Props ─────────────────────────────────────────────── */
interface TopbarProps {
  isOpenSidebar: boolean;
  setIsOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

/* ─── Component ────────────────────────────────────────────────── */
const TopBar = ({ isOpenSidebar, setIsOpenSidebar }: TopbarProps) => {
  const { userData } = useData();
  const token = (userData as any)?.token as string;
  const params = useParams();
  const adminId = params?.adminId as string;

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* fetch latest 8 for dropdown */
  const fetchDropdownNotifs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/notifications?page=1&limit=8`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch { /* silent */ }
  }, [token]);

  /* poll every 30s for badge count */
  useEffect(() => {
    fetchDropdownNotifs();
    pollRef.current = setInterval(fetchDropdownNotifs, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchDropdownNotifs]);

  /* fetch + open */
  const handleBellClick = async () => {
    if (!open) {
      setLoadingNotifs(true);
      await fetchDropdownNotifs();
      setLoadingNotifs(false);
    }
    setOpen((o) => !o);
  };

  /* close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* mark single read */
  const markRead = async (id: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/notifications/${id}/read`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  /* mark all read */
  const markAllRead = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  return (
    <div
      className={`${isOpenSidebar ? "pl-4 xl:pl-[40px]" : "xl:pl-[340px]"} fixed top-0 left-0 z-50 bg-[#071126] h-[70px] pr-5 xl:pr-10 flex items-center justify-between border-b border-[#0c434d] w-full transition-all duration-300 ease-in-out text-second`}
    >
      {/* Left — sidebar toggle */}
      <div className="w-[60%] relative flex items-center gap-4 md:gap-6">
        <div
          onClick={() => setIsOpenSidebar(!isOpenSidebar)}
          className="text-[1.3rem] cursor-pointer"
        >
          <BsLayoutSidebar
            className={`${isOpenSidebar ? "rotate-180" : "rotate-0"} transition-all duration-300 ease-in-out`}
          />
        </div>
      </div>

      {/* Right — bell */}
      <div className="flex items-center gap-5 md:gap-8">
        <div className="relative" ref={dropdownRef}>
          {/* Bell button */}
          <button
            id="admin-notification-bell"
            onClick={handleBellClick}
            className="relative cursor-pointer group"
            aria-label="Notifications"
          >
            <IoNotificationsSharp
              className={`text-[1.5rem] transition-colors ${open ? "text-[#66FCF1]" : "text-[#8ea0a8] group-hover:text-[#66FCF1]"}`}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 shadow">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-[calc(100%+14px)] w-[360px] bg-[#071126] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Dropdown header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <IoNotificationsSharp className="text-[#66FCF1]" />
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-[#66FCF1]/15 border border-[#66FCF1]/30 text-[#66FCF1] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#66FCF1] transition-colors"
                  >
                    <IoCheckmarkDoneSharp size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-[320px] overflow-y-auto divide-y divide-white/5">
                {loadingNotifs ? (
                  <div className="py-10 flex flex-col items-center gap-2 text-gray-400 text-sm">
                    <div className="w-6 h-6 border-2 border-[#66FCF1]/30 border-t-[#66FCF1] rounded-full animate-spin" />
                    Loading…
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 flex flex-col items-center gap-2 text-gray-400 text-sm">
                    <IoNotificationsSharp size={32} className="text-white/10" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const approved = isApproved(n.type);
                    return (
                      <div
                        key={n._id}
                        onClick={() => { if (!n.isRead) markRead(n._id); }}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${
                          !n.isRead ? "bg-white/[0.035]" : ""
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                            approved
                              ? "bg-green-500/15 text-green-300"
                              : n.type === "general"
                              ? "bg-[#66FCF1]/10 text-[#66FCF1]"
                              : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          {typeIcon[n.type] || typeIcon.general}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-bold ${approved ? "text-green-400" : n.type === "general" ? "text-[#66FCF1]" : "text-red-400"}`}
                            >
                              {approved ? "✔" : n.type === "general" ? "●" : "✕"}
                            </span>
                            <span className={`text-xs font-semibold truncate ${n.isRead ? "text-gray-300" : "text-white"}`}>
                              {n.title}
                            </span>
                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#66FCF1] flex-shrink-0" />}
                          </div>
                          {n.message && (
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                          )}
                          <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 px-4 py-2.5">
                <Link
                  href={adminId ? `/admin-panel/${adminId}/notifications` : "#"}
                  onClick={() => setOpen(false)}
                  className="block text-center text-xs text-[#66FCF1] hover:underline font-medium"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
