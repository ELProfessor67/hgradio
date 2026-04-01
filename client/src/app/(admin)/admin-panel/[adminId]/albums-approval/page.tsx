"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useData } from "@/context/Context";
import { toast } from "sonner";
import { FaCheckCircle, FaTimesCircle, FaEye, FaMusic, FaSearch, FaClock } from "react-icons/fa";
import { MdOutlineLibraryMusic } from "react-icons/md";
import { IoClose } from "react-icons/io5";

/* ─── Types ─────────────────────────────────────────────────── */
type ApprovalStatus = "pending" | "approved" | "rejected";

interface Song {
  _id: string;
  name: string;
  duration: number;
  url: string;
}

interface Artist {
  _id: string;
  name: string;
  email: string;
}

interface Album {
  _id: string;
  title: string;
  description: string;
  coverImg: string;
  price: number;
  releaseYear: number;
  approvalStatus: ApprovalStatus;
  approvalReason?: string;
  songs: Song[];
  artist: Artist;
  createdAt: string;
}

/* ─── Status badge ───────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: ApprovalStatus }) => {
  const map = {
    pending: "bg-yellow-400/15 text-yellow-300 border border-yellow-400/30",
    approved: "bg-green-400/15 text-green-300 border border-green-400/30",
    rejected: "bg-red-400/15 text-red-300 border border-red-400/30",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status]}`}>
      {status}
    </span>
  );
};

/* ─── Duration formatter ─────────────────────────────────────── */
const fmtDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

