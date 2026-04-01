/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
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

/* ─── Full Contract Popup ───────────────────────────────────────── */
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
            <p className="text-lg font-bold text-[#66FCF1]">Seller Application Form</p>
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

        <div className="px-6 py-6 space-y-0">

          {/* ── ACCOUNT INFO ── */}
          <Section title="Account Information">
            <div className="grid grid-cols-2 gap-3">
              <FormRow label="Full Name" value={user?.name} />
              <FormRow label="Email" value={user?.email} />
              <FormRow label="Account Type" value={user?.accountType} />
              <FormRow label="Approval Status" value={user?.sellerApprovalStatus} />
              <FormRow label="City" value={user?.city} />
              <FormRow label="State" value={user?.state} />
              <FormRow label="Country" value={user?.country} />
              <FormRow label="Zip Code" value={user?.zipCode} />
              <FormRow label="Registered On" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"} />
            </div>
            {user?.sellerApprovalStatus === "rejected" && user?.sellerApprovalReason && (
              <div className="mt-3 bg-red-500/10 border border-red-400/20 rounded-lg p-3">
                <p className="text-xs text-red-300 uppercase tracking-wide mb-1">Rejection Reason</p>
                <p className="text-sm text-gray-200">{user.sellerApprovalReason}</p>
              </div>
            )}
          </Section>

          {/* ── FORM 1: ARTIST'S ORIGINAL MUSIC CONSENT AND RELEASE ── */}
          <Section title="Artist's Original Music Consent and Release Form">
            <p className="text-sm text-gray-400 leading-relaxed">
              The undersigned Artist, Band, Independent Label, Recording Company, or Copyright Holder ("Copyright Owner") hereby grants <strong className="text-white">Hallelujah Gospel Globally</strong>, a California Limited Liability Company, and its affiliates, licensees, successors, and assigns the following rights and protections:
            </p>

            {/* Section 1 */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">1. Grant of Authorization</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                The Copyright Owner hereby grants Hallelujah Gospel Globally the non-exclusive, royalty-free, worldwide right to broadcast, stream, distribute, and use excerpts of the work for promotional purposes.
              </p>
              <InitialBadge value={user?.initialGrantAuthorization} />
            </div>

            {/* Section 2 */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">2. Ownership and Copyright Representation</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                The Copyright Owner affirms that the submitted recordings are original works or fully licensed, and all necessary rights have been secured.
              </p>
              <InitialBadge value={user?.initialOwnershipRepresentation} />
            </div>

            {/* Section 3 */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">3. Ironclad Licensing Protection and Outside Interference</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                This agreement supersedes any claim from outside licensing organizations (BMI, ASCAP, SESAC, SoundExchange, RIAA, etc.). This clause is binding, irrevocable, and non-negotiable.
              </p>
              <InitialBadge value={user?.initialLicensingProtection} />
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">4. Use by Affiliates and Partners</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Permission extends to all platforms owned or partnered with Hallelujah Gospel Globally, including Hallelujah Gospel Choice Radio, website, mobile apps, live and virtual events.
              </p>
              <InitialBadge value={user?.initialAffiliateUse} />
            </div>

            {/* Section 5 */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">5. Waiver of Compensation</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                The undersigned agrees that no payment is due for use of the submitted content under this agreement, including airplay, performance, mechanical, or synchronization royalties.
              </p>
              <InitialBadge value={user?.initialWaiverCompensation} />
            </div>

            {/* Section 6 */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">6. Warranties</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                The undersigned warrants that they own 100% of rights in the submitted materials, are not bound by conflicting agreements, material is original, and no submission will trigger external claims.
              </p>
              <InitialBadge value={user?.initialWarranties} />
            </div>

            {/* Section 7 */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">7. Indemnification</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                The undersigned agrees to indemnify and hold harmless Hallelujah Gospel Globally and its representatives from any claims, damages, or losses arising out of the submitted content.
              </p>
              <InitialBadge value={user?.initialIndemnification} />
            </div>

            {/* Section 8 */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">8. Publicity and Promotion Rights</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                The undersigned grants Hallelujah Gospel Globally the right to use artist and song information — names, logos, bios, photos, album art, song/album titles and credits — for all promotional use.
              </p>
              <InitialBadge value={user?.initialPublicityPromotion} />
            </div>

            {/* Section 9 */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">9. Limitation of Liability</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Any liability by either party under this agreement is strictly limited to <strong className="text-white">$100 USD</strong>. No party shall be liable for indirect or consequential damages.
              </p>
              <InitialBadge value={user?.initialLimitationLiability} />
            </div>

            {/* Section 10 */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">10. Arbitration and Legal Venue</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Any disputes shall be resolved exclusively through binding arbitration in Contra Costa County, California, under the rules of the American Arbitration Association.
              </p>
              <InitialBadge value={user?.initialArbitrationVenue} />
            </div>

            {/* Section 11 */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">11. Governing Law</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                This agreement is governed by the laws of the United States and the State of California.
              </p>
              <InitialBadge value={user?.initialGoverningLaw} />
            </div>

            {/* Section 12 */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">12. Coverage of Full Works</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                All tracks submitted via album, CD, or digital collection are covered under this agreement, including every track listed or embedded unless otherwise stated.
              </p>
              <InitialBadge value={user?.initialCoverageFullWorks} />
            </div>

            {/* Section 13 — Song/Album Info */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Song / Album Information</p>
              <p className="text-xs text-gray-400">Artist Name · Song Name · Album · Genre · Independent Label (if any)</p>
              <div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm">
                <Val value={user?.initialEntireAgreement} />
              </div>
            </div>

            {/* Signature of Copyright Owner */}
            <div className="mt-4 p-4 bg-white/[0.03] border border-white/10 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-white">Signature of Copyright Owner</p>
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Name (Print)" value={user?.copyrightOwnerName} />
                <FormRow label="Signature" value={user?.copyrightOwnerSignature} />
                <FormRow label="Date" value={user?.copyrightOwnerDate ? new Date(user.copyrightOwnerDate).toLocaleDateString() : user?.copyrightOwnerDate} />
              </div>
            </div>

            {/* Label Representative */}
            <div className="mt-2 p-4 bg-white/[0.03] border border-white/10 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-white">Label Representative <span className="font-normal text-gray-400">(if applicable)</span></p>
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Name (Print)" value={user?.labelRepresentativeName} />
                <FormRow label="Signature" value={user?.labelRepresentativeSignature} />
                <FormRow label="Date" value={user?.labelRepresentativeDate ? new Date(user.labelRepresentativeDate).toLocaleDateString() : user?.labelRepresentativeDate} />
              </div>
            </div>
          </Section>

          {/* ── FORM 2: DIGITAL MUSIC DISTRIBUTION AGREEMENT ── */}
          <Section title="HGC Radio – Digital Music Distribution and Merchandise Agreement">
            <p className="text-sm text-gray-400 leading-relaxed">
              This Agreement is entered into by and between <strong className="text-white">Hallelujah Gospel Globally</strong>, operating as HGC Radio and Hallelujah Gospel Choice Radio ("Company"), and the Artist. The Company distributes, promotes, markets, broadcasts, and sells digital music and related merchandise worldwide to glorify God and advance Kingdom purposes.
            </p>

            {/* Digital Store Option */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Digital Store Distribution Option</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Artist may authorize Company to distribute the Work to third-party digital stores and streaming platforms.
              </p>
              <InitialBadge value={user?.digitalDistributionDigitalStoreOption} />
            </div>

            {/* Signatures */}
            <div className="mt-2 p-4 bg-white/[0.03] border border-white/10 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-white">Artist / Authorized Representative</p>
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Name of Artist" value={user?.digitalDistributionArtistName} />
                <FormRow label="Signature" value={user?.digitalDistributionArtistSignature} />
                <FormRow label="Date" value={user?.digitalDistributionArtistDate ? new Date(user.digitalDistributionArtistDate).toLocaleDateString() : user?.digitalDistributionArtistDate} />
              </div>
            </div>

            <div className="mt-2 p-4 bg-white/[0.03] border border-white/10 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-white">Representative / Manager / Record Label <span className="font-normal text-gray-400">(if applicable)</span></p>
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Representative / Label Name" value={user?.digitalDistributionRepName} />
                <FormRow label="Title / Relationship" value={user?.digitalDistributionRepTitle} />
                <FormRow label="Signature" value={user?.digitalDistributionRepSignature} />
                <FormRow label="Date" value={user?.digitalDistributionRepDate ? new Date(user.digitalDistributionRepDate).toLocaleDateString() : user?.digitalDistributionRepDate} />
              </div>
            </div>

            {/* Faith-Based Summary */}
            <div className="mt-2 p-4 bg-white/[0.03] border border-white/10 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-white">Faith-Based Artist-Friendly Summary — Artist Acknowledgment</p>
              <p className="text-xs text-gray-400">I have read the summary and understand how HGC Radio will distribute, promote, and manage my music for Kingdom impact.</p>
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Name" value={user?.digitalDistributionSummaryName} />
                <FormRow label="Signature" value={user?.digitalDistributionSummarySignature} />
                <FormRow label="Date" value={user?.digitalDistributionSummaryDate ? new Date(user.digitalDistributionSummaryDate).toLocaleDateString() : user?.digitalDistributionSummaryDate} />
              </div>
            </div>
          </Section>

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

export default Page;