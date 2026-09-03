/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useData } from "@/context/Context";
import { toast } from "sonner";
import { PageLoading } from "@/utils/Loading";
import { FaGift, FaSearch, FaUser, FaBroadcastTower } from "react-icons/fa";

type PayStatus = "pending" | "paid" | "failed";
type RecipientFilter = "" | "artist" | "station";

interface LoveGift {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  amount: number;
  comment: string;
  recipientType: "artist" | "station";
  artist?: { _id: string; name: string; email: string } | null;
  artistName?: string;
  paymentStatus: PayStatus;
  transactionId?: string;
  failureReason?: string;
  createdAt: string;
}

interface ArtistTotal {
  artistId: string;
  artistName: string;
  totalReceived: number;
  giftCount: number;
  lastGiftAt: string;
}

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusStyle: Record<PayStatus, string> = {
  paid: "bg-green-500/15 text-green-300 border-green-400/25",
  pending: "bg-amber-500/15 text-amber-300 border-amber-400/25",
  failed: "bg-red-500/15 text-red-300 border-red-400/25",
};

const LoveGiftsPage = () => {
  const { userData } = useData();
  const token = (userData as any)?.token as string;
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");

  const [gifts, setGifts] = useState<LoveGift[]>([]);
  const [collected, setCollected] = useState(0);
  const [collectedCount, setCollectedCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<"" | PayStatus>("");
  const [recipientType, setRecipientType] = useState<RecipientFilter>("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [byArtist, setByArtist] = useState<ArtistTotal[]>([]);
  const [stationTotal, setStationTotal] = useState({ totalReceived: 0, giftCount: 0 });

  const focusRef = useRef<HTMLTableRowElement | null>(null);

  const fetchGifts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) qs.set("status", status);
      if (recipientType) qs.set("recipientType", recipientType);
      if (search.trim()) qs.set("q", search.trim());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/love-gifts?${qs}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load love gifts");

      setGifts(data.gifts || []);
      setCollected(data.collected ?? 0);
      setCollectedCount(data.collectedCount ?? 0);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to load love gifts", {
        style: { background: "red", color: "white", border: "none" },
      });
    } finally {
      setLoading(false);
    }
  }, [token, page, status, recipientType, search]);

  const fetchByArtist = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/love-gifts/by-artist`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) return;
      setByArtist(data.artists || []);
      setStationTotal(data.station || { totalReceived: 0, giftCount: 0 });
    } catch { /* summary is non-critical */ }
  }, [token]);

  useEffect(() => { fetchGifts(); }, [fetchGifts]);
  useEffect(() => { fetchByArtist(); }, [fetchByArtist]);

  /* Deep link from the notification bell scrolls to the gift in question */
  useEffect(() => {
    if (focusId && focusRef.current) {
      focusRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [focusId, gifts]);

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div className="text-white space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[#66FCF1]">
          <FaGift size={20} />
          <h1 className="text-2xl font-bold">Love Gifts</h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Every gift received through the site. All money is collected into the station account —
          what each artist is paid is decided separately on their payout.
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#071126] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-gray-400">Collected {status || recipientType || search ? "(filtered)" : "(all time)"}</div>
          <div className="text-2xl font-bold text-[#66FCF1] mt-1">{money(collected)}</div>
          <div className="text-xs text-gray-500 mt-0.5">{collectedCount} successful gift{collectedCount === 1 ? "" : "s"}</div>
        </div>
        <div className="bg-[#071126] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-gray-400 flex items-center gap-1.5"><FaUser size={11} /> Designated to artists</div>
          <div className="text-2xl font-bold text-green-300 mt-1">
            {money(byArtist.reduce((s, a) => s + a.totalReceived, 0))}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">across {byArtist.length} artist{byArtist.length === 1 ? "" : "s"}</div>
        </div>
        <div className="bg-[#071126] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-gray-400 flex items-center gap-1.5"><FaBroadcastTower size={11} /> General fund</div>
          <div className="text-2xl font-bold text-white mt-1">{money(stationTotal.totalReceived)}</div>
          <div className="text-xs text-gray-500 mt-0.5">{stationTotal.giftCount} gift{stationTotal.giftCount === 1 ? "" : "s"}</div>
        </div>
      </div>

      {/* Per-artist breakdown */}
      {byArtist.length > 0 && (
        <div className="bg-[#071126] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold">
            Received per artist
          </div>
          <div className="max-h-[220px] overflow-y-auto divide-y divide-white/5">
            {byArtist.map((a) => (
              <button
                key={a.artistId}
                onClick={() => { setRecipientType("artist"); setSearchInput(a.artistName); setSearch(a.artistName); setPage(1); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{a.artistName || "Unnamed artist"}</div>
                  <div className="text-xs text-gray-500">
                    {a.giftCount} gift{a.giftCount === 1 ? "" : "s"}
                    {a.lastGiftAt ? ` · last ${new Date(a.lastGiftAt).toLocaleDateString()}` : ""}
                  </div>
                </div>
                <div className="text-sm font-bold text-green-300 tabular-nums">{money(a.totalReceived)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {([["", "All"], ["paid", "Paid"], ["pending", "Pending"], ["failed", "Failed"]] as const).map(
          ([val, label]) => (
            <button
              key={label}
              onClick={() => { setStatus(val as any); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                status === val
                  ? "bg-[#66FCF1]/15 border-[#66FCF1]/40 text-[#66FCF1]"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          )
        )}

        <span className="w-px h-6 bg-white/10 mx-1" />

        {([["", "Everyone"], ["artist", "For artists"], ["station", "For station"]] as const).map(
          ([val, label]) => (
            <button
              key={label}
              onClick={() => { setRecipientType(val as RecipientFilter); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                recipientType === val
                  ? "bg-[#66FCF1]/15 border-[#66FCF1]/40 text-[#66FCF1]"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          )
        )}

        <form onSubmit={applySearch} className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Donor, artist or transaction ID"
              className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:border-[#66FCF1]/40 w-[240px]"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-[#071126] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Donor</th>
                <th className="py-3 px-4 font-medium">Designated for</th>
                <th className="py-3 px-4 font-medium text-right">Amount</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-14 text-center text-gray-400">Loading love gifts…</td></tr>
              ) : gifts.length === 0 ? (
                <tr><td colSpan={5} className="py-14 text-center text-gray-400">No love gifts found.</td></tr>
              ) : (
                gifts.map((g) => {
                  const isFocused = focusId === g._id;
                  return (
                    <tr
                      key={g._id}
                      ref={isFocused ? focusRef : undefined}
                      className={`border-b border-white/5 transition-colors ${
                        isFocused ? "bg-[#66FCF1]/10 ring-1 ring-inset ring-[#66FCF1]/40" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <td className="py-3 px-4 text-gray-300 whitespace-nowrap">
                        {new Date(g.createdAt).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(g.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{g.firstName} {g.lastName}</div>
                        <div className="text-xs text-gray-500">{g.email}</div>
                        {g.comment && (
                          <div className="text-xs text-gray-400 italic mt-0.5 max-w-[280px] truncate">“{g.comment}”</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {g.recipientType === "artist" ? (
                          <span className="inline-flex items-center gap-1.5 text-green-300">
                            <FaUser size={10} />
                            {g.artist?.name || g.artistName || "Artist removed"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-gray-300">
                            <FaBroadcastTower size={10} />
                            HGC Radio
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums">{money(g.amount)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded border text-xs capitalize ${statusStyle[g.paymentStatus]}`}>
                          {g.paymentStatus}
                        </span>
                        {g.paymentStatus === "failed" && g.failureReason && (
                          <div className="text-xs text-red-300/70 mt-1 max-w-[200px]">{g.failureReason}</div>
                        )}
                        {g.transactionId && (
                          <div className="text-[11px] text-gray-500 mt-1 font-mono">{g.transactionId}</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-40 hover:bg-white/10"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages} · {total} total
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-40 hover:bg-white/10"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

/* useSearchParams (for the ?focus deep link) needs a Suspense boundary */
const LoveGiftsPageWrapper = () => (
  <Suspense fallback={<PageLoading />}>
    <LoveGiftsPage />
  </Suspense>
);

export default LoveGiftsPageWrapper;
