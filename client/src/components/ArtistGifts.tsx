/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useData } from "@/context/Context";
import { FaGift, FaExternalLinkAlt } from "react-icons/fa";

/* No amount — the API deliberately does not send gift values to the artist. */
interface Gift {
  _id: string;
  firstName: string;
  lastName: string;
  comment: string;
  paidAt: string;
  createdAt: string;
}

interface Payout {
  _id: string;
  amount: number;
  note: string;
  status: "pending" | "paid";
  proofUrl: string;
  paidAt?: string;
  createdAt: string;
}

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const when = (d: string) => (d ? new Date(d).toLocaleDateString() : "");

/*
  The artist's view of love gifts.

  Gift *values* are never shown here, and the API does not send them. HGC Radio
  collects gift money centrally and decides each payout by hand, so showing the
  artist what a donor gave would advertise a figure that may not match what they
  are paid. They see who supported them and what was said; amounts appear only
  against payments actually sent.
*/
const ArtistGifts = () => {
  const { userData } = useData();
  const token = (userData as any)?.token as string;

  const [gifts, setGifts] = useState<Gift[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [totals, setTotals] = useState({
    giftCount: 0,
    paidOut: 0,
    payoutPending: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const giftRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/my-gifts`,
        { headers }
      );

      if (giftRes.ok) {
        const d = await giftRes.json();
        setGifts(d.gifts || []);
        setPayouts(d.payouts || []);
        setTotals(d.totals || totals);
      }
    } catch {
      /* leave the section empty rather than breaking the dashboard */
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return null;

  // Nothing to show yet for an artist who has never received a gift
  if (!gifts.length && !payouts.length) return null;

  return (
    <div className="mt-[3rem] space-y-5 text-white">

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-white/10 bg-[#0b1834] p-4">
          <div className="text-xs text-gray-300">Gifts given in your name</div>
          <div className="text-2xl font-bold text-second mt-1 tabular-nums">{totals.giftCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            from {totals.giftCount === 1 ? "1 supporter" : `${totals.giftCount} supporters`}
          </div>
        </div>
        <div className="border border-white/10 bg-[#0b1834] p-4">
          <div className="text-xs text-gray-300">Paid to you</div>
          <div className="text-2xl font-bold text-green-300 mt-1 tabular-nums">{money(totals.paidOut)}</div>
        </div>
        <div className="border border-white/10 bg-[#0b1834] p-4">
          <div className="text-xs text-gray-300">Payment on the way</div>
          <div className="text-2xl font-bold text-amber-300 mt-1 tabular-nums">{money(totals.payoutPending)}</div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Love Gifts are received and held by HGC Radio, who send your payments separately.
        Everything paid to you is listed below.
      </p>

      {/* Payments */}
      {payouts.length > 0 && (
        <div className="border border-white/10 bg-[#0b1834]">
          <div className="px-4 py-3 border-b border-white/10 font-semibold">Payments from HGC Radio</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-gray-300 border-b border-white/10">
                  <th className="py-2 px-4 font-medium">Date</th>
                  <th className="py-2 px-4 font-medium text-right">Amount</th>
                  <th className="py-2 px-4 font-medium">Note</th>
                  <th className="py-2 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p._id} className="border-b border-white/5">
                    <td className="py-2 px-4 text-gray-300">{when(p.paidAt || p.createdAt)}</td>
                    <td className="py-2 px-4 text-right font-bold tabular-nums">{money(p.amount)}</td>
                    <td className="py-2 px-4 text-gray-400">{p.note || "—"}</td>
                    <td className="py-2 px-4">
                      {p.status === "paid" ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2 py-1 border text-xs bg-green-600/20 text-green-200 border-green-400/20">
                            Paid
                          </span>
                          {p.proofUrl && (
                            <a
                              href={p.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-second hover:underline"
                            >
                              <FaExternalLinkAlt size={9} /> Receipt
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-1 border text-xs bg-yellow-600/20 text-yellow-200 border-yellow-400/20">
                          Processing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gifts */}
      {gifts.length > 0 && (
        <div className="border border-white/10 bg-[#0b1834]">
          <div className="px-4 py-3 border-b border-white/10 font-semibold flex items-center gap-2">
            <FaGift className="text-second" size={13} /> Gifts given in your name
          </div>
          <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
            {gifts.map((g) => (
              <div key={g._id} className="px-4 py-3">
                <div className="text-sm font-medium">
                  {g.firstName} {g.lastName}
                </div>
                {g.comment && (
                  <p className="text-xs text-gray-400 italic mt-0.5">&ldquo;{g.comment}&rdquo;</p>
                )}
                <p className="text-[10px] text-gray-600 mt-0.5">{when(g.paidAt || g.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistGifts;
