"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useData } from "@/context/Context";
import { toast } from "sonner";
import {
  IoNotificationsSharp,
  IoCheckmarkDoneSharp,
  IoTrashSharp,
} from "react-icons/io5";
import { FaCheckCircle, FaTimesCircle, FaFileContract, FaBell } from "react-icons/fa";
import { MdOutlineLibraryMusic } from "react-icons/md";

/* ─── Types ─────────────────────────────────────────────────── */
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

/* ─── Icon & colour per type ─────────────────────────────────── */
const typeConfig: Record<
  NotifType,
  { icon: React.ReactNode; dot: string; badge: string }
> = {
  album_approved: {
    icon: <MdOutlineLibraryMusic size={18} />,
    dot: "bg-green-400",
    badge: "text-green-300",
  },
  album_rejected: {
    icon: <MdOutlineLibraryMusic size={18} />,
    dot: "bg-red-400",
    badge: "text-red-300",
  },
  seller_approved: {
    icon: <FaCheckCircle size={16} />,
    dot: "bg-green-400",
    badge: "text-green-300",
  },
  seller_rejected: {
    icon: <FaTimesCircle size={16} />,
    dot: "bg-red-400",
    badge: "text-red-300",
  },
  contract_approved: {
    icon: <FaFileContract size={16} />,
    dot: "bg-green-400",
    badge: "text-green-300",
  },
  contract_rejected: {
    icon: <FaFileContract size={16} />,
    dot: "bg-red-400",
    badge: "text-red-300",
  },
  general: {
    icon: <FaBell size={16} />,
    dot: "bg-[#66FCF1]",
    badge: "text-[#66FCF1]",
  },
};

const isApproved = (type: NotifType) =>
  ["album_approved", "seller_approved", "contract_approved"].includes(type);

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

/* ─── Single notification row ────────────────────────────────── */
const NotifRow = ({
  notif,
  token,
  onRead,
  onDelete,
}: {
  notif: Notification;
  token: string;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const cfg = typeConfig[notif.type] || typeConfig.general;
  const approved = isApproved(notif.type);

  const handleRead = async () => {
    if (notif.isRead) return;
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/notifications/${notif._id}/read`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      onRead(notif._id);
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/notifications/${notif._id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      onDelete(notif._id);
    } catch {
      toast.error("Failed to delete", { style: { background: "red", color: "white", border: "none" } });
    }
  };

  return (
    <div
      onClick={handleRead}
      className={`group flex items-start gap-4 px-5 py-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${
        !notif.isRead ? "bg-white/[0.04]" : ""
      }`}
    >
      {/* Icon circle */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          approved ? "bg-green-500/15 text-green-300" : notif.type === "general" ? "bg-[#66FCF1]/10 text-[#66FCF1]" : "bg-red-500/15 text-red-300"
        }`}
      >
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-semibold ${
                approved ? "text-green-300" : notif.type === "general" ? "text-[#66FCF1]" : "text-red-300"
              }`}
            >
              {approved ? "✔" : notif.type === "general" ? "●" : "✕"}
            </span>
            <span className={`text-sm font-medium ${notif.isRead ? "text-gray-300" : "text-white"}`}>
              {notif.title}
            </span>
            {!notif.isRead && (
              <span className="w-2 h-2 rounded-full bg-[#66FCF1] flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500">{timeAgo(notif.createdAt)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400"
            >
              <IoTrashSharp size={14} />
            </button>
          </div>
        </div>
        {notif.message && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
        )}
      </div>
    </div>
  );
};

/* ─── Main Notifications Page ─────────────────────────────────── */
const NotificationsPage = () => {
  const { userData } = useData();
  const token = (userData as any)?.token as string;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter === "unread") params.set("unreadOnly", "true");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/notifications?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to load notifications", {
        style: { background: "red", color: "white", border: "none" },
      });
    } finally {
      setLoading(false);
    }
  }, [token, page, filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleDelete = (id: string) => {
    const wasUnread = !notifications.find((n) => n._id === id)?.isRead;
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setTotal((t) => t - 1);
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All marked as read", { style: { background: "green", color: "white", border: "none" } });
    } catch {
      toast.error("Failed to mark all as read", { style: { background: "red", color: "white", border: "none" } });
    }
  };

  const clearAll = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/notifications/clear-all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setTotal(0);
      setUnreadCount(0);
      toast.success("All notifications cleared", { style: { background: "green", color: "white", border: "none" } });
    } catch {
      toast.error("Failed to clear", { style: { background: "red", color: "white", border: "none" } });
    }
  };

  return (
    <div className="min-h-screen bg-[#060f24] text-white">
      <div className="max-w-[860px] mx-auto py-8 px-4 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#66FCF1]">
              <IoNotificationsSharp size={22} />
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-[#66FCF1]/15 border border-[#66FCF1]/30 text-[#66FCF1] text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Activity log for all admin actions — approvals, rejections, and more.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-all"
              >
                <IoCheckmarkDoneSharp size={15} />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-400/20 text-red-300 px-3 py-1.5 rounded-lg transition-all"
              >
                <IoTrashSharp size={14} />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`capitalize px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                filter === f
                  ? "bg-[#66FCF1]/15 border-[#66FCF1]/40 text-[#66FCF1]"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {f === "all" ? `All (${total})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="rounded-xl border border-white/10 overflow-hidden bg-[#071126]/60">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
              <div className="w-8 h-8 border-2 border-[#66FCF1]/30 border-t-[#66FCF1] rounded-full animate-spin" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
              <IoNotificationsSharp size={42} className="text-white/10" />
              <p>No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotifRow
                key={n._id}
                notif={n}
                token={token}
                onRead={handleRead}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-40 hover:bg-white/10 transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-40 hover:bg-white/10 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
