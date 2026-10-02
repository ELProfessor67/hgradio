/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useData } from "@/context/Context";
import { toast } from "sonner";
import { PageLoading } from "@/utils/Loading";
import ConfirmRemoveDialog from "@/components/ConfirmRemoveDialog";
import {
  FaUser,
  FaEnvelope,
  FaTrash,
  FaCrown,
  FaMusic,
  FaShoppingBag,
} from "react-icons/fa";

/*
  All Users — the whole roster in one place, with a take-down.

  This route was an eight-line stub that rendered the words "All Users" and
  nothing else. The panel could only ever see slices of the roster (sellers
  awaiting approval, and that was it), and no screen anywhere could remove an
  account.

  Deleting a person is the most consequential button in the panel, so the
  confirm is the shared two-step one and the server gets the final say: an
  account with albums, purchases, a balance or a pending withdrawal comes back
  409 with the numbers, which land in the dialog as a red warning line before
  the admin can go through with it.
*/

type RoleTab = "all" | "admin" | "artist" | "buyer";

const TABS: { key: RoleTab; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "admin", label: "Admins" },
  { key: "artist", label: "Artists" },
  { key: "buyer", label: "Listeners" },
];

/** What kind of account this is, in one glance. */
const RoleBadge = ({ user }: { user: any }) => {
  if (user?.role === "Admin") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-purple-400/15 text-purple-300 border-purple-400/30">
        <FaCrown size={10} /> Admin
      </span>
    );
  }
  if (user?.accountType === "seller") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-[#66FCF1]/15 text-[#66FCF1] border-[#66FCF1]/30">
        <FaMusic size={10} /> Artist
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-white/10 text-gray-300 border-white/15">
      <FaShoppingBag size={10} /> Listener
    </span>
  );
};

/** Only meaningful for artists — their approval state. */
const SellerStatus = ({ user }: { user: any }) => {
  if (user?.role === "Admin" || user?.accountType !== "seller") {
    return <span className="text-gray-600">—</span>;
  }
  const status = user?.sellerApprovalStatus || "pending";
  const map: Record<string, string> = {
    pending: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
    approved: "bg-green-400/15 text-green-300 border-green-400/30",
    rejected: "bg-red-400/15 text-red-300 border-red-400/30",
    not_required: "bg-white/10 text-gray-400 border-white/15",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
        map[status] || "bg-white/10 text-white border-white/10"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
};

const AllUsersPage = () => {
  const { userData } = useData();
  const token = (userData as any)?.token as string;

  const [hasMounted, setHasMounted] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<RoleTab, number>>({
    all: 0,
    admin: 0,
    artist: 0,
    buyer: 0,
  });
  const [role, setRole] = useState<RoleTab>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Take-down. `pendingDelete` holds the row the admin clicked the bin on;
  // nothing happens until they confirm in the dialog.
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | undefined>(undefined);
  const [forceDelete, setForceDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setHasMounted(true), []);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ role, page: String(page), limit: "25" });
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load users");

      setUsers(Array.isArray(data?.users) ? data.users : []);
      setTotal(data?.total || 0);
      setTotalPages(data?.totalPages || 1);
      if (data?.counts) setCounts(data.counts);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load users", {
        style: { background: "red", border: "none", color: "white" },
      });
    } finally {
      setLoading(false);
    }
    // `q` is deliberately out of the deps — searching is an explicit action
    // (Enter or the button), not something that fires on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openDelete = (u: any) => {
    setDeleteWarning(undefined);
    setForceDelete(false);
    setPendingDelete(u);
  };

  /*
    Second click of the two-step delete. A 409 means the server found
    something worth losing — albums, purchases, money — so the dialog stays
    open, shows what it found, and the next confirm is the one that forces it.
  */
  const confirmDelete = async () => {
    if (!pendingDelete || !token) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users/${pendingDelete._id}${
          forceDelete ? "?force=true" : ""
        }`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (res.status === 409 && data?.requiresForce) {
        setDeleteWarning(data.message);
        setForceDelete(true);
        return;
      }
      if (!res.ok) throw new Error(data?.message || "Failed to delete user");

      toast.success(data?.message || "User deleted.", {
        style: { background: "green", border: "none", color: "white" },
      });
      setPendingDelete(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete user", {
        style: { background: "red", border: "none", color: "white" },
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!hasMounted) return <PageLoading />;

  return (
    <div className="text-white min-h-screen">
      {/* ── Page header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#66FCF1]">All Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Everyone with an account — admins, artists and listeners.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex gap-2 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setRole(t.key);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  role === t.key
                    ? "bg-[#66FCF1]/15 border-[#66FCF1]/50 text-[#66FCF1]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {t.label}
                <span className="ml-2 text-xs opacity-70">{counts[t.key] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  fetchUsers();
                }
              }}
              placeholder="Search name / email / username"
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg outline-none text-white text-sm placeholder-gray-500 focus:border-[#66FCF1]/40 transition-all"
            />
            <button
              onClick={() => {
                setPage(1);
                fetchUsers();
              }}
              disabled={loading}
              className="px-4 py-2 bg-[#66FCF1]/10 border border-[#66FCF1]/30 text-[#66FCF1] rounded-lg text-sm hover:bg-[#66FCF1]/20 disabled:opacity-60 transition-all"
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-white/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-xs tracking-wider">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Artist Status</th>
              <th className="px-4 py-3 text-left">Albums</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#66FCF1]/30 border-t-[#66FCF1] rounded-full animate-spin" />
                    Loading users...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <FaUser size={32} className="text-white/10" />
                    <p>No users found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u, idx) => {
                const isSelf = String(u._id) === String((userData as any)?._id);
                return (
                  <tr key={u._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-gray-400">
                      {(page - 1) * 25 + idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#66FCF1]/10 border border-[#66FCF1]/20 flex items-center justify-center flex-shrink-0">
                          <FaUser size={12} className="text-[#66FCF1]" />
                        </div>
                        <div>
                          <div>{u?.name || "—"}</div>
                          {u?.username && (
                            <div className="text-xs text-gray-500">@{u.username}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <FaEnvelope size={11} className="text-gray-500" />
                        {u?.email || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge user={u} />
                    </td>
                    <td className="px-4 py-3">
                      <SellerStatus user={u} />
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {u?.accountType === "seller" ? (u?.albumCount ?? 0) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {/*
                        The admin's own row has no bin. Deleting the account
                        you are signed in with locks you out of the panel
                        you're standing in — the server refuses it too, but
                        there is no reason to offer the button at all.
                      */}
                      {isSelf ? (
                        <span className="text-xs text-gray-500 italic">You</span>
                      ) : (
                        <button
                          onClick={() => openDelete(u)}
                          className="flex items-center gap-1.5 bg-white/5 hover:bg-red-600 border border-red-500/40 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                        >
                          <FaTrash size={11} />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-40 hover:bg-white/10 transition-all"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages} · {total} total
          </span>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-40 hover:bg-white/10 transition-all"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmRemoveDialog
        open={!!pendingDelete}
        title={forceDelete ? "Delete them anyway?" : "Delete this account?"}
        itemName={
          pendingDelete
            ? `${pendingDelete.name || "Unnamed"} — ${pendingDelete.email || ""}`
            : undefined
        }
        body="Their account is removed for good and they can no longer sign in. This can't be undone."
        warning={deleteWarning}
        confirmLabel={forceDelete ? "Yes, delete everything" : "Yes, delete this account"}
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

export default AllUsersPage;
