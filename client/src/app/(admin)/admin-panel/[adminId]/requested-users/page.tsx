/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useData } from "@/context/Context";
import { toast } from "sonner";
import { PageLoading } from "@/utils/Loading";

type SellerApprovalStatus = "pending" | "approved" | "rejected";

const Field = ({ label, value }: { label: string; value?: any }) => {
  const display =
    value === undefined || value === null || value === ""
      ? "-"
      : value instanceof Date
        ? value.toISOString()
        : String(value);

  return (
    <div className="border border-white/10 p-3 bg-[#0b1834]/60">
      <div className="text-xs text-gray-300">{label}</div>
      <div className="text-sm text-white break-words">{display}</div>
    </div>
  );
};

const Page = () => {
  const { userData } = useData();

  const [hasMounted, setHasMounted] = useState(false);
  const [status, setStatus] = useState<SellerApprovalStatus>("pending");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to load requested users", {
          style: { background: "red", border: "none", color: "white" },
        });
        return;
      }

      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load requested users", {
        style: { background: "red", border: "none", color: "white" },
      });
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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to approve", {
          style: { background: "red", border: "none", color: "white" },
        });
        return;
      }
      toast.success("Seller approved. Email sent.", {
        style: { background: "green", border: "none", color: "white" },
      });
      setSelected(null);
      setRejectReason("");
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve", {
        style: { background: "red", border: "none", color: "white" },
      });
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async (userId: string) => {
    if (!rejectReason.trim()) {
      toast.error("Reason is required", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/seller-requests/${userId}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
          body: JSON.stringify({ reason: rejectReason.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to disapprove", {
          style: { background: "red", border: "none", color: "white" },
        });
        return;
      }
      toast.success("Seller disapproved. Email sent.", {
        style: { background: "green", border: "none", color: "white" },
      });
      setSelected(null);
      setRejectReason("");
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.message || "Failed to disapprove", {
        style: { background: "red", border: "none", color: "white" },
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!hasMounted) return <PageLoading />;

  return (
    <div className="text-white">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold">Requested Seller Users</div>
          <div className="text-sm text-gray-300">
            View seller contract forms and approve/disapprove.
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex gap-2">
            {(["pending", "approved", "rejected"] as SellerApprovalStatus[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 border transition-all duration-300 ease-in-out ${status === s
                      ? "bg-second text-black border-second"
                      : "border-white/20 hover:border-second"
                    }`}
                >
                  {s}
                </button>
              )
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name/email"
              className="px-3 py-2 bg-transparent border border-white/20 outline-none text-white"
            />
            <button
              onClick={fetchRequests}
              disabled={loading}
              className="px-4 py-2 bg-second text-black disabled:opacity-60"
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 border border-white/10">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-gray-300 bg-[#0b1834]">
          <div className="col-span-4">Name</div>
          <div className="col-span-5">Email</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {loading ? (
          <div className="p-4 text-gray-300">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-gray-300">No users found.</div>
        ) : (
          users.map((u) => (
            <div
              key={u._id}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-white/10 items-center"
            >
              <div className="col-span-4">{u?.name || "-"}</div>
              <div className="col-span-5 text-gray-200">{u?.email || "-"}</div>
              <div className="col-span-2">{u?.sellerApprovalStatus || "-"}</div>
              <div className="col-span-1 text-right">
                <button
                  onClick={() => {
                    setSelected(u);
                    setRejectReason("");
                  }}
                  className="text-second hover:underline"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center px-3">
          <div className="w-full max-w-[1100px] bg-[#071126] border border-white/10 p-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-semibold">Seller Form Details</div>
                <div className="text-sm text-gray-300">
                  {selected?.name} — {selected?.email}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-white/80 hover:text-white transition-all"
              >
                X
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Account Type" value={selected?.accountType} />
              <Field label="Approval Status" value={selected?.sellerApprovalStatus} />
              <Field label="Created At" value={selected?.createdAt} />
              <Field label="City" value={selected?.city} />
              <Field label="State" value={selected?.state} />
              <Field label="Country" value={selected?.country} />
              <Field label="Zip Code" value={selected?.zipCode} />
            </div>

            <div className="mt-6">
              <div className="text-lg font-semibold">Contract / Consent Form</div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="1. Grant of Authorization (Initial)" value={selected?.initialGrantAuthorization} />
                <Field label="2. Ownership Representation (Initial)" value={selected?.initialOwnershipRepresentation} />
                <Field label="3. Licensing Protection (Initial)" value={selected?.initialLicensingProtection} />
                <Field label="4. Affiliate Use (Initial)" value={selected?.initialAffiliateUse} />
                <Field label="5. Waiver Compensation (Initial)" value={selected?.initialWaiverCompensation} />
                <Field label="6. Warranties (Initial)" value={selected?.initialWarranties} />
                <Field label="7. Indemnification (Initial)" value={selected?.initialIndemnification} />
                <Field label="8. Publicity Promotion (Initial)" value={selected?.initialPublicityPromotion} />
                <Field label="9. Limitation Liability (Initial)" value={selected?.initialLimitationLiability} />
                <Field label="10. Arbitration Venue (Initial)" value={selected?.initialArbitrationVenue} />
                <Field label="11. Governing Law (Initial)" value={selected?.initialGoverningLaw} />
                <Field label="12. Coverage Full Works (Initial)" value={selected?.initialCoverageFullWorks} />
                <Field label="Song/Album Info (UI field: initialEntireAgreement)" value={selected?.initialEntireAgreement} />
                <Field label="Copyright Owner Name" value={selected?.copyrightOwnerName} />
                <Field label="Copyright Owner Signature" value={selected?.copyrightOwnerSignature} />
                <Field label="Copyright Owner Date" value={selected?.copyrightOwnerDate} />
                <Field label="Label Representative Name" value={selected?.labelRepresentativeName} />
                <Field label="Label Representative Signature" value={selected?.labelRepresentativeSignature} />
                <Field label="Label Representative Date" value={selected?.labelRepresentativeDate} />
              </div>

              <div className="mt-6 text-lg font-semibold">Digital Music Distribution Agreement</div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Artist Name" value={selected?.digitalDistributionArtistName} />
                <Field label="Artist Signature" value={selected?.digitalDistributionArtistSignature} />
                <Field label="Artist Date" value={selected?.digitalDistributionArtistDate} />
                <Field label="Rep Name" value={selected?.digitalDistributionRepName} />
                <Field label="Rep Title" value={selected?.digitalDistributionRepTitle} />
                <Field label="Rep Signature" value={selected?.digitalDistributionRepSignature} />
                <Field label="Rep Date" value={selected?.digitalDistributionRepDate} />
                <Field label="Digital Store Option (Initial)" value={selected?.digitalDistributionDigitalStoreOption} />
                <Field label="Summary Name" value={selected?.digitalDistributionSummaryName} />
                <Field label="Summary Signature" value={selected?.digitalDistributionSummarySignature} />
                <Field label="Summary Date" value={selected?.digitalDistributionSummaryDate} />
              </div>
            </div>

            <div className="mt-6 flex flex-col lg:flex-row gap-3 lg:items-end justify-between">
              <div className="w-full lg:max-w-[520px]">
                <div className="text-sm text-gray-300">
                  Disapprove requires a reason (will be emailed to the user).
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for disapproval..."
                  className="mt-2 w-full min-h-[90px] p-3 bg-transparent border border-white/20 outline-none text-white"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => reject(selected._id)}
                  disabled={actionLoading}
                  className="px-5 py-2 border border-red-500 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                >
                  {actionLoading ? "Processing..." : "Disapprove"}
                </button>
                <button
                  onClick={() => approve(selected._id)}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-second text-black disabled:opacity-60"
                >
                  {actionLoading ? "Processing..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;