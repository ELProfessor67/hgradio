/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useData } from "@/context/Context";
import { toast } from "sonner";
import { PageLoading } from "@/utils/Loading";
import { IoClose } from "react-icons/io5";
import { FaCheckCircle, FaTimesCircle, FaUser, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

type SellerApprovalStatus = "pending" | "approved" | "rejected";

/* ─── Inline value display ──────────────────────────────────────── */
const Val = ({ value }: { value?: any }) => {
  const display =
    value === undefined || value === null || value === ""
      ? <span className="italic text-gray-500">—</span>
      : <span className="text-white font-medium">{String(value)}</span>;
  return <>{display}</>;
};

/* ─── Section wrapper ───────────────────────────────────────────── */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4 border-b border-white/10 pb-6 mb-6 last:border-0 last:mb-0">
    <h3 className="text-base font-bold text-[#66FCF1] uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

/* ─── Form row: label + value ───────────────────────────────────── */
const FormRow = ({ label, value, full }: { label: string; value?: any; full?: boolean }) => (
  <div className={`${full ? "col-span-2" : "col-span-1"} flex flex-col gap-0.5`}>
    <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
    <div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm min-h-[36px] flex items-center">
      <Val value={value} />
    </div>
  </div>
);

/* ─── Initial badge ─────────────────────────────────────────────── */
const InitialBadge = ({ value }: { value?: string }) => (
  <div className="flex items-center gap-3 mt-1">
    <span className="text-xs text-gray-400">Initial:</span>
    <div className="bg-[#66FCF1]/10 border border-[#66FCF1]/30 rounded px-4 py-1.5 text-sm text-white font-medium min-w-[120px]">
      {value || <span className="italic text-gray-500">—</span>}
    </div>
  </div>
);

/* ─── Status badge ──────────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    pending: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
    approved: "bg-green-400/15 text-green-300 border-green-400/30",
    rejected: "bg-red-400/15 text-red-300 border-red-400/30",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${map[status] || "bg-white/10 text-white border-white/10"}`}>
      {status}
    </span>
  );
};

/* ─── Agreement Section (read-only view) ───────────────────────── */
const AgreementSectionView = ({
  num, title, body, bullets, footer,
}: {
  num: string; title: string; body?: string | null; bullets?: string[]; footer?: string;
}) => (
  <div className="space-y-3 border-b border-gray-700 pb-7 mb-6">
    <h3 className="text-lg font-bold text-[#66FCF1]">{num}. {title}</h3>
    {body && <p className="text-gray-300 text-sm">{body}</p>}
    {bullets && (
      <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2 text-sm">
        {bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    )}
    {footer && <p className="text-gray-400 text-xs mt-1">{footer}</p>}
  </div>
);

const SellerFormModal = ({
  user,
  onClose,
  onApprove,
  onReject,
  actionLoading,
}: {
  user: any;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  actionLoading: boolean;
}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleReject = () => {
    if (!showRejectInput) { setShowRejectInput(true); return; }
    if (!rejectReason.trim()) {
      toast.error("Reason is required", { style: { background: "red", border: "none", color: "white" } });
      return;
    }
    onReject(rejectReason.trim());
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-start justify-center px-3 py-6 overflow-y-auto">
      <div className="w-full max-w-[900px] bg-[#071126] border border-white/10 rounded-xl shadow-2xl text-white">

        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-10 bg-[#071126]/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <p className="text-lg font-bold text-[#66FCF1]">Artist Registration — View Form</p>
            <p className="text-sm text-gray-400">{user?.name} — {user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={user?.sellerApprovalStatus || "pending"} />
            <button onClick={onClose} className="text-white/50 hover:text-white transition-all">
              <IoClose size={22} />
            </button>
          </div>
        </div>

        {/* ── Approve / Reject action bar at top ── */}
        <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-end gap-3">
          {showRejectInput && (
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Reason for Disapproval (will be emailed)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason..."
                rows={2}
                className="w-full bg-[#0b1834] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-400/50 transition-all resize-none"
              />
            </div>
          )}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleReject}
              disabled={actionLoading || user?.sellerApprovalStatus === "rejected"}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg border border-red-500 text-red-300 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              <FaTimesCircle size={13} />
              {actionLoading && showRejectInput ? "Processing..." : showRejectInput ? "Confirm Disapprove" : "Disapprove"}
            </button>
            <button
              onClick={onApprove}
              disabled={actionLoading || user?.sellerApprovalStatus === "approved"}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium text-white"
            >
              <FaCheckCircle size={13} />
              {actionLoading && !showRejectInput ? "Processing..." : "Approve"}
            </button>
          </div>
        </div>

        <div className="px-6 py-8">

          {/* Account Info */}
          <Section title="Account Information">
            <div className="grid grid-cols-2 gap-3">
              <FormRow label="Full Name" value={user?.name} />
              <FormRow label="Email" value={user?.email} />
              <FormRow label="City" value={user?.city} />
              <FormRow label="State" value={user?.state} />
              <FormRow label="Country" value={user?.country} />
              <FormRow label="Zip Code" value={user?.zipCode} />
              <FormRow label="Registered On" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"} />
              <FormRow label="Approval Status" value={user?.sellerApprovalStatus} />
            </div>
            {user?.sellerApprovalStatus === "rejected" && user?.sellerApprovalReason && (
              <div className="mt-3 bg-red-500/10 border border-red-400/20 rounded-lg p-3">
                <p className="text-xs text-red-300 uppercase tracking-wide mb-1">Rejection Reason</p>
                <p className="text-sm text-gray-200">{user.sellerApprovalReason}</p>
              </div>
            )}
          </Section>

          {/* Agreement Title */}
          <div className="text-center py-6 border-b border-gray-700 mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#66FCF1] uppercase tracking-wide">
              HGC RADIO &ndash; DIGITAL DISTRIBUTION &amp; ARTIST AGREEMENT
            </h2>
            <div className="w-full border-t border-gray-600 mt-4" />
          </div>

          {/* Preamble */}
          <div className="bg-[#0B1834] border border-white/10 rounded-lg p-5 space-y-3 text-gray-300 mb-8">
            <p className="text-sm">
              This Digital Distribution &amp; Artist Agreement is entered into by and between{" "}
              <span className="text-white font-semibold">Hallelujah Gospel Globally (HGC Radio)</span>{" "}
              (&ldquo;Company&rdquo;) and the registering artist (&ldquo;Artist&rdquo;), effective as of the date of submission.
            </p>
            <p className="text-[#66FCF1] font-medium text-sm">
              By submitting content or registering, Artist agrees to be bound by the terms of this Agreement.
            </p>
          </div>

          {/* Sections 1–4 */}
          {[
            { num: "1", title: "PURPOSE", body: "Company operates a faith-based digital music distribution, internet radio, and promotional platform. This Agreement governs the distribution, promotion, monetization, and related use of Artist's content for both ministry and commercial purposes." },
            { num: "2", title: "NON-EXCLUSIVITY", body: "This Agreement is non-exclusive. Artist retains full ownership of their content and may distribute, license, or exploit it through other platforms or parties at their sole discretion." },
            { num: "3", title: "REPRESENTATIONS & WARRANTIES", body: "Artist represents and warrants that:", bullets: ["Artist owns or controls 100% of all necessary rights, including master and composition rights (or has secured proper licenses).", "All content submitted is original or properly licensed.", "No content infringes upon any copyright, trademark, or third-party rights.", "All collaborators, producers, and contributors have been properly credited and compensated where required."], footer: "Artist agrees to provide documentation upon request." },
            { num: "4", title: "LICENSE GRANT", body: "Artist grants Company a worldwide, non-exclusive, royalty-bearing license to:", bullets: ["Distribute, stream, reproduce, and publicly perform the content", "Promote, market, and advertise the content", "Sub-license content to third-party platforms (e.g., DSPs, streaming services)", "Use Artist's name, likeness, image, biography, and branding for promotional purposes"], footer: "This license remains in effect during the Term of this Agreement." },
          ].map((s) => <AgreementSectionView key={s.num} {...s} />)}

          {/* Section 5 Revenue Share */}
          <div className="space-y-4 border-b border-gray-700 pb-7 mb-6">
            <h3 className="text-lg font-bold text-[#66FCF1]">5. REVENUE SHARE</h3>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">5.1 Definitions</h4>
              <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2 text-sm">
                <li><strong>Gross Revenue:</strong> All income derived from exploitation of Artist&apos;s content.</li>
                <li><strong>Net Revenue:</strong> Gross Revenue minus third-party fees, commissions, platform costs, taxes, refunds, and chargebacks.</li>
                <li><strong>Net Profit (Merchandise):</strong> Merchandise revenue minus production, manufacturing, shipping, transaction fees, taxes, returns, and related costs.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">5.2 Music Distribution Revenue</h4>
              <p className="text-gray-300 text-sm">Artist shall receive <span className="text-[#66FCF1] font-bold">60%&ndash;70%</span> of Net Revenue generated from streaming, downloads, and licensing.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">5.3 Merchandise Revenue (Optional)</h4>
              <p className="text-gray-300 text-sm">Artist receives <span className="text-[#66FCF1] font-bold">35%</span> &middot; HGC Radio receives <span className="text-[#66FCF1] font-bold">65%</span> of Net Profit.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">5.4 Accounting &amp; Payments</h4>
              <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2 text-sm">
                <li>Payments issued bi-annually (June 30 and December 31)</li>
                <li>Minimum payout threshold: $100 USD</li>
                <li>Balances below threshold carried forward</li>
                <li>Statements available upon request</li>
              </ul>
            </div>
          </div>

          {/* Sections 6–14 */}
          {[
            { num: "6", title: "PROMOTION & BROADCAST RIGHTS", body: "Artist grants Company the right to broadcast content on radio, playlists, and digital channels and use content for promotional campaigns. No additional royalties shall be owed beyond the revenue share unless otherwise agreed in writing." },
            { num: "7", title: "CONTENT STANDARDS & REMOVAL", body: "Company reserves the right to reject, remove, or suspend any content that violates platform policies, conflicts with faith-based values, or breaches legal or copyright regulations. Company may act without prior notice where necessary." },
            { num: "8", title: "TERM & TERMINATION", bullets: ["This Agreement remains in effect until terminated by either party", "Either party may terminate with 30 days written notice", "Content removal may take up to 90 days due to third-party platform processing", "Sections relating to payments, liability, and legal obligations shall survive termination."] },
            { num: "9", title: "PAYMENTS & TAXES", body: "Artist is responsible for all applicable taxes. Company may require tax documentation prior to payment. Payments may be withheld in cases of fraud, dispute, or policy violations." },
            { num: "10", title: "LIABILITY & INDEMNIFICATION", body: "Artist agrees to indemnify, defend, and hold harmless Company, its affiliates, officers, and partners from any claims, damages, liabilities, or legal disputes arising from breach of this Agreement, copyright infringement, or unauthorized use of third-party content. Company shall not be liable for indirect, incidental, or consequential damages." },
            { num: "11", title: "LIMITATION OF LIABILITY", body: "To the maximum extent permitted by law, Company's total liability shall not exceed the total amount paid to Artist under this Agreement in the preceding 12 months." },
            { num: "12", title: "GOVERNING LAW & DISPUTES", body: "This Agreement shall be governed by the laws of the State of California, USA. Any disputes shall be resolved in the courts of Contra Costa County, California, unless otherwise agreed." },
            { num: "13", title: "DIGITAL CONSENT & SIGNATURE", body: "By submitting this Agreement electronically, Artist:", bullets: ["Agrees this constitutes a legally binding electronic signature", "Confirms acceptance of all terms", "Acknowledges that digital submission is enforceable under applicable electronic signature laws"] },
            { num: "14", title: "ENTIRE AGREEMENT", body: "This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements or communications. Any amendments must be made in writing and agreed by both parties." },
          ].map((s) => <AgreementSectionView key={s.num} {...s} />)}

          {/* Artist Confirmation — read-only */}
          <div className="bg-[#0B1834] border border-[#66FCF1]/30 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-bold text-[#66FCF1] uppercase">Artist Confirmation</h3>

            {/* Checkboxes — confirmed since user submitted */}
            <div className="space-y-3">
              {[
                "I have read and agree to this Agreement",
                "I confirm all information provided is accurate",
                "I confirm I own or control all rights to submitted content",
              ].map((label, i) => (
                <div key={i} className="flex items-start gap-3 text-gray-200 text-sm">
                  <div className="mt-0.5 w-4 h-4 bg-[#66FCF1]/20 border border-[#66FCF1]/50 rounded flex items-center justify-center flex-shrink-0">
                    <FaCheckCircle size={10} className="text-[#66FCF1]" />
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Name / Signature fields — styled like the form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Full Name</span>
                <div className="w-full py-2 px-4 bg-[#222F46] border-b-2 border-[#445d88] text-white text-sm min-h-[38px] flex items-center">
                  {user?.digitalDistributionArtistName || <span className="italic text-gray-500">&mdash;</span>}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Stage Name (Optional)</span>
                <div className="w-full py-2 px-4 bg-[#222F46] border-b-2 border-[#445d88] text-white text-sm min-h-[38px] flex items-center">
                  {user?.stageName || <span className="italic text-gray-500">&mdash;</span>}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Signature (Typed Name)</span>
                <div className="w-full py-2 px-4 bg-[#222F46] border-b-2 border-[#445d88] text-white text-sm min-h-[38px] flex items-center italic font-medium">
                  {user?.digitalDistributionArtistSignature || user?.digitalDistributionSummarySignature || <span className="not-italic font-normal text-gray-500">&mdash;</span>}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Date</span>
                <div className="w-full py-2 px-4 bg-[#1a2540] border-b-2 border-[#445d88] text-gray-400 text-sm min-h-[38px] flex items-center">
                  {user?.digitalDistributionArtistDate
                    ? new Date(user.digitalDistributionArtistDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                    : user?.digitalDistributionSummaryDate
                    ? new Date(user.digitalDistributionSummaryDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                    : "—"}
                </div>
              </div>
            </div>

            {/* Drawn signature from Cloudinary */}
            <div className="space-y-2">
              <span className="text-gray-400 text-xs uppercase tracking-wide block">Drawn Signature</span>
              {user?.artistSignatureUrl ? (
                <div className="border border-white/20 rounded overflow-hidden bg-[#111827]">
                  <img src={user.artistSignatureUrl} alt="Artist Signature" className="w-full max-h-[180px] object-contain" />
                </div>
              ) : (
                <div className="border border-white/10 rounded bg-[#111827] h-[80px] flex items-center justify-center text-gray-500 text-sm italic">
                  No drawn signature provided
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Sticky bottom action bar ── */}
        <div className="sticky bottom-0 bg-[#071126]/95 backdrop-blur border-t border-white/10 px-6 py-4 rounded-b-xl flex flex-col sm:flex-row sm:items-end gap-3">
          {showRejectInput && (
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Reason for Disapproval</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason..."
                rows={2}
                className="w-full bg-[#0b1834] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-400/50 transition-all resize-none"
              />
            </div>
          )}
          <div className="flex gap-2 flex-shrink-0 ml-auto">
            <button
              onClick={handleReject}
              disabled={actionLoading || user?.sellerApprovalStatus === "rejected"}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg border border-red-500 text-red-300 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
            >
              <FaTimesCircle size={13} />
              {actionLoading && showRejectInput ? "Processing..." : showRejectInput ? "Confirm Disapprove" : "Disapprove"}
            </button>
            <button
              onClick={onApprove}
              disabled={actionLoading || user?.sellerApprovalStatus === "approved"}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium text-white"
            >
              <FaCheckCircle size={13} />
              {actionLoading && !showRejectInput ? "Processing..." : "Approve"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────── */
const Page = () => {
  const { userData } = useData();

  const [hasMounted, setHasMounted] = useState(false);
  const [status, setStatus] = useState<SellerApprovalStatus>("pending");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const focusedRef = useRef<string | null>(null);

  useEffect(() => { setHasMounted(true); }, []);

  const canFetch = useMemo(() => {
    return Boolean(userData?.token && userData?.role === "Admin");
  }, [userData?.token, userData?.role]);

  const fetchRequests = async () => {
    if (!canFetch) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("status", status);
      if (q.trim()) qs.set("q", q.trim());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/seller-requests?${qs.toString()}`,
        { headers: { Authorization: `Bearer ${userData.token}` } }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to load users", { style: { background: "red", border: "none", color: "white" } });
        return;
      }
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load users", { style: { background: "red", border: "none", color: "white" } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canFetch) fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, status]);

  /* Deep link from an admin notification: ?focus=<userId> opens that seller's
     contract modal directly, whatever status tab is currently selected. */
  useEffect(() => {
    const focusId = searchParams.get("focus");
    if (!canFetch || !focusId || focusedRef.current === focusId) return;
    focusedRef.current = focusId;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/seller-requests/${focusId}`,
          { headers: { Authorization: `Bearer ${userData.token}` } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Seller not found");
        setSelected(data.user);
      } catch (err: any) {
        toast.error(err?.message || "Could not open that request", {
          style: { background: "red", border: "none", color: "white" },
        });
      } finally {
        // drop the param so closing the modal does not reopen it
        router.replace(pathname);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, searchParams, router, pathname]);

  const approve = async (userId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/seller-requests/${userId}/approve`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${userData.token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to approve", { style: { background: "red", border: "none", color: "white" } });
        return;
      }
      toast.success("Seller approved. Email sent.", { style: { background: "green", border: "none", color: "white" } });
      setSelected(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve", { style: { background: "red", border: "none", color: "white" } });
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async (userId: string, reason: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/seller-requests/${userId}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${userData.token}` },
          body: JSON.stringify({ reason }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to disapprove", { style: { background: "red", border: "none", color: "white" } });
        return;
      }
      toast.success("Seller disapproved. Email sent.", { style: { background: "green", border: "none", color: "white" } });
      setSelected(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.message || "Failed to disapprove", { style: { background: "red", border: "none", color: "white" } });
    } finally {
      setActionLoading(false);
    }
  };

  if (!hasMounted) return <PageLoading />;

  const tabs: SellerApprovalStatus[] = ["pending", "approved", "rejected"];
  const tabColors: Record<SellerApprovalStatus, string> = {
    pending: "bg-yellow-400/15 border-yellow-400/50 text-yellow-300",
    approved: "bg-green-400/15 border-green-400/50 text-green-300",
    rejected: "bg-red-400/15 border-red-400/50 text-red-300",
  };

  return (
    <div className="text-white min-h-screen">
      {/* ── Page header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#66FCF1]">Users Approval</h1>
          <p className="text-sm text-gray-400 mt-0.5">Review seller contract forms and approve or disapprove applications.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          {/* Status tabs */}
          <div className="flex gap-2">
            {tabs.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${
                  status === s
                    ? tabColors[s]
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
              placeholder="Search name / email"
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg outline-none text-white text-sm placeholder-gray-500 focus:border-[#66FCF1]/40 transition-all"
            />
            <button
              onClick={fetchRequests}
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
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Registered</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#66FCF1]/30 border-t-[#66FCF1] rounded-full animate-spin" />
                    Loading users...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <FaUser size={32} className="text-white/10" />
                    <p>No users found for this status.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u, idx) => (
                <tr key={u._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#66FCF1]/10 border border-[#66FCF1]/20 flex items-center justify-center flex-shrink-0">
                        <FaUser size={12} className="text-[#66FCF1]" />
                      </div>
                      {u?.name || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <FaEnvelope size={11} className="text-gray-500" />
                      {u?.email || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u?.sellerApprovalStatus || "pending"} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(u)}
                      className="flex items-center gap-1.5 bg-[#66FCF1]/10 hover:bg-[#66FCF1]/20 border border-[#66FCF1]/30 text-[#66FCF1] text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    >
                      View Form
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal ── */}
      {selected && (
        <SellerFormModal
          user={selected}
          onClose={() => setSelected(null)}
          onApprove={() => approve(selected._id)}
          onReject={(reason) => reject(selected._id, reason)}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

/* useSearchParams (for the ?focus deep link) needs a Suspense boundary */
const PageWrapper = () => (
  <Suspense fallback={<PageLoading />}>
    <Page />
  </Suspense>
);

export default PageWrapper;