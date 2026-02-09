"use client";

import Breadcrum from "@/components/Breadcrum";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import bg2 from "@/assets/previous-show.jpg";
import { useData } from "@/context/Context";
import { FetchLoading, PageLoading } from "@/utils/Loading";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SongType {
  name: string;
  duration: number;
  url: string;
}

interface AlbumType {
  _id: string;
  title: string;
  artist: string | { _id: string; name?: string; profileImg?: string }; // ObjectId or populated artist
  releaseYear: number;
  price: number;
  description: string;
  coverImg: string;
  songs: SongType[];
  salesCount?: number;
  totalRevenue?: number;
  purchasedAt?: string | Date | null;
  createdAt?: string;
  updatedAt?: string;
}

const Page = () => {
  const { userData, logout, setUserData } = useData();

  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<{
    totalSales: number;
    totalRevenue: number;
    balance: number;
    totalEarnings: number;
    totalWithdrawn: number;
  } | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawRequests, setWithdrawRequests] = useState<
    {
      amount: number;
      status: "pending" | "processing" | "completed";
      createdAt: string;
      _id: string;
    }[]
  >([]);
  const [withdrawReqLoading, setWithdrawReqLoading] = useState(false);
  const [withdrawReqPage, setWithdrawReqPage] = useState(1);
  const [withdrawReqTotalPages, setWithdrawReqTotalPages] = useState(1);
  const router = useRouter();
  const [albums, setAlbums] = useState<AlbumType[]>([]);
  const [error, setError] = useState("");
  const accountType = (userData as any)?.accountType as
    | "buyer"
    | "seller"
    | undefined;
  const sellerApprovalStatus = (userData as any)?.sellerApprovalStatus as
    | "not_required"
    | "pending"
    | "approved"
    | "rejected"
    | undefined;
  const sellerApprovalReason = (userData as any)?.sellerApprovalReason as
    | string
    | undefined;

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/get-albums`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to fetch albums");
        return;
      }

      setAlbums(data.albums || []);
      setError("");
    } catch (err) {
      console.error("Fetch albums error:", err);
      setError("Failed to fetch albums.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasedAlbums = async () => {
    if (!userData?.token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/purchased-albums`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to fetch purchased albums");
        return;
      }

      setAlbums(data.albums || []);
      setError("");
    } catch (err) {
      console.error("Fetch purchased albums error:", err);
      setError("Failed to fetch purchased albums.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/earnings-summary`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) return;

      setSummary({
        totalSales: Number(data?.totalSales || 0),
        totalRevenue: Number(data?.totalRevenue || 0),
        balance: Number(data?.balance || 0),
        totalEarnings: Number(data?.totalEarnings || 0),
        totalWithdrawn: Number(data?.totalWithdrawn || 0),
      });
    } catch (err) {
      console.error("Fetch summary error:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userData?.token) return;
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount < 5) {
      toast.error("Minimum withdraw amount is $5.");
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/withdraw-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
          body: JSON.stringify({ amount }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Withdraw failed");
        return;
      }

      toast.success(
        data?.message || "Withdraw request submitted. It takes 1 to 2 days to process.",
        {
          style: { background: "green", border: "none", color: "white" },
        }
      );
      setWithdrawAmount("");
      setWithdrawModalOpen(false);
      fetchSummary();
      fetchWithdrawRequests(1);
    } catch (err) {
      console.error("Withdraw error:", err);
      toast.error("Withdraw failed");
    } finally {
      setWithdrawing(false);
    }
  };

  const fetchWithdrawRequests = async (page = withdrawReqPage) => {
    if (!userData?.token) return;
    setWithdrawReqLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/withdraw-requests?page=${page}&limit=10`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) return;

      setWithdrawRequests(data?.requests || []);
      setWithdrawReqPage(Number(data?.page || page));
      setWithdrawReqTotalPages(Number(data?.totalPages || 1));
    } catch (err) {
      console.error("Fetch withdraw requests error:", err);
    } finally {
      setWithdrawReqLoading(false);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    if (userData?.token) {
      if (accountType === "seller") {
        fetchAlbums();
        fetchSummary();
        fetchWithdrawRequests(1);
      } else if (accountType === "buyer") {
        fetchPurchasedAlbums();
      }
    }
  }, [userData?.token, accountType]);

  useEffect(() => {
    // Refresh user info (approval status etc.) when entering dashboard
    const refreshMe = async () => {
      if (!userData?._id) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/me/${userData._id}`
        );
        const data = await res.json();
        if (!res.ok || !data?.user?._id) return;
        setUserData((prev) => ({
          ...data.user,
          token: prev.token,
        }));
      } catch {
        // ignore
      }
    };
    refreshMe();
  }, [userData?._id, setUserData]);

  if (!hasMounted) return <PageLoading />;

  const computedTotals =
    accountType === "seller"
      ? albums.reduce(
        (acc, a) => {
          acc.totalSales += Number(a.salesCount || 0);
          acc.totalRevenue += Number(a.totalRevenue || 0);
          return acc;
        },
        { totalSales: 0, totalRevenue: 0 }
      )
      : { totalSales: 0, totalRevenue: 0 };

  const totalSales = summary?.totalSales ?? computedTotals.totalSales;
  const totalRevenue = summary?.totalRevenue ?? computedTotals.totalRevenue;
  const balance = summary?.balance ?? 0;
  const statusBadge = (status: string) => {
    if (status === "completed") return "bg-green-600/20 text-green-200 border-green-400/20";
    if (status === "processing") return "bg-yellow-600/20 text-yellow-200 border-yellow-400/20";
    return "bg-blue-600/20 text-blue-200 border-blue-400/20";
  };

  return (
    <div className=" min-h-[100vh] ">
      <Breadcrum
        mainTitle="Dashboard"
        subTitle={
          accountType === "buyer"
            ? "View your purchased albums"
            : "Add and manage your albums"
        }
      />
      <div
        className="relative z-20 min-h-screen bg-no-repeat bg-cover text-[#fff] "
        style={{ backgroundImage: `url(${bg2.src})` }}
      >
        <div className="absolute inset-0 bg-black/60 z-[-1]" />

        <div className="max-w-[1500px] mx-auto py-5 px-3">
          <div className=" flex justify-between ">
            <h3 className=" text-[1.5rem] font-medium ">
              {accountType === "buyer" ? "My Purchased Albums" : "My Albums"}
            </h3>
            {accountType === "seller" ? (
              <div className=" mt-2 flex justify-end ">
                {sellerApprovalStatus === "approved" ? (
                  <Link
                    href={`/dashboard/${userData._id}/add-album`}
                    className=" bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out w-[8rem] text-center py-2 "
                  >
                    Add Album
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      toast.error(
                        "Your form is not approved. Please contact the admin.",
                        {
                          style: {
                            background: "red",
                            border: "none",
                            color: "white",
                          },
                        }
                      );
                    }}
                    disabled
                    className=" bg-second/40 text-[#000] transition-all duration-300 ease-in-out w-[8rem] text-center py-2 cursor-not-allowed opacity-70 "
                    title="Not approved yet"
                  >
                    Add Album
                  </button>
                )}
              </div>
            ) : null}
            <div className=" flex items-center gap-2 ">

              <div
                onClick={() => {
                  logout();
                  toast.success("User Logged Out Successfully", {
                    style: {
                      background: "green",
                      border: "none",
                      color: "white",
                    },
                  });
                  router.push("/login");
                }}
                className=" cursor-pointer bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out w-[8rem] text-center py-2 "
              >
                Log Out
              </div>

              <Link
                href={`/dashboard/${userData._id}/profile`}
                className=" bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out w-[8rem] text-center py-2 "
              >
                Profile
              </Link>
            </div>
          </div>


          {accountType === "seller" && sellerApprovalStatus !== "approved" && (
            <div className="mt-4 bg-[#0b1834]/80 border border-yellow-400/30 p-4 text-white">
              <div className="font-semibold text-yellow-300">
                Your form is not approved. Please contact the admin.
              </div>
              {sellerApprovalStatus === "pending" && (
                <div className="text-sm text-gray-200 mt-1">
                  Status: <span className="font-medium">Pending</span>
                </div>
              )}
              {sellerApprovalStatus === "rejected" && (
                <div className="text-sm text-gray-200 mt-1">
                  Status: <span className="font-medium">Disapproved</span>
                  {sellerApprovalReason ? (
                    <div className="mt-2">
                      <span className="font-medium">Reason:</span> {sellerApprovalReason}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {accountType === "seller" ? (
            <div className=" mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 ">
              <div className=" bg-[#0b1834]/80 border border-white/10 p-4 ">
                <div className=" text-sm text-gray-200 ">Total Sales</div>
                <div className=" text-[1.8rem] font-semibold ">
                  {summaryLoading ? "..." : totalSales}
                </div>
              </div>
              <div className=" bg-[#0b1834]/80 border border-white/10 p-4 ">
                <div className=" text-sm text-gray-200 ">Total Revenue</div>
                <div className=" text-[1.8rem] font-semibold ">
                  {summaryLoading ? "..." : `$${totalRevenue.toFixed(2)}`}
                </div>
              </div>
              <div className=" bg-[#0b1834]/80 border border-white/10 p-4 ">
                <div className=" flex items-center justify-between gap-3 ">
                  <div>
                    <div className=" text-sm text-gray-200 ">Available Balance</div>
                    <div className=" text-[1.8rem] font-semibold ">
                      {summaryLoading ? "..." : `$${balance.toFixed(2)}`}
                    </div>
                  </div>
                  <button
                    onClick={() => setWithdrawModalOpen(true)}
                    className=" bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out px-4 py-2 text-sm "
                  >
                    Withdraw
                  </button>
                </div>
                {summary?.totalWithdrawn !== undefined && (
                  <div className=" mt-2 text-xs text-gray-200 ">
                    Total withdrawn:{" "}
                    <span className=" font-medium ">
                      ${Number(summary.totalWithdrawn).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className=" mt-1 text-xs text-gray-200 ">
                  Withdrawals take{" "}
                  <span className=" font-medium ">1 to 2 days</span> to process.
                </div>
              </div>
            </div>
          ) : null}

          {accountType === "seller" && withdrawModalOpen && (
            <div className=" fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center px-3 ">
              <div className=" w-full max-w-[34rem] bg-[#0b1834] border border-white/10 p-4 text-white ">
                <div className=" flex items-center justify-between gap-3 ">
                  <div>
                    <div className=" text-[1.2rem] font-semibold ">Withdraw</div>
                    <div className=" text-xs text-gray-200 ">
                      Minimum $5. It takes 1 to 2 days to process.
                    </div>
                  </div>
                  <button
                    onClick={() => setWithdrawModalOpen(false)}
                    className=" text-white/80 hover:text-white transition-all duration-300 ease-in-out "
                  >
                    X
                  </button>
                </div>

                <div className=" mt-4 ">
                  <div className=" text-xs text-gray-200 ">Available balance</div>
                  <div className=" text-[1.5rem] font-semibold ">
                    ${balance.toFixed(2)}
                  </div>
                </div>

                <div className=" mt-4 ">
                  <input
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount (min $5)"
                    className=" w-full px-3 py-2 bg-transparent border border-white/20 outline-none text-white text-sm "
                  />
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className=" mt-3 w-full bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out py-2 text-sm disabled:opacity-60 "
                  >
                    {withdrawing ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {accountType === "seller" ? (
            <div className=" mt-6 bg-[#0b1834]/80 border border-white/10 p-4 ">
              <div className=" flex items-center justify-between gap-3 ">
                <div>
                  <div className=" text-[1.2rem] font-semibold ">
                    Withdraw History
                  </div>
                  <div className=" text-xs text-gray-200 ">
                    Track your requests and status.
                  </div>
                </div>
                <button
                  onClick={() => fetchWithdrawRequests(withdrawReqPage)}
                  className=" text-sm underline underline-offset-4 "
                >
                  Refresh
                </button>
              </div>

              {withdrawReqLoading ? (
                <div className=" mt-4 text-sm text-gray-200 ">Loading...</div>
              ) : withdrawRequests.length === 0 ? (
                <div className=" mt-4 text-sm text-gray-200 ">
                  No withdraw requests yet.
                </div>
              ) : (
                <div className=" mt-4 overflow-x-auto ">
                  <table className=" w-full text-sm ">
                    <thead>
                      <tr className=" text-left text-gray-200 border-b border-white/10 ">
                        <th className=" py-2 ">Date</th>
                        <th className=" py-2 ">Amount</th>
                        <th className=" py-2 ">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawRequests.map((r) => (
                        <tr
                          key={r._id}
                          className=" border-b border-white/10 text-white/90 "
                        >
                          <td className=" py-2 ">
                            {new Date(r.createdAt).toLocaleString()}
                          </td>
                          <td className=" py-2 ">
                            ${Number(r.amount || 0).toFixed(2)}
                          </td>
                          <td className=" py-2 ">
                            <span
                              className={` inline-block px-2 py-1 border text-xs ${statusBadge(
                                r.status
                              )} `}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className=" mt-3 flex items-center justify-between gap-3 ">
                    <button
                      onClick={() => {
                        const next = Math.max(1, withdrawReqPage - 1);
                        fetchWithdrawRequests(next);
                      }}
                      disabled={withdrawReqPage <= 1}
                      className=" px-3 py-2 border border-white/20 text-xs disabled:opacity-50 "
                    >
                      Prev
                    </button>
                    <div className=" text-xs text-gray-200 ">
                      Page {withdrawReqPage} of {withdrawReqTotalPages}
                    </div>
                    <button
                      onClick={() => {
                        const next = Math.min(
                          withdrawReqTotalPages,
                          withdrawReqPage + 1
                        );
                        fetchWithdrawRequests(next);
                      }}
                      disabled={withdrawReqPage >= withdrawReqTotalPages}
                      className=" px-3 py-2 border border-white/20 text-xs disabled:opacity-50 "
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {error && <p className=" text-sm text-red-500 my-2 ">{error}</p>}

          {loading && (
            <div className=" h-[20rem] relative ">
              <FetchLoading />
            </div>
          )}

          {albums.length > 0 ? (
            <div className=" mt-[4rem] grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 xl:grid-cols-4 gap-3 ">
              {albums.map((album) => (
                <Link
                  key={album._id}
                  href={
                    accountType === "buyer"
                      ? `/albums/${album._id}`
                      : `/dashboard/${userData._id}/albums/${album._id}`
                  }
                  className=" group block "
                >
                  <div className=" w-full h-[17rem] relative overflow-hidden border border-white/10">
                    <Image
                      src={album.coverImg}
                      alt="Cover img"
                      fill
                      className="group-hover:scale-110 transition-all duration-300 ease-in-out object-contain"
                    />
                    {accountType === "seller" ? (
                      <div className=" absolute top-2 left-2 flex gap-2 ">
                        <div className=" text-xs bg-black/70 px-2 py-1 border border-white/10 ">
                          Sales: {Number(album.salesCount || 0)}
                        </div>
                        <div className=" text-xs bg-black/70 px-2 py-1 border border-white/10 ">
                          Rev: ${Number(album.totalRevenue || 0).toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className=" absolute top-2 left-2 flex gap-2 ">
                        <div className=" text-xs bg-black/70 px-2 py-1 border border-white/10 ">
                          Purchased
                        </div>
                      </div>
                    )}
                  </div>
                  <div className=" bg-[#0b1834] p-3 ">
                    <div className=" text-[1.4rem] font-medium line-clamp-1 ">
                      {album.title}
                    </div>
                    <div className=" mt-2 text-xs text-gray-200 ">
                      {accountType === "buyer"
                        ? "Click to view album"
                        : "Click to manage album"}
                    </div>
                    <div className=" mt-3 flex items-center gap-3 ">
                      <div className=" relative w-[3.5rem] h-[3.5rem] rounded-full bg-blue-900 ">
                        {userData.profileImg && (
                          <Image
                            src={userData.profileImg}
                            fill
                            alt="Profile Image"
                            className=" rounded-full object-cover "
                          />
                        )}
                      </div>
                      <div>{userData.name}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className=" text-gray-200 text-center h-[10rem] flex items-center justify-center ">
              {accountType === "buyer"
                ? "You haven't purchased any albums yet."
                : (
                  <div className=" text-gray-200 text-center h-[10rem] flex items-center justify-center ">
                    <p>There are no album yet please add some albums</p>
                    <Link
                      href={`/dashboard/${userData._id}/add-album`}
                      className=" bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out w-[8rem] text-center py-2 "
                    >
                      Add Album
                    </Link>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
