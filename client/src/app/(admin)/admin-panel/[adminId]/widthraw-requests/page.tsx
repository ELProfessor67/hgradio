"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useData } from "@/context/Context";
import { toast } from "sonner";

type StatusType = "pending" | "processing" | "completed";

type RequestType = {
  _id: string;
  amount: number;
  status: StatusType;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  user: { _id: string; name?: string; email?: string };
};

const statusBadge = (status: StatusType) => {
  if (status === "completed") return "bg-green-600/20 text-green-200 border-green-400/20";
  if (status === "processing") return "bg-yellow-600/20 text-yellow-200 border-yellow-400/20";
  return "bg-blue-600/20 text-blue-200 border-blue-400/20";
};

const Page = () => {
  const { userData } = useData();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [status, setStatus] = useState<"" | StatusType>("pending");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "10");
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [page, status, q, from, to]);

  const fetchRequests = async () => {
    if (!userData?.token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/withdraw/requests?${queryString}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${userData.token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to fetch requests");
        return;
      }
      setRequests(data?.requests || []);
      setTotalPages(Number(data?.totalPages || 1));
    } catch (e) {
      console.error("Fetch admin withdraw requests error:", e);
      toast.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId: string, nextStatus: StatusType) => {
    if (!userData?.token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/withdraw/requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to update status");
        return;
      }
      toast.success("Status updated", {
        style: { background: "green", border: "none", color: "white" },
      });
      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? data?.request || r : r))
      );
    } catch (e) {
      console.error("Update status error:", e);
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString, userData?.token]);

  return (
    <div className=" text-[#fff] ">
      <div className=" flex items-center justify-between gap-3 ">
        <h3 className=" text-[1.3rem] font-semibold ">Withdraw Requests</h3>
      </div>

      <div className=" mt-4 flex flex-wrap items-center gap-2 ">
        {(["pending", "processing", "completed"] as StatusType[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              setPage(1);
              setStatus(s);
            }}
            className={` px-3 py-2 text-sm border ${
              status === s
                ? "bg-second/20 text-second border-second/30"
                : "border-white/10 text-white/80 hover:bg-white/5"
            } `}
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => {
            setPage(1);
            setStatus("");
          }}
          className={` px-3 py-2 text-sm border ${
            status === ""
              ? "bg-second/20 text-second border-second/30"
              : "border-white/10 text-white/80 hover:bg-white/5"
          } `}
        >
          all
        </button>
      </div>

      <div className=" mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 ">
        <input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Search by user name/email"
          className=" w-full px-3 py-2 bg-transparent border border-white/20 outline-none text-white text-sm "
        />
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setPage(1);
            setFrom(e.target.value);
          }}
          className=" w-full px-3 py-2 bg-transparent border border-white/20 outline-none text-white text-sm "
        />
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setPage(1);
            setTo(e.target.value);
          }}
          className=" w-full px-3 py-2 bg-transparent border border-white/20 outline-none text-white text-sm "
        />
        <button
          onClick={() => fetchRequests()}
          className=" bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out px-4 py-2 text-sm "
        >
          Apply
        </button>
      </div>

      <div className=" mt-4 bg-[#071126] border border-white/10 ">
        {loading ? (
          <div className=" p-4 text-sm text-white/80 ">Loading...</div>
        ) : requests.length === 0 ? (
          <div className=" p-4 text-sm text-white/80 ">No requests found.</div>
        ) : (
          <div className=" overflow-x-auto ">
            <table className=" w-full text-sm ">
              <thead>
                <tr className=" text-left text-white/70 border-b border-white/10 ">
                  <th className=" py-3 px-3 ">Date</th>
                  <th className=" py-3 px-3 ">User</th>
                  <th className=" py-3 px-3 ">Amount</th>
                  <th className=" py-3 px-3 ">Status</th>
                  <th className=" py-3 px-3 ">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id} className=" border-b border-white/10 ">
                    <td className=" py-3 px-3 ">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className=" py-3 px-3 ">
                      <div className=" font-medium ">
                        {r.user?.name || "Unknown"}
                      </div>
                      <div className=" text-xs text-white/70 ">
                        {r.user?.email || ""}
                      </div>
                    </td>
                    <td className=" py-3 px-3 ">
                      ${Number(r.amount || 0).toFixed(2)}
                    </td>
                    <td className=" py-3 px-3 ">
                      <span
                        className={` inline-block px-2 py-1 border text-xs ${statusBadge(
                          r.status
                        )} `}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className=" py-3 px-3 ">
                      <select
                        value={r.status}
                        onChange={(e) =>
                          updateStatus(r._id, e.target.value as StatusType)
                        }
                        className=" bg-transparent border border-white/20 px-2 py-2 outline-none "
                        disabled={r.status === "completed"}
                      >
                        <option value="pending" className=" text-black ">
                          pending
                        </option>
                        <option value="processing" className=" text-black ">
                          processing
                        </option>
                        <option value="completed" className=" text-black ">
                          completed
                        </option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className=" p-3 flex items-center justify-between gap-3 ">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className=" px-3 py-2 border border-white/20 text-xs disabled:opacity-50 "
          >
            Prev
          </button>
          <div className=" text-xs text-white/70 ">
            Page {page} of {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className=" px-3 py-2 border border-white/20 text-xs disabled:opacity-50 "
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page;


