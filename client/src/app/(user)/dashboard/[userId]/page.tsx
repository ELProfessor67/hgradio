"use client";

import Breadcrum from "@/components/Breadcrum";
import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import bg2 from "@/assets/previous-show.jpg";
import { useData } from "@/context/Context";
import { FetchLoading, PageLoading } from "@/utils/Loading";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axios from "axios";

const CLOUD_NAME = "ddlwhkn3b";
const UPLOAD_PRESET = "images_preset";

async function uploadDataUrlToCloudinary(dataUrl: string): Promise<string | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "artist_signature.png", { type: "image/png" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "SIDESONE/signatures");
    const uploadRes = await axios.post<{ secure_url: string }>(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );
    return uploadRes.data.secure_url;
  } catch (err) {
    console.error("Signature upload error:", err);
    return null;
  }
}

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




  const [checkPolicyAccepted, setCheckPolicyAccepted] = useState(false);
  const [policyModelOpen, setPolicyModelOpen] = useState(false);

  // Upgrade to seller states
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeOtp, setUpgradeOtp] = useState("");
  const [upgradeOtpToken, setUpgradeOtpToken] = useState("");
  const [upgradeOtpSent, setUpgradeOtpSent] = useState(false);
  const [upgradeOtpVerified, setUpgradeOtpVerified] = useState(false);
  const [upgradeOtpSending, setUpgradeOtpSending] = useState(false);
  const [upgradeOtpVerifying, setUpgradeOtpVerifying] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  // Shared agreement form data (for both upgrade and resubmit)
  const [agreementForm, setAgreementForm] = useState({
    agreeTerms: false,
    confirmAccurate: false,
    confirmRights: false,
    fullName: "",
    stageName: "",
    signatureTyped: "",
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Resubmit rejected form states
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

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
      toast.error("Minimum withdraw amount is $5.", {
        style: { background: "red", border: "none", color: "white" },
      });
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
        toast.error(data?.message || "Withdraw failed", {
          style: { background: "red", border: "none", color: "white" },
        });
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
      toast.error("Withdraw failed", {
        style: { background: "red", border: "none", color: "white" },
      });
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

  const requestUpgradeOtp = async () => {
    if (!userData?.email) {
      toast.error("Email not found.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    setUpgradeOtpSending(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/upgrade-otp/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userData.email }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to send OTP", {
          style: { background: "red", border: "none", color: "white" },
        });
        return;
      }

      setUpgradeOtpSent(true);
      setUpgradeOtpVerified(false);
      setUpgradeOtpToken("");
      toast.success("OTP sent to your email.", {
        style: { background: "green", border: "none", color: "white" },
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to send OTP", {
        style: { background: "red", border: "none", color: "white" },
      });
    } finally {
      setUpgradeOtpSending(false);
    }
  };

  const verifyUpgradeOtp = async () => {
    if (!userData?.email) {
      toast.error("Email not found.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    if (!upgradeOtp || upgradeOtp.trim().length === 0) {
      toast.error("Please enter OTP.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    setUpgradeOtpVerifying(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/upgrade-otp/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userData.email,
            otp: upgradeOtp.trim(),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "OTP verification failed", {
          style: { background: "red", border: "none", color: "white" },
        });
        return;
      }

      setUpgradeOtpVerified(true);
      setUpgradeOtpToken(data?.otpToken || "");
      toast.success("OTP verified. Contract form unlocked.", {
        style: { background: "green", border: "none", color: "white" },
      });
    } catch (err: any) {
      toast.error(err?.message || "OTP verification failed", {
        style: { background: "red", border: "none", color: "white" },
      });
    } finally {
      setUpgradeOtpVerifying(false);
    }
  };

  // Canvas utilities
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasSignature(true);
    const pos = getCanvasPoint(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getCanvasPoint(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const prepareSubmitPayload = async () => {
    if (!agreementForm.agreeTerms || !agreementForm.confirmAccurate || !agreementForm.confirmRights) {
      toast.error("Please agree to all the confirmation checkboxes.", { style: { background: "red", border: "none", color: "white" } });
      return null;
    }
    if (!agreementForm.fullName.trim() || !agreementForm.signatureTyped.trim()) {
      toast.error("Please fill in your full name and typed signature.", { style: { background: "red", border: "none", color: "white" } });
      return null;
    }

    let finalSignatureUrl = null;
    if (hasSignature && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      toast.success("Uploading your handwritten signature...", { style: { background: "blue", border: "none", color: "white" } });
      finalSignatureUrl = await uploadDataUrlToCloudinary(dataUrl);
      if (!finalSignatureUrl) {
        toast.error("Failed to upload signature. Please try again.", { style: { background: "red", border: "none", color: "white" } });
        return null;
      }
    }

    return {
      digitalDistributionArtistName: agreementForm.fullName,
      digitalDistributionStageName: agreementForm.stageName,
      digitalDistributionArtistSignature: agreementForm.signatureTyped,
      artistSignatureUrl: finalSignatureUrl,
    };
  };

  const handleUpgradeSubmit = async () => {
    if (!upgradeOtpVerified) {
      toast.error("Please verify OTP first.", { style: { background: "red", border: "none", color: "white" } });
      return;
    }

    const payload = await prepareSubmitPayload();
    if (!payload) return;

    setUpgrading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/upgrade-to-seller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData._id, otpToken: upgradeOtpToken, ...payload }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Upgrade failed", { style: { background: "red", border: "none", color: "white" } });
        return;
      }

      if (data?.user?._id) {
        setUserData({ ...data.user, token: userData.token });
        toast.success("Account upgraded to seller! Pending admin approval.", { style: { background: "green", border: "none", color: "white" } });
        setUpgradeModalOpen(false);
        setUpgradeOtp("");
        setUpgradeOtpToken("");
        setUpgradeOtpSent(false);
        setUpgradeOtpVerified(false);
        setAgreementForm({ agreeTerms: false, confirmAccurate: false, confirmRights: false, fullName: "", stageName: "", signatureTyped: "" });
        setHasSignature(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Upgrade failed", { style: { background: "red", border: "none", color: "white" } });
    } finally {
      setUpgrading(false);
    }
  };

  const handleResubmit = async () => {
    const payload = await prepareSubmitPayload();
    if (!payload) return;

    setResubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/seller-form/resubmit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${userData.token}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Resubmit failed", { style: { background: "red", border: "none", color: "white" } });
        return;
      }
      if (data?.user?._id) {
        setUserData({ ...data.user, token: userData.token });
      }
      toast.success("Form resubmitted! Pending admin review.", { style: { background: "green", border: "none", color: "white" } });
      setResubmitModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Resubmit failed", { style: { background: "red", border: "none", color: "white" } });
    } finally {
      setResubmitting(false);
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

  // User/approval refresh is handled globally in FormProvider (Context.tsx)

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

  function AgreementSection({
    num,
    title,
    body,
    bullets,
    footer,
  }: {
    num: string;
    title: string;
    body?: string | null;
    bullets?: string[];
    footer?: string;
  }) {
    return (
      <div className="space-y-3 border-b border-gray-700/50 pb-7">
        <h3 className="text-lg font-bold text-[#66FCF1]">
          {num}. {title}
        </h3>
        {body && <p className="text-gray-300">{body}</p>}
        {bullets && (
          <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2 text-sm">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
        {footer && <p className="text-gray-400 text-sm mt-1">{footer}</p>}
      </div>
    );
  }

  const renderContractText = () => (
    <div className="space-y-8 bg-[#0B1834]/50 border border-white/10 rounded-lg p-6 mb-8 text-sm">
      {/* Preamble */}
      <div className="bg-[#071126] border border-white/10 rounded-lg p-5 space-y-3 text-gray-300">
        <p>
          This Digital Distribution &amp; Artist Agreement (&ldquo;Agreement&rdquo;) is entered
          into by and between{" "}
          <span className="text-white font-semibold">
            Hallelujah Gospel Globally (HGC Radio)
          </span>{" "}
          (&ldquo;Company&rdquo;) and the registering artist (&ldquo;Artist&rdquo;), effective as
          of the date of submission and acceptance (&ldquo;Effective Date&rdquo;).
        </p>
        <p className="text-[#66FCF1] font-medium">
          By submitting content or registering, Artist agrees to be bound by the terms
          of this Agreement.
        </p>
      </div>

      <div className="space-y-6">
        {[
          {
            num: "1",
            title: "PURPOSE",
            body: "Company operates a faith-based digital music distribution, internet radio, and promotional platform. This Agreement governs the distribution, promotion, monetization, and related use of Artist's content for both ministry and commercial purposes.",
          },
          {
            num: "2",
            title: "NON-EXCLUSIVITY",
            body: "This Agreement is non-exclusive. Artist retains full ownership of their content and may distribute, license, or exploit it through other platforms or parties at their sole discretion.",
          },
          {
            num: "3",
            title: "REPRESENTATIONS & WARRANTIES",
            body: null,
            bullets: [
              "Artist owns or controls 100% of all necessary rights, including master and composition rights (or has secured proper licenses).",
              "All content submitted is original or properly licensed.",
              "No content infringes upon any copyright, trademark, or third-party rights.",
              "All collaborators, producers, and contributors have been properly credited and compensated where required.",
            ],
            footer: "Artist agrees to provide documentation upon request.",
          },
          {
            num: "4",
            title: "LICENSE GRANT",
            body: "Artist grants Company a worldwide, non-exclusive, royalty-bearing license to:",
            bullets: [
              "Distribute, stream, reproduce, and publicly perform the content",
              "Promote, market, and advertise the content",
              "Sub-license content to third-party platforms (e.g., DSPs, streaming services)",
              "Use Artist's name, likeness, image, biography, and branding for promotional purposes",
            ],
            footer: "This license remains in effect during the Term of this Agreement.",
          },
        ].map((sec) => (
          <AgreementSection key={sec.num} {...sec} />
        ))}

        {/* Section 5 Revenue Share */}
        <div className="space-y-4 border-b border-gray-700/50 pb-8">
          <h3 className="text-lg font-bold text-[#66FCF1]">5. REVENUE SHARE</h3>
          <div className="space-y-2">
            <h4 className="font-semibold text-white">5.1 Definitions</h4>
            <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2 text-sm">
              <li><strong>Gross Revenue:</strong> All income derived from exploitation of Artist's content.</li>
              <li><strong>Net Revenue:</strong> Gross Revenue minus third-party fees, commissions, platform costs, taxes, refunds, and chargebacks.</li>
              <li><strong>Net Profit (Merchandise):</strong> Merchandise revenue minus production, manufacturing, shipping, transaction fees, taxes, returns, and related costs.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-white">5.2 Music Distribution Revenue</h4>
            <p className="text-gray-300 text-sm">
              Artist shall receive <span className="text-[#66FCF1] font-bold">60%–70%</span> of Net Revenue generated from streaming, downloads, and licensing. The exact percentage may vary depending on promotional campaigns, partnerships, or special agreements.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-white">5.3 Merchandise Revenue (Optional)</h4>
            <p className="text-gray-300 text-sm">
              If Artist participates in Company's merchandise program: Artist receives{" "}
              <span className="text-[#66FCF1] font-bold">35%</span> of Net Profit · HGC Radio receives{" "}
              <span className="text-[#66FCF1] font-bold">65%</span> of Net Profit.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-white">5.4 Accounting &amp; Payments</h4>
            <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2 text-sm">
              <li>Payments are issued bi-annually (June 30 and December 31)</li>
              <li>Minimum payout threshold: $100 USD</li>
              <li>Company reserves the right to carry forward balances below the threshold</li>
              <li>Statements may be provided upon request</li>
            </ul>
          </div>
        </div>

        {/* Sections 6–14 */}
        {[
          {
            num: "6",
            title: "PROMOTION & BROADCAST RIGHTS",
            body: "Artist grants Company the right to broadcast content on radio, playlists, and digital channels and use content for promotional campaigns. No additional royalties shall be owed beyond the revenue share outlined in this Agreement unless otherwise agreed in writing.",
          },
          {
            num: "7",
            title: "CONTENT STANDARDS & REMOVAL",
            body: "Company reserves the right to reject, remove, or suspend any content that violates platform policies, conflicts with faith-based values, or breaches legal or copyright regulations. Company may act without prior notice where necessary.",
          },
          {
            num: "8",
            title: "TERM & TERMINATION",
            bullets: [
              "This Agreement remains in effect until terminated by either party",
              "Either party may terminate with 30 days written notice",
              "Content removal may take up to 90 days due to third-party platform processing",
              "Sections relating to payments, liability, and legal obligations shall survive termination.",
            ],
          },
          {
            num: "9",
            title: "PAYMENTS & TAXES",
            body: "Artist is responsible for all applicable taxes. Company may require tax documentation prior to payment. Payments may be withheld in cases of fraud, dispute, or policy violations.",
          },
          {
            num: "10",
            title: "LIABILITY & INDEMNIFICATION",
            body: "Artist agrees to indemnify, defend, and hold harmless Company, its affiliates, officers, and partners from any claims, damages, liabilities, or legal disputes arising from breach of this Agreement, copyright infringement, or unauthorized use of third-party content. Company shall not be liable for indirect, incidental, or consequential damages or platform outages, delays, or third-party failures.",
          },
          {
            num: "11",
            title: "LIMITATION OF LIABILITY",
            body: "To the maximum extent permitted by law, Company's total liability shall not exceed the total amount paid to Artist under this Agreement in the preceding 12 months.",
          },
          {
            num: "12",
            title: "GOVERNING LAW & DISPUTES",
            body: "This Agreement shall be governed by the laws of the State of California, USA. Any disputes shall be resolved in the courts of Contra Costa County, California, unless otherwise agreed.",
          },
          {
            num: "13",
            title: "DIGITAL CONSENT & SIGNATURE",
            bullets: [
              "Agrees this constitutes a legally binding electronic signature",
              "Confirms acceptance of all terms",
              "Acknowledges that digital submission is enforceable under applicable electronic signature laws",
            ],
            body: "By submitting this Agreement electronically, Artist:",
          },
          {
            num: "14",
            title: "ENTIRE AGREEMENT",
            body: "This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements or communications. Any amendments must be made in writing and agreed by both parties.",
          },
        ].map((sec) => (
          <AgreementSection key={sec.num} {...sec} />
        ))}
      </div>
    </div>
  );

  const renderAgreementForm = () => (
    <div className="bg-[#0B1834] border border-[#66FCF1]/30 rounded-lg p-6 space-y-6">
      <h3 className="text-xl font-bold text-[#66FCF1] uppercase">Artist Confirmation</h3>
      
      <div className="space-y-3">
        {[
          { key: "agreeTerms", label: "I have read and agree to the Digital Distribution & Artist Agreement" },
          { key: "confirmAccurate", label: "I confirm all information provided is accurate" },
          { key: "confirmRights", label: "I confirm I own or control all rights to submitted content" }
        ].map(({ key, label }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer text-gray-200">
            <input
              type="checkbox"
              checked={agreementForm[key as keyof typeof agreementForm] as boolean}
              onChange={(e) => setAgreementForm((p) => ({ ...p, [key]: e.target.checked }))}
              className="mt-1 w-4 h-4 cursor-pointer"
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-gray-400 text-sm">Full Name *</label>
          <input
            type="text"
            value={agreementForm.fullName}
            onChange={(e) => setAgreementForm((p) => ({ ...p, fullName: e.target.value }))}
            className="w-full py-2 px-4 bg-[#222F46] border-b-2 border-[#445d88] text-white outline-none"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-gray-400 text-sm">Stage Name (Optional)</label>
          <input
            type="text"
            value={agreementForm.stageName}
            onChange={(e) => setAgreementForm((p) => ({ ...p, stageName: e.target.value }))}
            className="w-full py-2 px-4 bg-[#222F46] border-b-2 border-[#445d88] text-white outline-none"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-gray-400 text-sm">Signature (Type Name) *</label>
          <input
            type="text"
            value={agreementForm.signatureTyped}
            onChange={(e) => setAgreementForm((p) => ({ ...p, signatureTyped: e.target.value }))}
            className="w-full py-2 px-4 bg-[#222F46] border-b-2 border-[#445d88] text-white outline-none italic"
            required
          />
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <label className="text-gray-400 text-sm block">Draw Signature (Optional but recommended)</label>
        <div className="border-2 border-dashed border-[#445d88] bg-[#1a2436] rounded-lg overflow-hidden relative select-none touch-none">
          <canvas
            ref={canvasRef}
            width={600}
            height={150}
            className="w-full h-[150px] cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
              <span className="text-xl">Sign Here</span>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs text-red-400 hover:text-red-300 transition"
          >
            Clear Signature
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
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
              <h3 className=" text-[1.5rem] font-medium hidden md:block">
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
              <div className={`mt-4 border p-4 text-white rounded-lg ${sellerApprovalStatus === "rejected"
                ? "bg-red-500/10 border-red-400/30"
                : "bg-yellow-400/10 border-yellow-400/30"
                }`}>
                {sellerApprovalStatus === "pending" && (
                  <div className="flex items-start gap-3">
                    <div className="text-yellow-300 text-xl mt-0.5">⏳</div>
                    <div>
                      <div className="font-semibold text-yellow-300">Application Under Review</div>
                      <div className="text-sm text-gray-300 mt-0.5">
                        Your seller contract has been submitted and is awaiting admin approval. We'll notify you by email once a decision has been made.
                      </div>
                    </div>
                  </div>
                )}
                {sellerApprovalStatus === "rejected" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="text-red-400 text-xl mt-0.5">✕</div>
                      <div className="flex-1">
                        <div className="font-semibold text-red-300">Application Disapproved</div>
                        <div className="text-sm text-gray-300 mt-0.5">
                          Your seller contract submission was not approved. Please review the reason below, update your form, and resubmit.
                        </div>
                        {sellerApprovalReason && (
                          <div className="mt-2 bg-red-500/15 border border-red-400/20 rounded-lg px-3 py-2">
                            <span className="text-xs text-red-300 uppercase tracking-wide font-semibold">Reason: </span>
                            <span className="text-sm text-gray-200">{sellerApprovalReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Pre-fill the form with existing user data
                        setAgreementForm({
                          agreeTerms: true, // assumption since they already agreed initially
                          confirmAccurate: true,
                          confirmRights: true,
                          fullName: (userData as any)?.digitalDistributionArtistName || "",
                          stageName: (userData as any)?.digitalDistributionStageName || "",
                          signatureTyped: (userData as any)?.digitalDistributionArtistSignature || "",
                        });
                        setResubmitModalOpen(true);
                      }}
                      className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-200 hover:text-white font-medium px-5 py-2 rounded-lg transition-all text-sm"
                    >
                      ✏️ Edit &amp; Resubmit Form
                    </button>
                  </div>
                )}
              </div>
            )}


            {accountType === "buyer" && (
              <div className="mt-4 bg-gradient-to-r from-[#0d2c7b] to-[#0b1834] border border-second/30 p-6 text-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-second mb-2">
                      Become a Seller
                    </h3>
                    <p className="text-gray-200 text-sm">
                      Upgrade your account to start selling your music albums. Reach a global audience and monetize your content.
                    </p>
                    <ul className="mt-3 text-sm text-gray-300 space-y-1">
                      <li>✓ Worldwide distribution</li>
                      <li>✓ Manage your albums and track sales</li>
                      <li>✓ Withdraw earnings directly</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setUpgradeModalOpen(true)}
                    className="bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out px-6 py-3 font-semibold whitespace-nowrap"
                  >
                    Upgrade Now
                  </button>
                </div>
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






                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="checkPolicy"
                        checked={checkPolicyAccepted}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPolicyModelOpen(true)
                          }
                          setCheckPolicyAccepted(e.target.checked)
                        }}
                        className="w-4 h-4 text-second bg-gray-700 border-gray-600 rounded focus:ring-second"
                      />
                      <label htmlFor="checkPolicy" className="text-sm text-gray-300 cursor-pointer">
                        I accept the Check Payment Security Policy
                      </label>
                    </div>



                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawing || (Number(balance) < 5) || !checkPolicyAccepted}
                      className=" mt-3 w-full bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out py-2 text-sm disabled:opacity-60 "
                    >
                      {withdrawing ? "Submitting..." : "Submit Request"}
                    </button>

                    {
                      (Number(balance) < 5) && (
                        <p className="text-red-500 text-sm mt-1 text-center">You don't have enough balance to widthraw.</p>
                      )
                    }


                  </div>
                </div>
              </div>
            )}

            {/* Upgrade to Seller Modal */}
            {upgradeModalOpen && accountType === "buyer" && (
              <div className=" fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center px-3 overflow-y-auto py-10 ">
                <div className=" w-full max-w-[50rem] bg-[#0b1834] border border-white/10 p-6 text-white max-h-[90vh] overflow-y-auto ">
                  <div className=" flex items-center justify-between gap-3 mb-6 sticky top-0 bg-[#0b1834] pb-4 border-b border-white/10 ">
                    <div>
                      <div className=" text-[1.5rem] font-semibold ">Upgrade to Seller Account</div>
                      <div className=" text-xs text-gray-200 mt-1 ">
                        Complete OTP verification and contract form to upgrade
                      </div>
                    </div>
                    <button
                      onClick={() => setUpgradeModalOpen(false)}
                      className=" text-white/80 hover:text-white transition-all duration-300 ease-in-out text-2xl "
                    >
                      ×
                    </button>
                  </div>

                  {/* OTP Verification Section */}
                  <div className=" bg-[#071126] p-4 mb-6 ">
                    <h3 className=" text-lg font-semibold mb-3 ">Email Verification</h3>
                    <p className=" text-sm text-gray-200 mb-4 ">
                      Verify your email to unlock the contract form.
                    </p>

                    <div className=" flex flex-col gap-3 ">
                      <button
                        type="button"
                        onClick={requestUpgradeOtp}
                        disabled={upgradeOtpSending || upgradeOtpVerified}
                        className=" bg-second text-black font-semibold px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed "
                      >
                        {upgradeOtpSending ? "Sending..." : upgradeOtpVerified ? "Verified ✓" : "Get OTP"}
                      </button>

                      {upgradeOtpSent && !upgradeOtpVerified && (
                        <div className=" flex gap-3 items-center ">
                          <input
                            type="text"
                            placeholder="Enter OTP"
                            value={upgradeOtp}
                            onChange={(e) => setUpgradeOtp(e.target.value)}
                            className=" flex-1 text-[1.1rem] py-2 px-4 outline-none bg-[#222F46] text-white placeholder:text-white/60 "
                          />
                          <button
                            type="button"
                            onClick={verifyUpgradeOtp}
                            disabled={upgradeOtpVerifying}
                            className=" bg-second text-black font-semibold px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed "
                          >
                            {upgradeOtpVerifying ? "Verifying..." : "Verify"}
                          </button>
                        </div>
                      )}

                      {upgradeOtpVerified && (
                        <span className=" text-green-300 font-semibold text-sm ">
                          ✓ OTP verified. Contract form unlocked below.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contract Form - Only show if OTP verified */}
                  {upgradeOtpVerified && (
                    <div className=" space-y-6 ">
                      <div className=" border-t border-gray-500 pt-6 ">
                        <h2 className=" text-[1.8rem] font-semibold mb-4 ">
                          HGC RADIO – DIGITAL DISTRIBUTION & ARTIST AGREEMENT
                        </h2>
                        <p className=" text-gray-300 text-sm mb-4 ">
                          This form is required for your music to be broadcast or distributed by Hallelujah Gospel Globally.
                        </p>
                      </div>

                      {renderContractText()}
                      {renderAgreementForm()}

                      {/* Submit Button */}
                      <div className=" sticky bottom-0 bg-[#0b1834] pt-4 border-t border-white/10 ">
                        <button
                          onClick={handleUpgradeSubmit}
                          disabled={upgrading}
                          className=" w-full bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out py-3 text-lg font-semibold disabled:opacity-60 "
                        >
                          {upgrading ? "Upgrading..." : "Submit Upgrade Request"}
                        </button>
                      </div>
                    </div>
                  )}
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
                {albums.map((album: any) => (
                  <div key={album._id} className=" group block border border-white/10 relative pb-[3rem]">
                    <Link
                      href={
                        accountType === "buyer"
                          ? `/albums/${album._id}`
                          : `/dashboard/${userData._id}/albums/${album._id}`
                      }
                      className="block w-full h-[17rem] relative overflow-hidden"
                    >
                      <Image
                        src={album.coverImg}
                        alt="Cover img"
                        fill
                        className="group-hover:scale-110 transition-all duration-300 ease-in-out object-contain"
                      />
                      {accountType === "seller" ? (
                        <div className=" absolute top-2 left-2 flex flex-col gap-1 ">
                          <div className="flex gap-2">
                            <div className=" text-xs bg-black/70 px-2 py-1 border border-white/10 ">
                              Sales: {Number(album.salesCount || 0)}
                            </div>
                            <div className=" text-xs bg-black/70 px-2 py-1 border border-white/10 ">
                              Rev: ${Number(album.totalRevenue || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className={`text-xs px-2 py-1 border border-white/10 uppercase font-bold w-fit ${album.approvalStatus === 'approved' ? 'bg-green-600/80' : album.approvalStatus === 'rejected' ? 'bg-red-600/80' : 'bg-yellow-600/80'}`}>
                            {album.approvalStatus || 'pending'}
                          </div>
                        </div>
                      ) : (
                        <div className=" absolute top-2 left-2 flex gap-2 ">
                          <div className=" text-xs bg-black/70 px-2 py-1 border border-white/10 ">
                            Purchased
                          </div>
                        </div>
                      )}
                    </Link>
                    <div className=" bg-[#0b1834] p-3 ">
                      <div className=" text-[1.4rem] font-medium line-clamp-1 ">
                        {album.title}
                      </div>

                      {album.approvalStatus === 'rejected' && album.approvalReason ? (
                        <div className="text-xs text-red-400 mt-1 line-clamp-1" title={album.approvalReason}>
                          Reason: {album.approvalReason}
                        </div>
                      ) : (
                        <div className=" mt-2 text-xs text-gray-200 ">
                          {accountType === "buyer"
                            ? "Click to view album"
                            : "Click to manage album"}
                        </div>
                      )}

                      <div className=" mt-3 flex items-center gap-3 ">
                        <div className=" relative w-[3.5rem] h-[3.5rem] rounded-full bg-blue-900 border border-white/20">
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
                    {album.approvalStatus === "rejected" && accountType === "seller" && (
                      <div className="absolute bottom-0 left-0 w-full">
                        <Link href={`/dashboard/${userData._id}/edit-album/${album._id}`} className="block w-full py-2 bg-red-600 hover:bg-red-500 text-white text-center text-sm font-semibold transition-colors">
                          Fix & Resubmit Album
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className=" text-gray-200 text-center h-[10rem] flex items-center justify-center ">
                {accountType === "buyer"
                  ? "You haven't purchased any albums yet."
                  : (
                    <div className=" text-gray-200 text-center h-[10rem] flex items-center justify-center flex-col gap-2 ">
                      <p>There are no album yet please add some albums</p>
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
                  )}
              </div>
            )}
          </div>
        </div>
      </div>




      {
        policyModelOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">

            {/* Modal Box */}
            <div className="bg-[#0b1834] w-[95%] md:w-[800px] max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col">

              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-semibold">
                  Partnership Designation & Revenue Allocation Policy
                </h2>
                <button
                  onClick={() => setPolicyModelOpen(false)}
                  className="text-gray-500 hover:text-black text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Content (Scrollable) */}
              <div className="p-6 overflow-y-auto text-sm space-y-4">

                <section>
                  <h3 className="font-semibold">1. Purpose</h3>
                  <p>
                    This policy explains how monetary gifts and partnership contributions
                    are tracked, credited, and distributed within our network.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold">2. Partner Designation</h3>
                  <p>
                    When submitting a monetary gift, donors may leave a message.
                    If supporting a specific person or program, the full name must be
                    included in the comment/memo section for proper credit.
                  </p>
                  <p className="mt-2 text-gray-600">
                    If no partner or program is referenced, support will be applied
                    to the General Network Fund.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold">3. Payment Matching & Tracking</h3>
                  <p>
                    All incoming payments are logged with date, time, amount, platform,
                    and memo text. Designated names are matched against our registered
                    partner database before allocation.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold">4. Revenue Distribution</h3>
                  <p>
                    For designated partner contributions:
                  </p>
                  <ul className="list-disc ml-6 mt-2">
                    <li>80% is allocated to the named partner.</li>
                    <li>20% is retained by the network for operational costs.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold">5. Dispute Protection</h3>
                  <p>
                    Only clearly designated payments will be credited to a partner.
                    In cases of dispute, transaction verification may be required.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold">6. Transparency</h3>
                  <p>
                    Partners may receive itemized earning summaries showing total
                    received, network portion, and net payout.
                  </p>
                </section>

              </div>

              {/* Footer */}
              <div className="p-4 border-t flex justify-end">
                <button
                  onClick={() => setPolicyModelOpen(false)}
                  className="px-5 py-2 bg-black text-white rounded-lg hover:opacity-90"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )
      }

      {/* Resubmit Form Modal */}
      {resubmitModalOpen && sellerApprovalStatus === "rejected" && (
        <div className="fixed inset-0 z-[9999] bg-black/75 flex items-start justify-center px-3 py-6 overflow-y-auto">
          <div className="w-full max-w-[52rem] bg-[#071126] border border-white/10 rounded-xl text-white shadow-2xl">

            {/* Header */}
            <div className="sticky top-0 bg-[#071126]/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
              <div>
                <p className="text-lg font-bold text-[#66FCF1]">Edit &amp; Resubmit Seller Form</p>
                <p className="text-xs text-gray-400 mt-0.5">Update your contract details and resubmit for admin review.</p>
              </div>
              <button onClick={() => setResubmitModalOpen(false)} className="text-white/50 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Rejection reason reminder */}
              {sellerApprovalReason && (
                <div className="bg-red-500/10 border border-red-400/20 rounded-lg px-4 py-3">
                  <p className="text-xs text-red-300 font-semibold uppercase tracking-wide mb-1">Reason for Previous Rejection</p>
                  <p className="text-sm text-gray-200">{sellerApprovalReason}</p>
                </div>
              )}

              {/* Contract sections */}
              <div className="space-y-5">
                <h3 className="text-base font-bold text-[#66FCF1] uppercase tracking-wider">HGC RADIO – DIGITAL DISTRIBUTION & ARTIST AGREEMENT</h3>
                <p className="text-sm text-gray-300 mb-4">Please complete the Artist Confirmation below to resubmit your agreement.</p>
                {renderContractText()}
                {renderAgreementForm()}
              </div>
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 px-6 py-4 bg-[#071126]/95 backdrop-blur border-t border-white/10 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setResubmitModalOpen(false)}
                className="px-5 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/30 text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResubmit}
                disabled={resubmitting}
                className="px-6 py-2 bg-[#66FCF1] text-[#060f24] font-bold rounded-lg hover:bg-[#66FCF1]/90 disabled:opacity-60 transition-all text-sm"
              >
                {resubmitting ? "Submitting..." : "Resubmit for Review"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Page;
