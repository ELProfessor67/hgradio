/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useData } from "@/context/Context";
import { FetchLoading } from "@/utils/Loading";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MdDeleteOutline } from "react-icons/md";
import ConfirmRemoveDialog from "@/components/ConfirmRemoveDialog";

/*
  PRAYER REQUESTS — the prayer team's inbox and the Prayer Wall's gate.

  Two things share this screen because they are two views of one list:

    • every request that came in, including the private ones, which are the
      point of the feature for the team even though they are never published;
    • the public ones waiting for a decision, which are the only ones an
      "Approve" button can act on.

  A request the sender marked private has no Publish button, and the server
  refuses to approve one even if the request is made by hand — the sender's
  choice is not something this screen is able to override.
*/

interface PrayerRequestItem {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  message: string;
  visibility: "private" | "public";
  approved: boolean;
  prayerCount: number;
  source?: "app" | "web";
  createdAt?: string;
}

type View = "all" | "pending" | "private";

const PAGE_SIZE = 25;

const formatDate = (value?: string) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const Page = () => {
  const { userData } = useData();
  const [requests, setRequests] = useState<PrayerRequestItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [view, setView] = useState<View>("all");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Paging. The inbox used to ask for a flat 100 and show whatever came back,
  // so anything older than the newest hundred was simply unreachable.
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Deletion is two-step, like everywhere else that removes something: the
  // bin icon opens this, and the confirm inside it does the deleting.
  const [pendingDelete, setPendingDelete] = useState<PrayerRequestItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!userData?.token) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/prayer-requests?view=${view}&page=${page}&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${userData.token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch");
      setRequests(data.requests || []);
      setPendingCount(data.pendingCount ?? 0);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch prayer requests");
    } finally {
      setLoading(false);
    }
  }, [userData?.token, view, page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const setApproved = async (id: string, approve: boolean) => {
    setBusyId(id);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/prayer-requests/${id}/${
          approve ? "approve" : "unapprove"
        }`,
        { method: "PATCH", headers: { Authorization: `Bearer ${userData?.token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(
        approve ? "Published to the Prayer Wall" : "Removed from the Prayer Wall",
        { style: { background: "green", color: "white" } }
      );
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to update", {
        style: { background: "red", color: "white" },
      });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/prayer-requests/${pendingDelete._id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${userData?.token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Deleted", { style: { background: "green", color: "white" } });
      setPendingDelete(null);
      // Deleting the only row on the last page would otherwise leave the
      // admin staring at an empty list.
      if (requests.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete", {
        style: { background: "red", color: "white" },
      });
    } finally {
      setDeleting(false);
    }
  };

  const tab = (key: View, label: string, tone: string) => (
    <button
      key={key}
      onClick={() => {
        setView(key);
        setPage(1);
      }}
      className={`px-3.5 py-1.5 text-sm font-medium border transition-all ${
        view === key ? tone : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Prayer Requests</h2>
      <p className="mb-6 max-w-3xl text-sm text-gray-400">
        Requests marked <span className="text-emerald-300">Share</span> can be published to the
        Prayer Wall, where they appear on the website and in the app for others to pray over.
        Requests marked <span className="text-sky-300">Prayer team only</span> are for this screen
        alone — they cannot be published.
      </p>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="text-xl font-semibold text-second">
          All Requests
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">{total} total</span>
          )}
        </h3>
        <div className="flex gap-2">
          {tab("all", "All", "bg-second/15 border-second/40 text-second")}
          {tab(
            "pending",
            `Awaiting approval${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
            "bg-amber-500/15 border-amber-400/40 text-amber-300"
          )}
          {tab("private", "Prayer team only", "bg-sky-500/15 border-sky-400/40 text-sky-300")}
        </div>
      </div>

      {loading ? (
        <FetchLoading />
      ) : requests.length === 0 ? (
        <p className="py-12 text-center text-gray-400">Nothing here yet.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const shareable = r.visibility === "public";
            return (
              <div key={r._id} className="bg-[#25233bb4] p-5 text-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold">{r.name}</span>

                      {shareable ? (
                        <span className="border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                          Share
                        </span>
                      ) : (
                        <span className="border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-xs text-sky-300">
                          Prayer team only
                        </span>
                      )}

                      {shareable &&
                        (r.approved ? (
                          <span className="border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-gray-300">
                            On the wall · {r.prayerCount} prayed
                          </span>
                        ) : (
                          <span className="border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                            Awaiting approval
                          </span>
                        ))}
                    </div>

                    <div className="mt-1 text-sm text-gray-400">
                      {[r.email, r.phone].filter(Boolean).join(" · ")}
                      {r.email || r.phone ? " · " : ""}
                      {formatDate(r.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {shareable &&
                      (r.approved ? (
                        <button
                          onClick={() => setApproved(r._id, false)}
                          disabled={busyId === r._id}
                          className="border border-white/15 px-4 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
                        >
                          Take off the wall
                        </button>
                      ) : (
                        <button
                          onClick={() => setApproved(r._id, true)}
                          disabled={busyId === r._id}
                          className="bg-second px-4 py-1.5 text-sm font-semibold text-black hover:bg-second/80 disabled:opacity-50"
                        >
                          {busyId === r._id ? "Publishing…" : "Publish to Prayer Wall"}
                        </button>
                      ))}

                    <button
                      onClick={() => setPendingDelete(r)}
                      aria-label={`Delete the prayer request from ${r.name}`}
                      className="p-2 text-red-400 transition hover:text-red-300"
                    >
                      <MdDeleteOutline size={20} />
                    </button>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-line text-[0.98rem] leading-relaxed text-gray-200">
                  {r.message}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="border border-white/15 px-4 py-2 text-sm transition hover:bg-white/10 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="border border-white/15 px-4 py-2 text-sm transition hover:bg-white/10 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmRemoveDialog
        open={!!pendingDelete}
        title="Delete this prayer request?"
        itemName={pendingDelete ? `${pendingDelete.name}` : undefined}
        body="It is removed from this inbox and, if it was published, from the Prayer Wall. This can't be undone."
        warning={
          pendingDelete?.visibility === "private"
            ? "This one was sent to the prayer team only — nobody else has a copy of it."
            : undefined
        }
        confirmLabel="Yes, delete it"
        busy={deleting}
        onCancel={() => {
          setDeleting(false);
          setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Page;