/* ─── Album Preview Modal ─────────────────────────────────────── */
const AlbumModal = ({
  album,
  token,
  onClose,
  onStatusChange,
}: {
  album: Album;
  token: string;
  onClose: () => void;
  onStatusChange: (id: string, status: ApprovalStatus) => void;
}) => {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const playingRef = useRef<HTMLAudioElement | null>(null);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  const togglePlay = (idx: number, url: string) => {
    if (playingIdx === idx) {
      playingRef.current?.pause();
      setPlayingIdx(null);
      return;
    }
    if (playingRef.current) playingRef.current.pause();
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => setPlayingIdx(null);
    playingRef.current = audio;
    setPlayingIdx(idx);
  };

  useEffect(() => {
    return () => playingRef.current?.pause();
  }, []);

  const handleApprove = async () => {
    setLoading("approve");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/albums/${album._id}/approve`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve");
      toast.success("Album approved!", { style: { background: "green", color: "white", border: "none" } });
      onStatusChange(album._id, "approved");
      onClose();
    } catch (err: any) {
      toast.error(err.message, { style: { background: "red", color: "white", border: "none" } });
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectInput) { setShowRejectInput(true); return; }
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection.", { style: { background: "red", color: "white", border: "none" } });
      return;
    }
    setLoading("reject");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/albums/${album._id}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reason: rejectReason.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject");
      toast.success("Album rejected.", { style: { background: "green", color: "white", border: "none" } });
      onStatusChange(album._id, "rejected");
      onClose();
    } catch (err: any) {
      toast.error(err.message, { style: { background: "red", color: "white", border: "none" } });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-3 py-6">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#071126] to-[#0b1834] border border-white/10 rounded-xl shadow-2xl text-white">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#071126]/95 backdrop-blur border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2 text-[#66FCF1]">
            <MdOutlineLibraryMusic size={20} />
            <span className="font-semibold text-lg">Album Preview</span>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-all">
            <IoClose size={22} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Cover + info */}
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="relative w-full sm:w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden border border-white/10">
              {album.coverImg ? (
                <Image src={album.coverImg} alt={album.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <FaMusic size={40} className="text-white/20" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Title</p>
                <p className="text-xl font-bold">{album.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Artist</p>
                  <p className="text-sm font-medium">{album.artist?.name || "—"}</p>
                  <p className="text-xs text-gray-400">{album.artist?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Tracks</p>
                  <p className="text-sm font-medium">{album.songs?.length ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Year</p>
                  <p className="text-sm font-medium">{album.releaseYear}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Price</p>
                  <p className="text-sm font-medium">${Number(album.price).toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Status</p>
                  <div className="mt-1"><StatusBadge status={album.approvalStatus} /></div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {album.description && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Description</p>
              <p className="text-sm text-gray-200 leading-relaxed">{album.description}</p>
            </div>
          )}

          {/* Separator */}
          <div className="border-t border-white/10" />

          {/* Songs */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">▶ Play Sample</p>
            {album.songs && album.songs.length > 0 ? (
              <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {album.songs.map((song, idx) => (
                  <li key={song._id || idx} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-all rounded-lg px-3 py-2">
                    <button
                      type="button"
                      onClick={() => togglePlay(idx, song.url)}
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${playingIdx === idx ? "bg-[#66FCF1] text-black" : "bg-white/10 text-white hover:bg-[#66FCF1]/20"}`}
                    >
                      {playingIdx === idx ? "⏸" : "▶"}
                    </button>
                    <span className="flex-1 text-sm truncate">{song.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{fmtDuration(song.duration)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No tracks uploaded.</p>
            )}
          </div>

          {/* Reject reason input */}
          {showRejectInput && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Reason for Rejection</p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason..."
                className="w-full bg-[#0b1834] border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-red-400/60 transition-all resize-none"
              />
            </div>
          )}

          {/* Rejection reason display */}
          {album.approvalStatus === "rejected" && album.approvalReason && (
            <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-3">
              <p className="text-xs text-red-300 uppercase tracking-widest mb-1">Rejection Reason</p>
              <p className="text-sm text-gray-200">{album.approvalReason}</p>
            </div>
          )}

          {/* Separator */}
          <div className="border-t border-white/10" />

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleApprove}
              disabled={loading !== null || album.approvalStatus === "approved"}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-lg transition-all"
            >
              <FaCheckCircle size={16} />
              {loading === "approve" ? "Approving..." : "Approve"}
            </button>
            <button
              onClick={handleReject}
              disabled={loading !== null || album.approvalStatus === "rejected"}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-lg transition-all"
            >
              <FaTimesCircle size={16} />
              {loading === "reject" ? "Rejecting..." : showRejectInput ? "Confirm Reject" : "Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────────── */
const AlbumsApprovalPage = () => {
  const { userData } = useData();
  const token = (userData as any)?.token as string;

  const [albums, setAlbums] = useState<Album[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<"all" | ApprovalStatus>("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  const fetchAlbums = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/albums?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch");
      setAlbums(data.albums || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      toast.error(err.message, { style: { background: "red", color: "white", border: "none" } });
    } finally {
      setLoading(false);
    }
  }, [token, page, filterStatus, search]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleStatusChange = (id: string, newStatus: ApprovalStatus) => {
    setAlbums((prev) =>
      prev.map((a) => (a._id === id ? { ...a, approvalStatus: newStatus } : a))
    );
  };

  const tabs: { label: string; value: "all" | ApprovalStatus; icon: React.ReactNode }[] = [
    { label: "All", value: "all", icon: <MdOutlineLibraryMusic /> },
    { label: "Pending", value: "pending", icon: <FaClock /> },
    { label: "Approved", value: "approved", icon: <FaCheckCircle /> },
    { label: "Rejected", value: "rejected", icon: <FaTimesCircle /> },
  ];

  return (
    <div className="min-h-screen bg-[#060f24] text-white px-4 py-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#66FCF1]">Albums Approval</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Review and approve or reject album submissions from artists.
            </p>
          </div>
          <div className="text-sm text-gray-400 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
            Total:&nbsp;<span className="text-white font-semibold">{total}</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setFilterStatus(tab.value); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                filterStatus === tab.value
                  ? "bg-[#66FCF1]/15 border-[#66FCF1]/50 text-[#66FCF1]"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by album title..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#66FCF1]/40 transition-all"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-xs tracking-wider">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Cover</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Artist</th>
                <th className="px-4 py-3 text-left">Tracks</th>
                <th className="px-4 py-3 text-left">Year</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-[#66FCF1]/30 border-t-[#66FCF1] rounded-full animate-spin" />
                      Loading albums...
                    </div>
                  </td>
                </tr>
              ) : albums.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <MdOutlineLibraryMusic size={40} className="text-white/10" />
                      <p>No albums found for the selected filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                albums.map((album, idx) => (
                  <tr
                    key={album._id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400">{(page - 1) * 15 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="relative w-10 h-10 rounded-md overflow-hidden border border-white/10 flex-shrink-0">
                        {album.coverImg ? (
                          <Image src={album.coverImg} alt={album.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <FaMusic size={14} className="text-white/30" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[140px] truncate">{album.title}</td>
                    <td className="px-4 py-3 text-gray-300 max-w-[130px]">
                      <div className="truncate">{album.artist?.name || "—"}</div>
                      <div className="text-xs text-gray-500 truncate">{album.artist?.email || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{album.songs?.length ?? 0}</td>
                    <td className="px-4 py-3 text-gray-300">{album.releaseYear}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={album.approvalStatus} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(album.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedAlbum(album)}
                        className="flex items-center gap-1.5 bg-[#66FCF1]/10 hover:bg-[#66FCF1]/20 border border-[#66FCF1]/30 text-[#66FCF1] text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                      >
                        <FaEye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-40 hover:bg-white/10 transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </span>
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

      {/* Modal */}
      {selectedAlbum && (
        <AlbumModal
          album={selectedAlbum}
          token={token}
          onClose={() => setSelectedAlbum(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default AlbumsApprovalPage;
