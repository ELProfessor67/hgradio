/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useData } from "@/context/Context";
import { toast } from "sonner";
import { uploadFile } from "@/utils/imageUpload";
import { FaMoneyCheckAlt, FaCheck, FaTimes, FaUpload, FaExternalLinkAlt } from "react-icons/fa";

interface ArtistRow {
  artistId: string;
  artistName: string;
  received: number;
  giftCount: number;
  paid: number;
  pending: number;
  outstanding: number;
}

interface Payout {
  _id: string;
  artist?: { _id: string; name: string; email: string } | null;
  artistName: string;

  amount: number;
  grossAmount?: number;
  serviceFeePercent?: number | null;
  serviceFeeAmount?: number;
  note: string;
  status: "pending" | "paid";
  proofUrl: string;
  paidAt?: string;
  createdAt: string;
}

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PayoutsPage = () => {
  const { userData } = useData();
  const token = (userData as any)?.token as string;

  const [artists, setArtists] = useState<ArtistRow[]>([]);

  const [allArtists, setAllArtists] = useState<{ _id: string; name: string }[]>([]);
  const [totals, setTotals] = useState({ received: 0, paid: 0, pending: 0, outstanding: 0 });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "paid">("");


  const [formArtist, setFormArtist] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");
  const [creating, setCreating] = useState(false);


  const [defaultFee, setDefaultFee] = useState<number | null>(null);
  const [formFee, setFormFee] = useState("");
  // Editable copy of the station default, saved from the card above the form.
  const [feeInput, setFeeInput] = useState("");
  const [feeSaving, setFeeSaving] = useState(false);

  const effectiveFee =
    formFee !== "" && Number.isFinite(Number(formFee)) ? Number(formFee) : defaultFee ?? 0;

  const grossPreview = Number(formAmount) || 0;
  const feePreview = Math.round(((grossPreview * effectiveFee) / 100) * 100) / 100;
  const netPreview = Math.round((grossPreview - feePreview) * 100) / 100;

  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchSummary = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/payouts/summary`,
        { headers: authHeaders }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setArtists(data.artists || []);
      setTotals(data.totals || { received: 0, paid: 0, pending: 0, outstanding: 0 });
    } catch (err: any) {
      toast.error(err.message || "Failed to load summary", {
        style: { background: "red", color: "white", border: "none" },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchPayouts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: "50" });
      if (statusFilter) qs.set("status", statusFilter);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/payouts?${qs}`,
        { headers: authHeaders }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPayouts(data.payouts || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payouts", {
        style: { background: "red", color: "white", border: "none" },
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  const fetchAllArtists = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/love-gift/artists`);
      const data = await res.json();
      if (res.ok) setAllArtists(data.artists || []);
    } catch { /* dropdown falls back to artists with activity */ }
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/settings`, {
          headers: authHeaders,
        });
        const data = await res.json();
        if (res.ok) {
          const pct = Number(data.settings?.serviceFeePercent ?? 0);
          setDefaultFee(pct);
          setFeeInput(String(pct));
        }
      } catch {
      }
    })();
  }, [token]);

  // Save the station-wide default. Separate from the per-payout override in the
  // form below, which never changes this value.
  const saveDefaultFee = async () => {
    const pct = Number(feeInput);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return toast.error("Enter a percentage between 0 and 100", {
        style: { background: "red", color: "white", border: "none" },
      });
    }

    setFeeSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/settings`, {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ serviceFeePercent: pct }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const saved = Number(data.settings?.serviceFeePercent ?? pct);
      setDefaultFee(saved);
      setFeeInput(String(saved));
      toast.success("Service fee saved", {
        style: { background: "green", color: "white", border: "none" },
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save service fee", {
        style: { background: "red", color: "white", border: "none" },
      });
    } finally {
      setFeeSaving(false);
    }
  };

  useEffect(() => { fetchAllArtists(); }, [fetchAllArtists]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const createPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formArtist) return toast.error("Choose an artist");
    const amt = Number(formAmount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");

    setCreating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/payouts`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: formArtist,
          grossAmount: amt,
          ...(formFee !== "" ? { serviceFeePercent: Number(formFee) } : {}),
          note: formNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Payout created", { style: { background: "green", color: "white", border: "none" } });
      setFormArtist(""); setFormAmount(""); setFormNote(""); setFormFee("");
      fetchSummary(); fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || "Failed to create payout", {
        style: { background: "red", color: "white", border: "none" },
      });
    } finally {
      setCreating(false);
    }
  };

  const patchPayout = async (id: string, body: any, successMsg: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/payouts/${id}`, {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(successMsg, { style: { background: "green", color: "white", border: "none" } });
      fetchSummary(); fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || "Update failed", {
        style: { background: "red", color: "white", border: "none" },
      });
    }
  };

  const uploadProof = async (id: string, file: File) => {
    setUploadingFor(id);
    try {
      const url = await uploadFile(file);
      if (!url) throw new Error("Upload failed");
      await patchPayout(id, { proofUrl: url }, "Proof attached");
    } catch (err: any) {
      toast.error(err.message || "Upload failed", {
        style: { background: "red", color: "white", border: "none" },
      });
    } finally {
      setUploadingFor(null);
    }
  };

  const removePayout = async (id: string) => {
    if (!confirm("Remove this pending payout?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/payouts/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Payout removed", { style: { background: "green", color: "white", border: "none" } });
      fetchSummary(); fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove", {
        style: { background: "red", color: "white", border: "none" },
      });
    }
  };

  return (
    <div className="text-white space-y-6">
      <div>
        <div className="flex items-center gap-2 text-[#66FCF1]">
          <FaMoneyCheckAlt size={20} />
          <h1 className="text-2xl font-bold">Artist Payouts</h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Gift money is collected into the station account. You decide what to send each artist —
          nothing here is calculated automatically.
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Gifts received", value: totals.received, cls: "text-[#66FCF1]" },
          { label: "Sent to artists", value: totals.paid, cls: "text-green-300" },
          { label: "Payouts pending", value: totals.pending, cls: "text-amber-300" },
          { label: "Not yet allocated", value: totals.outstanding, cls: "text-white" },
        ].map((c) => (
          <div key={c.label} className="bg-[#071126] border border-white/10 rounded-xl p-4">
            <div className="text-xs text-gray-400">{c.label}</div>
            <div className={`text-2xl font-bold mt-1 tabular-nums ${c.cls}`}>{money(c.value)}</div>
          </div>
        ))}
      </div>

      {/* Create payout */}
      {/* Station-wide service fee. Sits here rather than in Settings because
          this is the only screen where it is actually used. */}
      <div className="bg-[#071126] border border-white/10 rounded-xl p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[240px]">
            <h3 className="font-semibold text-second">Service Fee</h3>
            <p className="text-sm text-gray-400 mt-1">
              What the station keeps from each love gift. Applied automatically to new
              payouts — you can still override it on any single payout below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
                disabled={defaultFee === null}
                placeholder={defaultFee === null ? "…" : "20"}
                aria-label="Station service fee percentage"
                className="w-28 bg-white/5 border border-white/10 rounded-lg pl-3 pr-7 py-2 text-sm outline-none focus:border-[#66FCF1]/40 disabled:opacity-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>

            <button
              type="button"
              onClick={saveDefaultFee}
              disabled={feeSaving || defaultFee === null || feeInput === String(defaultFee)}
              className="bg-[#66FCF1] text-black font-semibold rounded-lg px-4 py-2 text-sm disabled:opacity-40 hover:bg-[#66FCF1]/85 transition"
            >
              {feeSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* The artist's share is the number people actually argue about. */}
        {feeInput !== "" && Number(feeInput) >= 0 && Number(feeInput) <= 100 && (
          <p className="text-sm text-gray-400 mt-3">
            Artist receives{" "}
            <span className="text-[#66FCF1] font-semibold">
              {(100 - Number(feeInput)).toFixed(Number(feeInput) % 1 ? 1 : 0)}%
            </span>{" "}
            of each gift.
            {feeInput !== String(defaultFee) && (
              <span className="text-amber-300"> — unsaved</span>
            )}
          </p>
        )}
      </div>

      <form onSubmit={createPayout} className="bg-[#071126] border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-second">Send a payment</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={formArtist}
            onChange={(e) => setFormArtist(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#66FCF1]/40 md:col-span-2"
          >
            <option value="" className="text-black">
              {allArtists.length ? "Choose an artist…" : "No approved artists yet"}
            </option>
            {allArtists.map((a) => {
              const row = artists.find((r) => String(r.artistId) === String(a._id));
              return (
                <option key={a._id} value={a._id} className="text-black">
                  {a.name}
                  {row && row.outstanding > 0 ? ` — ${money(row.outstanding)} unallocated` : ""}
                </option>
              );
            })}
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            placeholder="Gross amount"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#66FCF1]/40"
          />
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formFee}
            onChange={(e) => setFormFee(e.target.value)}
            placeholder={defaultFee === null ? "Fee %" : `Fee % (${defaultFee})`}
            title="Service fee for this payout. Leave blank to use the station default."
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#66FCF1]/40"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-[#66FCF1] text-black font-semibold rounded-lg px-4 py-2 text-sm disabled:opacity-50 hover:bg-[#66FCF1]/85 transition"
          >
            {creating ? "Creating…" : "Create payout"}
          </button>
        </div>
        {grossPreview > 0 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="text-gray-400">
              Gross <span className="text-white tabular-nums">{money(grossPreview)}</span>
            </span>
            <span className="text-gray-400">
              Fee {effectiveFee}%{" "}
              <span className="text-amber-300 tabular-nums">−{money(feePreview)}</span>
              {formFee !== "" && <span className="text-amber-300/70"> (override)</span>}
            </span>
            <span className="text-gray-400">
              Artist receives{" "}
              <span className="text-[#66FCF1] font-semibold tabular-nums">{money(netPreview)}</span>
            </span>
          </div>
        )}

        <input
          value={formNote}
          onChange={(e) => setFormNote(e.target.value)}
          placeholder="Note for the artist (optional) — shown to them with the payment"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#66FCF1]/40"
        />
      </form>

      {/* Per-artist */}
      {artists.length > 0 && (
        <div className="bg-[#071126] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold">By artist</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="py-2.5 px-4 font-medium">Artist</th>
                  <th className="py-2.5 px-4 font-medium text-right">Gifts received</th>
                  <th className="py-2.5 px-4 font-medium text-right">Sent</th>
                  <th className="py-2.5 px-4 font-medium text-right">Pending</th>
                  <th className="py-2.5 px-4 font-medium text-right">Unallocated</th>
                </tr>
              </thead>
              <tbody>
                {artists.map((a) => (
                  <tr key={a.artistId} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="py-2.5 px-4 font-medium">{a.artistName || "Unnamed"}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-[#66FCF1]">{money(a.received)}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-green-300">{money(a.paid)}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-amber-300">{money(a.pending)}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold">{money(a.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payout list */}
      <div className="flex items-center gap-2">
        {([["", "All"], ["pending", "Pending"], ["paid", "Paid"]] as const).map(([v, label]) => (
          <button
            key={label}
            onClick={() => setStatusFilter(v as any)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all ${statusFilter === v
                ? "bg-[#66FCF1]/15 border-[#66FCF1]/40 text-[#66FCF1]"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-[#071126] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Artist</th>
                <th className="py-3 px-4 font-medium text-right">To artist</th>
                <th className="py-3 px-4 font-medium">Note</th>
                <th className="py-3 px-4 font-medium">Proof</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-14 text-center text-gray-400">Loading payouts…</td></tr>
              ) : payouts.length === 0 ? (
                <tr><td colSpan={6} className="py-14 text-center text-gray-400">No payouts yet.</td></tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p._id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="py-3 px-4 text-gray-300 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{p.artist?.name || p.artistName}</div>
                      <div className="text-xs text-gray-500">{p.artist?.email}</div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <div className="font-bold">{money(p.amount)}</div>
                      {!!p.grossAmount && (
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {money(p.grossAmount)} − {p.serviceFeePercent ?? 0}% fee (
                          {money(p.serviceFeeAmount || 0)})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-400 max-w-[200px]">
                      <div className="truncate">{p.note || "—"}</div>
                    </td>
                    <td className="py-3 px-4">
                      {p.proofUrl ? (
                        <a
                          href={p.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#66FCF1] hover:underline"
                        >
                          <FaExternalLinkAlt size={10} /> View
                        </a>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white cursor-pointer">
                          <FaUpload size={10} />
                          {uploadingFor === p._id ? "Uploading…" : "Attach"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingFor === p._id}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadProof(p._id, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {p.status === "paid" ? (
                        <span className="inline-block px-2 py-1 rounded border text-xs bg-green-500/15 text-green-300 border-green-400/25">
                          Paid{p.paidAt ? ` · ${new Date(p.paidAt).toLocaleDateString()}` : ""}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => patchPayout(p._id, { status: "paid" }, "Marked paid — the artist has been notified")}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-green-500/15 border border-green-400/30 text-green-300 hover:bg-green-500/25 transition"
                          >
                            <FaCheck size={9} /> Mark paid
                          </button>
                          <button
                            onClick={() => removePayout(p._id)}
                            className="text-gray-500 hover:text-red-400 transition"
                            aria-label="Remove payout"
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayoutsPage;
