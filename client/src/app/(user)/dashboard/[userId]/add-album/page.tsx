"use client";

import Breadcrum from "@/components/Breadcrum";
import React, { useEffect, useState } from "react";
import bg2 from "@/assets/previous-show.jpg";
import Link from "next/link";
import { useData } from "@/context/Context";
import { ButtonLoading, PageLoading, SubmitLoading } from "@/utils/Loading";
import { uploadFile, uploadVideo } from "@/utils/imageUpload";
import { FaXmark } from "react-icons/fa6";
import Image from "next/image";
import { FaCloudUploadAlt, FaTrash } from "react-icons/fa";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SongType {
  name: string;
  duration: number;
  url: string;
}

interface FormDataType {
  title: string;
  description: string;
  coverImg: string;
  price: string | number;
  releaseYear: string | number;
  songs: SongType[];
}

const formatMaybeDate = (value: unknown) => {
  if (!value) return "-";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const AgreementField = ({ label, value }: { label: string; value: unknown }) => {
  const display =
    value === undefined || value === null || value === "" ? "-" : String(value);
  return (
    <div className="border border-white/10 p-3 bg-[#0b1834]/60">
      <div className="text-xs text-gray-300">{label}</div>
      <div className="text-sm text-white break-words">{display}</div>
    </div>
  );
};

const AgreementModal = ({
  open,
  onClose,
  userData,
}: {
  open: boolean;
  onClose: () => void;
  userData: any;
}) => {
  if (!open) return null;

  const hasAnyAgreement =
    Boolean(userData?.initialGrantAuthorization) ||
    Boolean(userData?.initialOwnershipRepresentation) ||
    Boolean(userData?.initialLicensingProtection) ||
    Boolean(userData?.initialAffiliateUse) ||
    Boolean(userData?.initialWaiverCompensation) ||
    Boolean(userData?.initialWarranties) ||
    Boolean(userData?.initialIndemnification) ||
    Boolean(userData?.initialPublicityPromotion) ||
    Boolean(userData?.initialLimitationLiability) ||
    Boolean(userData?.initialArbitrationVenue) ||
    Boolean(userData?.initialGoverningLaw) ||
    Boolean(userData?.initialCoverageFullWorks) ||
    Boolean(userData?.initialEntireAgreement) ||
    Boolean(userData?.copyrightOwnerName) ||
    Boolean(userData?.copyrightOwnerSignature) ||
    Boolean(userData?.copyrightOwnerDate) ||
    Boolean(userData?.labelRepresentativeName) ||
    Boolean(userData?.labelRepresentativeSignature) ||
    Boolean(userData?.labelRepresentativeDate);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center px-3">
      <div className="w-full max-w-[1000px] bg-[#071126] border border-white/10 p-4 max-h-[85vh] overflow-y-auto text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">Your Agreement</div>
            <div className="text-sm text-gray-300">
              {userData?.name || "-"} — {userData?.email || "-"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white transition-all"
          >
            X
          </button>
        </div>

        {!hasAnyAgreement ? (
          <div className="mt-6 text-gray-300">
            No saved agreement found for this account.
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              <AgreementField label="City" value={userData?.city} />
              <AgreementField label="State" value={userData?.state} />
              <AgreementField label="Country" value={userData?.country} />
              <AgreementField label="Zip Code" value={userData?.zipCode} />
            </div>

            <div className="mt-6">
              <div className="text-lg font-semibold">
                Artist’s Original Music Consent and Release Form
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <AgreementField
                  label="1. Grant of Authorization (Initial)"
                  value={userData?.initialGrantAuthorization}
                />
                <AgreementField
                  label="2. Ownership Representation (Initial)"
                  value={userData?.initialOwnershipRepresentation}
                />
                <AgreementField
                  label="3. Licensing Protection (Initial)"
                  value={userData?.initialLicensingProtection}
                />
                <AgreementField
                  label="4. Affiliate Use (Initial)"
                  value={userData?.initialAffiliateUse}
                />
                <AgreementField
                  label="5. Waiver of Compensation (Initial)"
                  value={userData?.initialWaiverCompensation}
                />
                <AgreementField
                  label="6. Warranties (Initial)"
                  value={userData?.initialWarranties}
                />
                <AgreementField
                  label="7. Indemnification (Initial)"
                  value={userData?.initialIndemnification}
                />
                <AgreementField
                  label="8. Publicity & Promotion (Initial)"
                  value={userData?.initialPublicityPromotion}
                />
                <AgreementField
                  label="9. Limitation of Liability (Initial)"
                  value={userData?.initialLimitationLiability}
                />
                <AgreementField
                  label="10. Arbitration / Venue (Initial)"
                  value={userData?.initialArbitrationVenue}
                />
                <AgreementField
                  label="11. Governing Law (Initial)"
                  value={userData?.initialGoverningLaw}
                />
                <AgreementField
                  label="12. Coverage of Full Works (Initial)"
                  value={userData?.initialCoverageFullWorks}
                />
                <AgreementField
                  label="Song/Album Information"
                  value={userData?.initialEntireAgreement}
                />
                <AgreementField
                  label="Copyright Owner Name"
                  value={userData?.copyrightOwnerName}
                />
                <AgreementField
                  label="Copyright Owner Signature"
                  value={userData?.copyrightOwnerSignature}
                />
                <AgreementField
                  label="Copyright Owner Date"
                  value={formatMaybeDate(userData?.copyrightOwnerDate)}
                />
                <AgreementField
                  label="Label Representative Name"
                  value={userData?.labelRepresentativeName}
                />
                <AgreementField
                  label="Label Representative Signature"
                  value={userData?.labelRepresentativeSignature}
                />
                <AgreementField
                  label="Label Representative Date"
                  value={formatMaybeDate(userData?.labelRepresentativeDate)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Page = () => {
  const { userData } = useData();

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return <PageLoading />;

  return (
    <div>
      <Breadcrum mainTitle="Dashboard" subTitle="Add a album" />

      <div
        className="relative z-20 min-h-screen bg-no-repeat bg-cover text-[#fff] "
        style={{ backgroundImage: `url(${bg2.src})` }}
      >
        <div className="absolute inset-0 bg-black/60 z-[-1]" />

        <div className="max-w-[1300px] mx-auto py-[2rem] px-3">
          <div className=" flex items-center justify-between ">
            <h3 className=" text-[1.5rem] text-second ">Add Album</h3>
            <Link
              href={`/dashboard/${userData._id}`}
              className=" bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out px-7 py-2 "
            >
              Dashboards
            </Link>
          </div>

          <Form />
        </div>
      </div>
    </div>
  );
};

export default Page;

const Form = () => {
  const [formData, setFormData] = useState<FormDataType>({
    title: "",
    description: "",
    coverImg: "",
    price: "",
    releaseYear: "",
    songs: [],
  });
  const [loading, setLoading] = useState(false);
  const { userData } = useData();
  const router = useRouter();

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
  const sellerApprovalReason = (userData as any)?.sellerApprovalReason as string | undefined;

  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const requestOtp = async () => {
    if (accountType !== "seller") {
      toast.error("Only seller accounts can add albums.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    if (sellerApprovalStatus !== "approved") {
      toast.error("Your seller form is not approved yet. Please contact the admin.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    if (!agreementAccepted) {
      toast.error("Please accept the agreement first.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }
    if (!userData?.token) {
      toast.error("Please login first.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    setOtpSending(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/album-otp/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
        }
      );

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message || "Failed to send OTP", {
          style: { background: "red", border: "none", color: "white" },
        });
        return;
      }

      setOtpSent(true);
      setOtpVerified(false);
      toast.success("OTP sent to your email.", {
        style: { background: "green", border: "none", color: "white" },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to send OTP";
      toast.error(msg, {
        style: { background: "red", border: "none", color: "white" },
      });
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    if (accountType !== "seller") {
      toast.error("Only seller accounts can add albums.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    if (sellerApprovalStatus !== "approved") {
      toast.error("Your seller form is not approved yet. Please contact the admin.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    if (!agreementAccepted) {
      toast.error("Please accept the agreement first.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    if (!otp || otp.trim().length === 0) {
      toast.error("Please enter OTP.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    setOtpVerifying(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/album-otp/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
          body: JSON.stringify({ otp: otp.trim(), agreementAccepted }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message || "OTP verification failed", {
          style: { background: "red", border: "none", color: "white" },
        });
        return;
      }

      setOtpVerified(true);
      toast.success("OTP verified. You can now add album.", {
        style: { background: "green", border: "none", color: "white" },
      });
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "OTP verification failed";
      toast.error(msg, {
        style: { background: "red", border: "none", color: "white" },
      });
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (accountType !== "seller") {
      toast.error("Only seller accounts can add albums.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    if (sellerApprovalStatus !== "approved") {
      toast.error("Your seller form is not approved yet. Please contact the admin.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    if (!agreementAccepted || !otpVerified) {
      toast.error("Please accept the agreement and verify OTP first.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/add-album`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Something went wrong", {
          style: {
            background: "red",
            border: "none",
            color: "white",
          },
        });
        return;
        // throw new Error(result.message || "Something went wrong");
      }

      toast.success("Album Added Successfully", {
        style: {
          background: "green",
          border: "none",
          color: "white",
        },
      });
      setFormData({
        title: "",
        description: "",
        coverImg: "",
        price: "",
        releaseYear: "",
        songs: [],
      });

      setTimeout(() => {
        router.push(`/dashboard/${userData._id}`);
      }, 2000);

    } catch (error: unknown) {
      let message = "An error occurred while creating the album.";

      if (error instanceof Error) {
        message = error.message;
      }

      toast.error(message, {
        style: {
          background: "red",
          border: "none",
          color: "white",
        },
      });
      console.error("Error creating album:", error);
    } finally {
      setLoading(false);
    }
  };

  if (accountType !== "seller") {
    return (
      <div className="mt-8 bg-[#0b1834]/80 border border-white/10 p-4 text-white">
        Only seller accounts can add albums.
      </div>
    );
  }

  if (sellerApprovalStatus !== "approved") {
    return (
      <div className="mt-8 bg-[#0b1834]/80 border border-yellow-400/30 p-4 text-white">
        <div className="font-semibold text-yellow-300">
          Your form is not approved. Please contact the admin.
        </div>
        {sellerApprovalStatus === "rejected" && sellerApprovalReason ? (
          <div className="mt-2 text-sm text-gray-200">
            <span className="font-medium">Reason:</span> {sellerApprovalReason}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className=" mt-[4rem] space-y-3 ">


      <ImageUpload formData={formData} setFormData={setFormData} />

      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) =>
          setFormData({
            ...formData,
            title: e.target.value,
          })
        }
        className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
      />
      <div className=" flex items-center gap-3 ">
        <input
          type="number"
          placeholder="Release Year"
          min="1900"
          max={new Date().getFullYear()}
          value={formData.releaseYear}
          onChange={(e) =>
            setFormData({
              ...formData,
              releaseYear: e.target.value,
            })
          }
          className="text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full"
        />
        <input
          type="number"
          placeholder="Price"
          min="0"
          step="0.01"
          value={formData.price ?? 0}
          onChange={(e) =>
            setFormData({
              ...formData,
              price: e.target.value,
            })
          }
          className="text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full"
        />
      </div>

      <textarea
        name=""
        id=""
        rows={5}
        placeholder="Description"
        value={formData.description}
        onChange={(e) =>
          setFormData({
            ...formData,
            description: e.target.value,
          })
        }
        className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
      />
      <SongUpload formData={formData} setFormData={setFormData} />


      <div className="bg-[#28344cdb] p-4 rounded-md space-y-3">
        <div className="flex items-start gap-3">
          <input
            id="albumAgreement"
            type="checkbox"
            checked={agreementAccepted}
            onChange={(e) => {
              const checked = e.target.checked;
              setAgreementAccepted(checked);
              if (!checked) {
                setOtpVerified(false);
                setOtp("");
                setOtpSent(false);
              }
            }}
            className="mt-1 h-4 w-4 accent-[#66FCF1]"
          />
          <div className="text-sm text-gray-200">
            <label htmlFor="albumAgreement">
              I agree to the Agreement. I understand I must verify OTP sent to my
              email before adding an album.
            </label>{" "}
            <button
              type="button"
              onClick={() => setShowAgreementModal(true)}
              className="text-second underline hover:no-underline ml-2"
            >
              View Agreement
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <button
            type="button"
            disabled={!agreementAccepted || otpSending}
            onClick={requestOtp}
            className="bg-second text-[#000] px-4 py-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {otpSending ? "Sending..." : "Send OTP"}
          </button>

          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={!otpSent || otpVerified}
            className="text-[1.1rem] py-2 px-4 outline-none bg-[#222222] w-full md:max-w-[18rem] disabled:opacity-60"
          />

          <button
            type="button"
            disabled={!otpSent || otpVerified || otpVerifying}
            onClick={verifyOtp}
            className="bg-second text-[#000] px-4 py-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {otpVerifying ? "Verifying..." : "Verify OTP"}
          </button>

          {otpVerified && (
            <span className="text-green-300 font-medium">Verified</span>
          )}
        </div>
      </div>

      <div className=" pt-[1rem] ">
        <button
          disabled={loading || !agreementAccepted || !otpVerified}
          className=" bg-second w-[10rem] h-[2.7rem] text-[#000] relative disabled:opacity-60 disabled:cursor-not-allowed "
        >
          {
            loading ? <ButtonLoading /> : "Add Album"
          }
        </button>
      </div>

      <AgreementModal
        open={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
        userData={userData as any}
      />
    </form>
  );
};

interface DataProps {
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
}

const SongUpload: React.FC<DataProps> = ({ formData, setFormData }) => {
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: string;
    message: string;
  }>({ type: "", message: "" });

  const maxSize = 15 * 1024 * 1024; // max 15MB per song

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
        URL.revokeObjectURL(audio.src);
      };
      audio.onerror = () => resolve(0); // fallback
    });
  };

  const handleFilesUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      if (files[i].size <= maxSize) {
        validFiles.push(files[i]);
      } else {
        setToastMessage({
          type: "Error",
          message: `File "${files[i].name}" exceeds 15 MB limit and was skipped.`,
        });
      }
    }

    if (validFiles.length === 0) return;

    setLoading(true);
    setToastMessage({ type: "", message: "" });

    try {
      const uploadedSongs: SongType[] = [];
      for (const file of validFiles) {
        const url = await uploadVideo(file);
        if (url) {
          const duration = await getAudioDuration(file);
          uploadedSongs.push({ name: file.name, url, duration });
        }
      }

      if (uploadedSongs.length > 0) {
        setFormData({
          ...formData,
          songs: [...(formData.songs || []), ...uploadedSongs],
        });
        setToastMessage({
          type: "Success",
          message: `${uploadedSongs.length} song${uploadedSongs.length > 1 ? "s" : ""
            } uploaded successfully.`,
        });
        setTimeout(() => {
          setToastMessage({
            type: "",
            message: "",
          });
        }, 5000);
      }
    } catch (error) {
      console.error("Song upload error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "An error occurred during song upload.";

      toast.error(errorMessage, {
        style: {
          background: "red",
          border: "none",
          color: "white",
        },
      });

      setToastMessage({
        type: "Error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
      event.target.value = ""; // reset input
    }
  };

  const removeSong = (index: number) => {
    const updatedSongs = formData.songs.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      songs: updatedSongs,
    });
  };

  return (
    <div className="max-w-2xl w-full  rounded-lg shadow-md space-y-4">
      <label className="block text-lg font-semibold mb-2">Upload Songs</label>

      <div
        className={`relative border-2 min-h-[13rem] border-dashed rounded-md border-gray-400 p-6 cursor-pointer hover:border-second transition-colors ${loading ? "opacity-60 pointer-events-none" : ""
          }`}
        onClick={() => document.getElementById("songUploadInput")?.click()}
      >
        {loading ? (
          <SubmitLoading />
        ) : (
          <div>
            <div className="flex flex-col items-center justify-center gap-3 text-gray-600">
              <FaCloudUploadAlt className="text-4xl" />
              <p>Click or drag & drop audio files here</p>
              <p className="text-sm text-gray-400">
                Supported formats: MP3, WAV, OGG
              </p>
              <p className="text-sm text-gray-400">Max size per file: 15MB</p>
            </div>
            <input
              type="file"
              id="songUploadInput"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={handleFilesUpload}
            />
          </div>
        )}
      </div>

      {/* {loading && <p className="text-center text-green-600 font-medium">Uploading songs...</p>} */}

      {formData.songs && formData.songs.length > 0 && (
        <div className="space-y-3">
          <p className="font-semibold">Uploaded Songs:</p>
          <ul className="max-h-64 overflow-auto space-y-2 ">
            {formData.songs.map((song, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-[#222222] py-1 px-2 rounded-md shadow-sm"
              >
                <div className=" space-y-2 ">
                  {/* <p className="truncate max-w-xs">{song.name}</p> */}
                  <input
                    type="text"
                    placeholder="Song Name"
                    value={song.name}
                    onChange={(e) => {
                      const updatedSongs = [...formData.songs];
                      updatedSongs[index].name = e.target.value;
                      setFormData({ ...formData, songs: updatedSongs });
                    }}
                    className=" outline-none px-3 bg-transparent text-white w-full border-b border-gray-600 pb-1 "
                  />
                  <audio
                    controls
                    src={song.url}
                    className="w-56 "
                    preload="metadata"
                    style={{
                      colorScheme: "dark",
                      backgroundColor: "transparent",
                      height: "1.7rem",
                    }}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => removeSong(index)}
                    className="text-red-600 hover:text-red-800 p-2"
                    aria-label={`Remove song ${song.name}`}
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {toastMessage.message && (
        <p
          className={`mt-2 text-center ${toastMessage.type === "Error" ? "text-red-600" : "text-green-600"
            } font-medium`}
        >
          {toastMessage.message}
        </p>
      )}
    </div>
  );
};

const ImageUpload: React.FC<DataProps> = ({ formData, setFormData }) => {
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    message: "",
  });

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    const maxSize = 5 * 1024 * 1024;

    if (selectedFile) {
      if (selectedFile.size <= maxSize) {
        setToastMessage({
          type: "",
          message: "",
        });
        setLoading(true);

        try {
          const uploadedUrl = await uploadFile(selectedFile);
          if (uploadedUrl) {
            setFormData({
              ...formData,
              coverImg: uploadedUrl,
            });
          } else {
            setToastMessage({
              type: "Error",
              message: "Failed to upload file to Cloudinary.",
            });
          }
        } catch (error) {
          console.error("Upload error:", error);

          setToastMessage({
            type: "Error",
            message: "An error occurred while uploading the file.",
          });
        } finally {
          setLoading(false);
        }
      } else {
        setToastMessage({
          type: "Error",
          message: "File size must be less than 5 MB.",
        });
      }
    }
  };

  return (
    <div className=" max-w-[25rem]  w-full space-y-2 ">
      <label htmlFor="" className=" text-lg font-semibold ">
        Cover Image
      </label>
      <div className=" relative border-2 border-second h-[20rem] rounded-lg overflow-hidden ">
        {loading && <SubmitLoading />}
        {!loading && formData.coverImg ? (
          <div>
            <div
              onClick={() => {
                setFormData({
                  ...formData,
                  coverImg: "",
                });
              }}
              className={` ${loading ? "hidden" : ""
                } cursor-pointer absolute right-3 top-3 p-2 z-40 shadow-inner bg-red-400 rounded-full text-[#fff] w-fit text-[1.5rem] `}
            >
              <FaXmark />
            </div>
            <div className=" w-full h-[20rem] relative border border-white/10 ">
              <Image
                src={formData.coverImg}
                alt="Album Cover Img"
                fill
                className=" w-full h-full object-contain  "
              />
            </div>
          </div>
        ) : (
          <div className="mt-2 p-4 rounded-md text-center h-full cursor-pointer text-[#fff] ">
            <div
              onClick={() =>
                document.getElementById("profileImgClick")?.click()
              }
              className=" h-full flex flex-col items-center justify-center gap-2"
            >
              <FaCloudUploadAlt className="text-[2.5rem] " />
              <p className=" font-semibold ">Click to upload photo</p>
              <p className="text-[0.75rem] text-[#cacaca] ">
                Supported formats: JPG, PNG, WEBP
              </p>
              <p className="text-[0.75rem] text-[#c4c4c4] ">Max size: 2MB</p>
              <input
                id="profileImgClick"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        )}
      </div>

      {toastMessage.type && toastMessage.message && (
        <p
          className={` mt-1 ${toastMessage.type === "Error" ? "text-red-500" : "text-green-500"
            } `}
        >
          {toastMessage.message}
        </p>
      )}
    </div>
  );
};
