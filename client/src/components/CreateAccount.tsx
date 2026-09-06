/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import bg1 from "@/assets/sponsor.jpg";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IoIosArrowForward } from "react-icons/io";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useData } from "@/context/Context";
import { ButtonLoading } from "@/utils/Loading";
import axios from "axios";

// ─── Types ───────────────────────────────────────────────────────────────────

type BasicFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
};

type AgreementFormData = {
  // Checkboxes
  agreeTerms: boolean;
  confirmAccurate: boolean;
  confirmRights: boolean;
  // Fields
  fullName: string;
  stageName: string;
  username: string;
  signatureTyped: string;
};

type AppStage =
  | "idle"          // landing page
  | "register"      // simple register form (incl OTP)
  | "registered"    // account created, show comparison + CTA
  | "agreement"     // show HGC agreement form
  | "submitting";   // submitting agreement

// ─── Cloudinary upload helper ─────────────────────────────────────────────────

const CLOUD_NAME = "ddlwhkn3b";
const UPLOAD_PRESET = "images_preset";

async function uploadDataUrlToCloudinary(dataUrl: string): Promise<string | null> {
  try {
    // Convert base64 data URL to Blob
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

// ─── Main Component ───────────────────────────────────────────────────────────

const PageWithCreateAccount = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userData, setUserData } = useData();

  // ── Stage ──────────────────────────────────────────────────────────────────
  const [stage, setStage] = useState<AppStage>("idle");

  // ── Registration form ──────────────────────────────────────────────────────
  const formRef = useRef<HTMLDivElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [basicForm, setBasicForm] = useState<BasicFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
  });

  // ── OTP ────────────────────────────────────────────────────────────────────
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // ── Creating account ───────────────────────────────────────────────────────
  const [isCreating, setIsCreating] = useState(false);

  // ── Agreement form ─────────────────────────────────────────────────────────
  const agreementRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [agreementForm, setAgreementForm] = useState<AgreementFormData>({
    agreeTerms: false,
    confirmAccurate: false,
    confirmRights: false,
    fullName: "",
    stageName: "",
    username: "",
    signatureTyped: "",
  });
  const [isSubmittingAgreement, setIsSubmittingAgreement] = useState(false);

  /*
    Live availability for the artist handle. Debounced so a burst of keystrokes
    makes one request; a late reply for a stale value is dropped by the cleanup.
  */
  const [usernameStatus, setUsernameStatus] = useState<{
    state: "idle" | "checking" | "available" | "taken";
    message: string;
  }>({ state: "idle", message: "" });

  useEffect(() => {
    const value = agreementForm.username.trim().toLowerCase();
    if (!value) {
      setUsernameStatus({ state: "idle", message: "" });
      return;
    }

    let cancelled = false;
    setUsernameStatus({ state: "checking", message: "Checking availability..." });

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/username-available?username=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        if (cancelled) return;
        setUsernameStatus({
          state: data?.available ? "available" : "taken",
          message: data?.message || "",
        });
      } catch {
        if (!cancelled) setUsernameStatus({ state: "idle", message: "" });
      }
    }, 400);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [agreementForm.username]);

  // ── Registered user id (saved after account creation) ──────────────────────
  const [registeredUserId, setRegisteredUserId] = useState("");
  const [registeredUserToken, setRegisteredUserToken] = useState("");

  // ── Helpers ────────────────────────────────────────────────────────────────
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) => {
    if (!/^.{8,}$/.test(password)) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
    if (!/\d/.test(password)) return "Password must include at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return "Password must include at least one special character.";
    return "";
  };

  const toastError = (msg: string) =>
    toast.error(msg, { style: { background: "#8B0000", border: "none", color: "white" } });
  const toastSuccess = (msg: string) =>
    toast.success(msg, { style: { background: "green", border: "none", color: "white" } });

  const scrollToForm = () =>
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  const scrollToAgreement = () =>
    setTimeout(() => agreementRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  // ── OTP timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ── Auto-open from URL param ───────────────────────────────────────────────
  useEffect(() => {
    if (searchParams?.get("openForm") === "true") {
      setStage("register");
      scrollToForm();
    }
  }, [searchParams]);

  // ── OTP actions ────────────────────────────────────────────────────────────
  const requestOtp = async () => {
    if (!validateEmail(basicForm.email)) {
      toastError("Please enter a valid email address first.");
      return;
    }
    if (!basicForm.name.trim()) {
      toastError("Please enter your full name first.");
      return;
    }
    setOtpSending(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/register-otp/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: basicForm.email.trim().toLowerCase() }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toastError(data?.message || data?.error || "Failed to send OTP");
        return;
      }
      setOtpSent(true);
      setOtpVerified(false);
      setOtpToken("");
      setResendTimer(60);
      toastSuccess("OTP sent to your email.");
    } catch (err: any) {
      toastError(err?.message || "Failed to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const resendOtp = async () => {
    if (!validateEmail(basicForm.email)) {
      toastError("Please enter a valid email address first.");
      return;
    }
    setOtpSending(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/register-otp/resend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: basicForm.email.trim().toLowerCase() }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toastError(data?.message || data?.error || "Failed to resend OTP");
        return;
      }
      setResendTimer(60);
      toastSuccess("OTP resent to your email.");
    } catch (err: any) {
      toastError(err?.message || "Failed to resend OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpValue.trim()) {
      toastError("Please enter OTP.");
      return;
    }
    setOtpVerifying(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/register-otp/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: basicForm.email.trim().toLowerCase(),
            otp: otpValue.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toastError(data?.message || data?.error || "OTP verification failed");
        return;
      }
      setOtpVerified(true);
      setOtpToken(data?.otpToken || "");
      toastSuccess("Email verified! You can now create your account.");
    } catch (err: any) {
      toastError(err?.message || "OTP verification failed");
    } finally {
      setOtpVerifying(false);
    }
  };

  // ── Create account (as buyer) ──────────────────────────────────────────────
  const handleCreateAccount = async () => {
    if (!validateEmail(basicForm.email)) {
      toastError("Please enter a valid email address.");
      return;
    }
    const pwdErr = validatePassword(basicForm.password);
    if (pwdErr) { toastError(pwdErr); return; }
    if (basicForm.password !== basicForm.confirmPassword) {
      toastError("Passwords do not match.");
      return;
    }
    if (!otpVerified) {
      toastError("Please verify your email with OTP first.");
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        name: basicForm.name.trim(),
        email: basicForm.email.trim().toLowerCase(),
        password: basicForm.password,
        country: basicForm.country,
        city: basicForm.city,
        state: basicForm.state,
        zipCode: basicForm.zipCode,
        accountType: "buyer",
        // Pass the OTP token for registration — backend verifies but checks purpose "register_seller"
        // We'll register as buyer, so we skip seller OTP requirement
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        toastError(data?.error || "Something went wrong!");
        return;
      }

      if (data?.user?._id) {
        setUserData({ ...data.user, token: data.token });
        setRegisteredUserId(data.user._id);
        setRegisteredUserToken(data.token);
        toastSuccess("Account created successfully!");
        setStage("registered");
        scrollToForm();
      } else {
        toastError("Unexpected response from server.");
      }
    } catch (err: any) {
      toastError(err.message || "Something went wrong.");
    } finally {
      setIsCreating(false);
    }
  };

  // ── Canvas signature ───────────────────────────────────────────────────────
  const getCanvasPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#ffffff";
    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // ── Submit Artist Agreement ────────────────────────────────────────────────
  const handleSubmitAgreement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreementForm.agreeTerms || !agreementForm.confirmAccurate || !agreementForm.confirmRights) {
      toastError("Please check all confirmation boxes.");
      return;
    }
    if (!agreementForm.fullName.trim()) {
      toastError("Please enter your Full Name.");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(agreementForm.username.trim().toLowerCase())) {
      toastError("Choose a username: 3-20 characters, lowercase letters, numbers or underscore.");
      return;
    }
    if (usernameStatus.state === "taken") {
      toastError("That username is already taken.");
      return;
    }
    if (!agreementForm.signatureTyped.trim() && !hasSignature) {
      toastError("Please provide a signature (draw or type).");
      return;
    }

    const userId = registeredUserId || userData._id;
    const authToken = registeredUserToken || userData.token || "";

    if (!userId) {
      toastError("User session not found. Please log in.");
      return;
    }

    setIsSubmittingAgreement(true);
    try {
      // Upload canvas signature to Cloudinary if drawn
      let artistSignatureUrl = "";
      if (hasSignature && canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL("image/png");
        const uploaded = await uploadDataUrlToCloudinary(dataUrl);
        if (!uploaded) {
          toastError("Failed to upload signature. Please try again.");
          setIsSubmittingAgreement(false);
          return;
        }
        artistSignatureUrl = uploaded;
      }

      const today = new Date().toISOString().split("T")[0];

      // First request upgrade OTP (using existing buyer account email)
      // We need to use the upgrade-otp flow
      // Step 1: Request OTP for upgrade
      const otpReqRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/upgrade-otp/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: basicForm.email.trim().toLowerCase() }),
        }
      );
      const otpReqData = await otpReqRes.json();
      if (!otpReqRes.ok) {
        toastError(otpReqData?.message || "Failed to initiate upgrade.");
        setIsSubmittingAgreement(false);
        return;
      }

      // Show OTP dialog — we'll do inline OTP verification for the upgrade
      // Store pending submission state and show upgrade OTP UI
      setPendingAgreementData({
        userId,
        authToken,
        artistSignatureUrl,
        fullName: agreementForm.fullName,
        stageName: agreementForm.stageName,
        username: agreementForm.username.trim().toLowerCase(),
        signatureTyped: agreementForm.signatureTyped,
        date: today,
      });
      setUpgradeOtpSent(true);
      toastSuccess("OTP sent to your email to verify Artist registration.");
    } catch (err: any) {
      toastError(err.message || "Something went wrong.");
    } finally {
      setIsSubmittingAgreement(false);
    }
  };

  // ── Upgrade OTP state ─────────────────────────────────────────────────────
  const [upgradeOtpSent, setUpgradeOtpSent] = useState(false);
  const [upgradeOtpValue, setUpgradeOtpValue] = useState("");
  const [upgradeOtpVerifying, setUpgradeOtpVerifying] = useState(false);
  const [upgradeResendTimer, setUpgradeResendTimer] = useState(0);
  const [pendingAgreementData, setPendingAgreementData] = useState<{
    userId: string;
    authToken: string;
    artistSignatureUrl: string;
    fullName: string;
    stageName: string;
    username: string;
    signatureTyped: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (upgradeResendTimer > 0) {
      interval = setInterval(() => setUpgradeResendTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [upgradeResendTimer]);

  const resendUpgradeOtp = async () => {
    if (!pendingAgreementData) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/upgrade-otp/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: basicForm.email.trim().toLowerCase() }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toastError(data?.message || "Failed to resend OTP");
        return;
      }
      setUpgradeResendTimer(60);
      toastSuccess("OTP resent.");
    } catch {
      toastError("Failed to resend OTP");
    }
  };

  const verifyUpgradeOtpAndSubmit = async () => {
    if (!upgradeOtpValue.trim()) {
      toastError("Please enter OTP.");
      return;
    }
    if (!pendingAgreementData) return;

    setUpgradeOtpVerifying(true);
    try {
      // Verify upgrade OTP
      const verifyRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/upgrade-otp/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: basicForm.email.trim().toLowerCase(),
            otp: upgradeOtpValue.trim(),
          }),
        }
      );
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        toastError(verifyData?.message || "OTP verification failed");
        return;
      }

      const upgradeOtpToken = verifyData.otpToken;

      // Now call upgrade-to-seller
      const upgradeRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/upgrade-to-seller`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: pendingAgreementData.userId,
            otpToken: upgradeOtpToken,
            // Name / acknowledgment fields
            digitalDistributionSummaryName: pendingAgreementData.fullName,
            digitalDistributionSummarySignature: pendingAgreementData.signatureTyped,
            digitalDistributionSummaryDate: pendingAgreementData.date,
            digitalDistributionArtistName: pendingAgreementData.fullName,
            digitalDistributionArtistSignature: pendingAgreementData.signatureTyped,
            digitalDistributionArtistDate: pendingAgreementData.date,
            artistSignatureUrl: pendingAgreementData.artistSignatureUrl,
            username: pendingAgreementData.username,
          }),
        }
      );
      const upgradeData = await upgradeRes.json();
      if (!upgradeRes.ok) {
        toastError(upgradeData?.error || "Failed to submit artist registration.");
        return;
      }

      // Update local user context
      if (upgradeData?.user) {
        setUserData({ ...upgradeData.user, token: pendingAgreementData.authToken });
      }

      toastSuccess("Artist registration submitted! Pending admin review.");
      router.push(`/dashboard/${pendingAgreementData.userId}`);
    } catch (err: any) {
      toastError(err.message || "Something went wrong.");
    } finally {
      setUpgradeOtpVerifying(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Hero / Landing ── */}
      <div className="bg-[#071126] py-16">
        <div className="max-w-[1500px] mx-auto px-3">
          <div className="flex flex-col lg:flex-row justify-between gap-10">
            <div className="lg:w-[60%] space-y-4">
              <h2 className="text-4xl font-bold text-white">
                Sell Album. (Distribution Contract)
              </h2>
              <h3 className="text-xl font-semibold text-[#66FCF1]">
                Expanding the reach of your music ministry starts by partnering with us!
              </h3>
              <div className="text-lg space-y-3 text-white">
                <p>
                  Hallelujah Gospel offers unparalleled worldwide distribution of the Gospel
                  music you make.
                </p>
                <p>
                  Hallelujah Gospel understands where your music needs to be. As we speak, the
                  platform is in the making to provide you with only the best tool to build your
                  global audience. Be the first to know when it&rsquo;s ready to go live!
                  Simply select the Create Account button below to furnish us with your contact
                  information so we could notify you and send you regular updates.
                </p>
                <p>
                  High visibility - means more exposure and higher viewership of your music in
                  the retail marketplace. Display of your music catalog - means providing our
                  site users and listeners a vast selection of Gospel music through access of
                  your catalog on their preferred device Monetary blessings- the listening
                  audience who purchase your music are also enabled to give financially toward
                  your ministries.
                </p>
                <p>
                  Create a connection - means our distribution platform is designed to show
                  your music at its best and encourage sales. We believe that when Gospel music
                  supporters make a connection with their favorite artists, they want to support
                  them all the way.
                </p>
              </div>
              {stage === "idle" && !userData._id && (
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setStage("register");
                      scrollToForm();
                    }}
                    className="relative bg-[#0d2c7b] hover:bg-transparent overflow-hidden font-semibold text-lg px-7 py-2 group text-white"
                  >
                    <span className="relative z-10">Create Your Account</span>
                    <span className="absolute inset-0 bg-second scale-x-0 origin-center transition-transform duration-300 ease-out group-hover:scale-x-100" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="bg-[#0B1834] space-y-5 p-4 text-white">
                <h2 className="text-4xl font-bold">RELATED PAGES</h2>
                <div className="space-y-5">
                  {userData._id ? (
                    <Link
                      href={`/dashboard/${userData._id}`}
                      className="flex items-center gap-3 hover:text-second"
                    >
                      <IoIosArrowForward className="text-second" size={25} />
                      <span className="font-medium text-xl">Dashboard</span>
                    </Link>
                  ) : (
                    <Link href="/login" className="flex items-center gap-3 hover:text-second">
                      <IoIosArrowForward className="text-second" size={25} />
                      <span className="font-medium text-xl">Login Account</span>
                    </Link>
                  )}
                  <Link href="/about" className="flex items-center gap-3 hover:text-second">
                    <IoIosArrowForward className="text-second" size={25} />
                    <span className="font-medium text-xl">About Us</span>
                  </Link>
                  <Link
                    href="/privacy-policy"
                    className="flex items-center gap-3 hover:text-second"
                  >
                    <IoIosArrowForward className="text-second" size={25} />
                    <span className="font-medium text-xl">Privacy Policy</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          STAGE: register
          ════════════════════════════════════════════════════════ */}
      {stage === "register" && (
        <div
          ref={formRef}
          className="relative py-20 bg-cover bg-no-repeat"
          style={{ backgroundImage: `url(${bg1.src})` }}
        >
          <div className="absolute inset-0 bg-black/60 z-0" />
          <div className="relative z-10 max-w-[900px] mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-second text-center mb-10">
              Create Account
            </h2>

            {/* Basic fields grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { name: "name", placeholder: "Your Full Name", type: "text" },
                { name: "email", placeholder: "Your Email", type: "email" },
                { name: "password", placeholder: "Password", type: "password" },
                { name: "confirmPassword", placeholder: "Confirm Password", type: "password" },
                { name: "city", placeholder: "City", type: "text" },
                { name: "state", placeholder: "State", type: "text" },
                { name: "country", placeholder: "Country", type: "text" },
                { name: "zipCode", placeholder: "Zip Code", type: "text" },
              ].map(({ name, placeholder, type }) => {
                const isPass = name === "password";
                const isConfPass = name === "confirmPassword";
                let inputType = type;
                if (isPass && showPassword) inputType = "text";
                if (isConfPass && showConfirmPassword) inputType = "text";

                return (
                  <div key={name} className="relative">
                    <input
                      type={inputType}
                      name={name}
                      placeholder={placeholder}
                      value={basicForm[name as keyof BasicFormData]}
                      onChange={(e) =>
                        setBasicForm((prev) => ({ ...prev, [name]: e.target.value }))
                      }
                      onBlur={
                        name === "email" && !otpVerified
                          ? () => {
                              // reset OTP state if email changes
                              setOtpSent(false);
                              setOtpVerified(false);
                              setOtpValue("");
                              setOtpToken("");
                            }
                          : undefined
                      }
                      className={`w-full text-[1.05rem] py-3 px-4 outline-none bg-[#1a2540] text-white placeholder:text-white/50 border border-white/10 focus:border-second/60 transition-colors ${
                        isPass || isConfPass ? "pr-11" : ""
                      }`}
                      required
                    />
                    {(isPass || isConfPass) && (
                      <button
                        type="button"
                        onClick={() =>
                          isPass
                            ? setShowPassword((p) => !p)
                            : setShowConfirmPassword((p) => !p)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {isPass
                          ? showPassword
                            ? <FaEyeSlash size={19} />
                            : <FaEye size={19} />
                          : showConfirmPassword
                          ? <FaEyeSlash size={19} />
                          : <FaEye size={19} />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* OTP Section */}
            <div className="mt-7 bg-[#0B1834]/80 rounded p-5 space-y-4 border border-white/10">
              <p className="text-gray-300 font-medium">
                Verify your email to create account
              </p>

              {!otpVerified ? (
                <>
                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      type="button"
                      onClick={requestOtp}
                      disabled={otpSending || otpSent}
                      className="bg-second text-black font-semibold px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition"
                    >
                      {otpSending ? "Sending…" : otpSent ? "OTP Sent ✓" : "Send OTP"}
                    </button>

                    {otpSent && (
                      <>
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                          className="text-[1rem] py-2 px-4 outline-none w-40 bg-[#222F46] text-white placeholder:text-white/50 border border-white/10"
                        />
                        <button
                          type="button"
                          onClick={verifyOtp}
                          disabled={otpVerifying}
                          className="bg-second text-black font-semibold px-5 py-2 disabled:opacity-60"
                        >
                          {otpVerifying ? "Verifying…" : "Verify OTP"}
                        </button>
                        {resendTimer > 0 ? (
                          <span className="text-gray-400 text-sm">
                            Resend in {resendTimer}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={resendOtp}
                            disabled={otpSending}
                            className="text-second text-sm hover:underline disabled:opacity-60"
                          >
                            {otpSending ? "Resending…" : "Resend OTP"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-green-400 font-semibold flex items-center gap-2">
                  ✓ Email verified
                </p>
              )}
            </div>

            {/* Create Account Button */}
            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={handleCreateAccount}
                disabled={isCreating || !otpVerified}
                className="relative bg-[#0d2c7b] text-white overflow-hidden font-semibold text-lg px-10 py-3 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">
                  {isCreating ? <ButtonLoading /> : "Create Account"}
                </span>
                <span className="absolute inset-0 bg-second scale-x-0 origin-center transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </button>
            </div>

            <p className="text-center text-gray-400 mt-4 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-second hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          STAGE: registered — Comparison table + CTA
          ════════════════════════════════════════════════════════ */}
      {(stage === "registered") && (
        <div ref={formRef} className="bg-[#071126] py-16">
          <div className="max-w-[1100px] mx-auto px-4 space-y-12">

            {/* Welcome banner */}
            <div className="text-center space-y-2">
              <div className="inline-block bg-green-500/20 border border-green-500/40 rounded-full px-5 py-1 text-green-400 font-semibold text-sm mb-2">
                ✓ Account Created Successfully
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                Welcome to HALLELUJAH GOSPEL GLOBALLY LLC
              </h2>
              <p className="text-gray-400 max-w-[700px] mx-auto">
                Your account has been created. See how we compare to traditional radio below.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-left text-sm md:text-base">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 px-5 text-second font-bold uppercase tracking-wider bg-[#0B1834] w-[30%]">
                      Feature
                    </th>
                    <th className="py-4 px-5 text-white font-bold bg-[#0d1f47] w-[35%]">
                      Traditional Radio
                    </th>
                    <th className="py-4 px-5 text-second font-bold bg-[#0B1834] w-[35%]">
                      HALLELUJAH GOSPEL GLOBALLY LLC
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {[
                    {
                      feature: "Music played",
                      traditional: "Yes",
                      hgc: "Yes",
                    },
                    {
                      feature: "Revenue for artist",
                      traditional:
                        "Very limited; usually royalties via PROs only",
                      hgc: "Actively generated through streaming, sales, promotion, and licensing managed by the platform",
                    },
                    {
                      feature: "Artist representation",
                      traditional: "Rare; usually none",
                      hgc: "Platform represents artists for promotion, sales, licensing, and revenue generation",
                    },
                    {
                      feature: "PRO compliance",
                      traditional: "Managed via blanket licenses or PRO agreements",
                      hgc: "Artists retain PRO membership; platform acts transparently and acquires licenses if needed",
                    },
                    {
                      feature: "Goal",
                      traditional: "Entertainment / audience retention",
                      hgc: "Helping artists make a living, feed their families, and grow a career",
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-white/5 ${
                        i % 2 === 0 ? "bg-[#071126]" : "bg-[#091830]"
                      }`}
                    >
                      <td className="py-4 px-5 font-semibold text-white">{row.feature}</td>
                      <td className="py-4 px-5 text-gray-400">{row.traditional}</td>
                      <td className="py-4 px-5 text-green-300 font-medium">{row.hgc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Become an Artist CTA */}
            <div className="bg-[#0B1834] border border-white/10 rounded-xl p-8 text-center space-y-5">
              <h3 className="text-2xl md:text-3xl font-bold text-second">
                Become an Artist on HGC Radio
              </h3>
              <p className="text-gray-300 max-w-[600px] mx-auto text-base">
                To upload and distribute your music, you must complete the{" "}
                <span className="text-white font-semibold">
                  Digital Distribution &amp; Artist Agreement
                </span>
                .
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                <button
                  onClick={() => {
                    setStage("agreement");
                    scrollToAgreement();
                  }}
                  className="bg-second text-black font-bold px-8 py-3 rounded hover:opacity-90 transition-opacity text-lg"
                >
                  Start Artist Registration
                </button>
                <button
                  onClick={() => router.push(`/dashboard/${registeredUserId || userData._id}`)}
                  className="border border-second text-second font-bold px-8 py-3 rounded hover:bg-second hover:text-black transition-all text-lg"
                >
                  Go to the Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          STAGE: agreement — HGC Artist Distribution Agreement
          ════════════════════════════════════════════════════════ */}
      {stage === "agreement" && (
        <div ref={agreementRef} className="bg-[#071126] text-white py-16">
          <div className="max-w-[1000px] mx-auto px-4">
            {/* Title */}
            <div className="text-center mb-10 space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-second uppercase tracking-wide">
                HGC RADIO – DIGITAL DISTRIBUTION &amp; ARTIST AGREEMENT
              </h2>
              <div className="w-full border-t border-gray-600 mt-4" />
            </div>

            <form onSubmit={handleSubmitAgreement} className="space-y-10">
              {/* Preamble */}
              <div className="bg-[#0B1834] border border-white/10 rounded-lg p-6 space-y-3 text-gray-300">
                <p>
                  This Digital Distribution &amp; Artist Agreement (&ldquo;Agreement&rdquo;) is entered
                  into by and between{" "}
                  <span className="text-white font-semibold">
                    Hallelujah Gospel Globally (HGC Radio)
                  </span>{" "}
                  (&ldquo;Company&rdquo;) and the registering artist (&ldquo;Artist&rdquo;), effective as
                  of the date of submission and acceptance (&ldquo;Effective Date&rdquo;).
                </p>
                <p className="text-second font-medium">
                  By submitting content or registering, Artist agrees to be bound by the terms
                  of this Agreement.
                </p>
              </div>

              {/* Agreement sections */}
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
              <div className="space-y-4 border-b border-gray-700 pb-8">
                <h3 className="text-xl font-bold text-second">5. REVENUE SHARE</h3>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">5.1 Definitions</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
                    <li><strong>Gross Revenue:</strong> All income derived from exploitation of Artist's content.</li>
                    <li><strong>Net Revenue:</strong> Gross Revenue minus third-party fees, commissions, platform costs, taxes, refunds, and chargebacks.</li>
                    <li><strong>Net Profit (Merchandise):</strong> Merchandise revenue minus production, manufacturing, shipping, transaction fees, taxes, returns, and related costs.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">5.2 Music Distribution Revenue</h4>
                  <p className="text-gray-300">
                    Artist shall receive <span className="text-second font-bold">60%–70%</span> of Net Revenue generated from streaming, downloads, and licensing. The exact percentage may vary depending on promotional campaigns, partnerships, or special agreements.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">5.3 Merchandise Revenue (Optional)</h4>
                  <p className="text-gray-300">
                    If Artist participates in Company's merchandise program: Artist receives{" "}
                    <span className="text-second font-bold">35%</span> of Net Profit · HGC Radio receives{" "}
                    <span className="text-second font-bold">65%</span> of Net Profit.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">5.4 Accounting &amp; Payments</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
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

              {/* ── Artist Confirmation ── */}
              <div className="bg-[#0B1834] border border-second/30 rounded-lg p-7 space-y-6">
                <h3 className="text-xl font-bold text-second uppercase">
                  Artist Confirmation
                </h3>

                {/* Checkboxes */}
                <div className="space-y-3">
                  {[
                    { key: "agreeTerms", label: "I have read and agree to this Agreement" },
                    { key: "confirmAccurate", label: "I confirm all information provided is accurate" },
                    {
                      key: "confirmRights",
                      label: "I confirm I own or control all rights to submitted content",
                    },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-start gap-3 cursor-pointer text-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={agreementForm[key as keyof AgreementFormData] as boolean}
                        onChange={(e) =>
                          setAgreementForm((p) => ({ ...p, [key]: e.target.checked }))
                        }
                        className="mt-1 accentColor-second w-4 h-4 cursor-pointer"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                {/* Name fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-gray-400 text-sm">Full Name *</label>
                    <input
                      type="text"
                      value={agreementForm.fullName}
                      onChange={(e) =>
                        setAgreementForm((p) => ({ ...p, fullName: e.target.value }))
                      }
                      className="w-full py-2 px-4 bg-[#222F46] border-b-2 border-[#445d88] text-white outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 text-sm">Stage Name (Optional)</label>
                    <input
                      type="text"
                      value={agreementForm.stageName}
                      onChange={(e) =>
                        setAgreementForm((p) => ({ ...p, stageName: e.target.value }))
                      }
                      className="w-full py-2 px-4 bg-[#222F46] border-b-2 border-[#445d88] text-white outline-none"
                    />
                  </div>
                  {/*
                    The handle supporters use to find this artist. Checked while
                    typing so a clash surfaces here, not after the whole contract.
                  */}
                  <div className="space-y-1">
                    <label className="text-gray-400 text-sm">Username *</label>
                    <div className="flex items-center bg-[#222F46] border-b-2 border-[#445d88]">
                      <span className="pl-4 text-gray-400">@</span>
                      <input
                        type="text"
                        value={agreementForm.username}
                        onChange={(e) =>
                          setAgreementForm((p) => ({ ...p, username: e.target.value.toLowerCase() }))
                        }
                        placeholder="yourhandle"
                        className="w-full py-2 px-2 bg-transparent text-white outline-none"
                      />
                    </div>
                    <p className={`text-xs ${usernameStatus.state === "taken" ? "text-red-400" : usernameStatus.state === "available" ? "text-green-400" : "text-gray-500"}`}>
                      {usernameStatus.message || "3-20 characters: lowercase letters, numbers or underscore."}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 text-sm">Signature (Type Name) *</label>
                    <input
                      type="text"
                      value={agreementForm.signatureTyped}
                      onChange={(e) =>
                        setAgreementForm((p) => ({ ...p, signatureTyped: e.target.value }))
                      }
                      className="w-full py-2 px-4 bg-[#222F46] border-b-2 border-[#445d88] text-white outline-none font-cursive italic"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-400 text-sm">Date</label>
                    <input
                      type="text"
                      value={new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      readOnly
                      className="w-full py-2 px-4 bg-[#1a2540] border-b-2 border-[#445d88] text-gray-400 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Canvas Signature */}
                <div className="space-y-2">
                  <label className="text-gray-300 text-sm font-medium block">
                    Draw your Signature below:
                  </label>
                  <div className="border border-white/20 rounded overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={700}
                      height={180}
                      className="w-full bg-[#111827] cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={endDrawing}
                      onMouseLeave={endDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={endDrawing}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">
                      {hasSignature ? "✓ Signature captured" : "Draw in the box above"}
                    </span>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Upgrade OTP verification (shown after form submit) */}
                {upgradeOtpSent && (
                  <div className="bg-[#071126] border border-second/30 rounded-lg p-5 space-y-3">
                    <p className="text-gray-200 font-medium">
                      Enter the OTP sent to your email to confirm artist registration:
                    </p>
                    <div className="flex flex-wrap gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        value={upgradeOtpValue}
                        onChange={(e) => setUpgradeOtpValue(e.target.value)}
                        className="text-[1rem] py-2 px-4 outline-none w-40 bg-[#222F46] text-white placeholder:text-white/50 border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={verifyUpgradeOtpAndSubmit}
                        disabled={upgradeOtpVerifying}
                        className="bg-second text-black font-semibold px-5 py-2 disabled:opacity-60 hover:opacity-90"
                      >
                        {upgradeOtpVerifying ? "Verifying…" : "Confirm & Submit"}
                      </button>
                      {upgradeResendTimer > 0 ? (
                        <span className="text-gray-400 text-sm">
                          Resend in {upgradeResendTimer}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={resendUpgradeOtp}
                          className="text-second text-sm hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit button */}
                {!upgradeOtpSent && (
                  <button
                    type="submit"
                    disabled={isSubmittingAgreement}
                    className="w-full bg-second text-black font-bold text-lg py-4 rounded hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition mt-2"
                  >
                    {isSubmittingAgreement ? <ButtonLoading /> : "Submit for Review"}
                  </button>
                )}
              </div>
            </form>

            {/* Back to dashboard */}
            <div className="mt-8 text-center">
              <button
                onClick={() => router.push(`/dashboard/${registeredUserId || userData._id}`)}
                className="text-gray-400 hover:text-second transition text-sm"
              >
                ← Go to Dashboard without completing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Helper: Agreement Section ────────────────────────────────────────────────

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
    <div className="space-y-3 border-b border-gray-700 pb-7">
      <h3 className="text-lg font-bold text-second">
        {num}. {title}
      </h3>
      {body && <p className="text-gray-300">{body}</p>}
      {bullets && (
        <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {footer && <p className="text-gray-400 text-sm mt-1">{footer}</p>}
    </div>
  );
}

export default PageWithCreateAccount;
