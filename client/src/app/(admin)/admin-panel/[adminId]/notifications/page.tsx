"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { PageLoading } from "@/utils/Loading";
import { useData } from "@/context/Context";
import { toast } from "sonner";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  IoNotificationsSharp,
  IoCheckmarkDoneSharp,
  IoTrashSharp,
} from "react-icons/io5";
import {
  AdminNotification,
  needsReview,
  notifIcon,
  notifTone,
  reviewLink,
  timeAgo,
} from "@/utils/adminNotifications";

type View = "all" | "unread" | "pending";

/* ─── Single notification row ────────────────────────────────── */
const NotifRow = ({
  notif,
  token,
  onRead,
  onDelete,
  onReview,
}: {
  notif: AdminNotification;
  token: string;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onReview: (notif: AdminNotification) => void;
}) => {
  const tone = notifTone(notif.type);
  const actionable = needsReview(notif);

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
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${tone.bubble}`}
      >
        {notifIcon(notif.type, 16)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${tone.text}`}>{tone.mark}</span>
            <span className={`text-sm font-medium ${notif.isRead ? "text-gray-300" : "text-white"}`}>
              {notif.title}
            </span>
            {!notif.isRead && (
              <span className="w-2 h-2 rounded-full bg-[#66FCF1] flex-shrink-0" />
            )}
            {actionable && (
              <span className="bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Needs review
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500">{timeAgo(notif.createdAt)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400"
              aria-label="Delete notification"
            >
              <IoTrashSharp size={14} />
            </button>
          </div>
        </div>

        {notif.message && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
        )}

        {(notif.actorName || notif.actorEmail) && (
          <p className="text-[11px] text-gray-500 mt-1">
            {notif.actorName}
            {notif.actorName && notif.actorEmail ? " · " : ""}
            {notif.actorEmail}
          </p>
        )}

        {actionable && (
          <button
            onClick={(e) => { e.stopPropagation(); onReview(notif); }}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 text-amber-300 px-3 py-1.5 rounded-lg transition-all"
          >
            Review now →
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Main Notifications Page ─────────────────────────────────── */
const NotificationsPage = () => {
  const { userData } = useData();
  const token = (userData as any)?.token as string;
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = params?.adminId as string;

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>(
    searchParams.get("view") === "pending" ? "pending" : "all"
  );

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "20", view });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/notifications?${qs}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
      setPendingCount(data.pendingCount ?? 0);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to load notifications", {
        style: { background: "red", color: "white", border: "none" },
      });
    } finally {
      setLoading(false);
    }
  }, [token, page, view]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleDelete = (id: string) => {
    const removed = notifications.find((n) => n._id === id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setTotal((t) => Math.max(0, t - 1));
    if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    if (removed && needsReview(removed)) setPendingCount((c) => Math.max(0, c - 1));
  };

  /* jump to the approvals page with the item's review modal already open */
  const handleReview = (notif: AdminNotification) => {
    const href = reviewLink(notif, adminId);
    if (!href) {
      toast.error("This notification has no item to review", {
        style: { background: "red", color: "white", border: "none" },
      });
      return;
    }
    if (!notif.isRead) {
      handleRead(notif._id);
      fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/notifications/${notif._id}/read`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => { /* silent — navigation still proceeds */ });
    }
    router.push(href);
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
      setPendingCount(0);
      toast.success("All notifications cleared", { style: { background: "green", color: "white", border: "none" } });
    } catch {
      toast.error("Failed to clear", { style: { background: "red", color: "white", border: "none" } });
    }
  };

  // `total` reflects the active view, so only the current tab can show it
  const tabLabel: Record<View, string> = {
    all: view === "all" ? `All (${total})` : "All",
    unread: `Unread (${unreadCount})`,
    pending: `Needs review (${pendingCount})`,
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
              New submissions from users, plus a log of every approval and rejection.
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

        {/* Awaiting-review banner */}
        {pendingCount > 0 && view !== "pending" && (
          <button
            onClick={() => { setView("pending"); setPage(1); }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-400/25 text-amber-300 text-sm font-medium hover:bg-amber-500/15 transition-all"
          >
            <span>
              {pendingCount} submission{pendingCount === 1 ? "" : "s"} awaiting your review
            </span>
            <span>→</span>
          </button>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "unread", "pending"] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                view === v
                  ? "bg-[#66FCF1]/15 border-[#66FCF1]/40 text-[#66FCF1]"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {tabLabel[v]}
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
              <p>
                {view === "pending"
                  ? "Nothing is waiting on your review."
                  : "No notifications yet."}
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotifRow
                key={n._id}
                notif={n}
                token={token}
                onRead={handleRead}
                onDelete={handleDelete}
                onReview={handleReview}
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

/* useSearchParams (for ?view=pending) needs a Suspense boundary */
const NotificationsPageWrapper = () => (
  <Suspense fallback={<PageLoading />}>
    <NotificationsPage />
  </Suspense>
);

export default NotificationsPageWrapper;
