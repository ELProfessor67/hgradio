/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import bg1 from "@/assets/sponsor.jpg";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IoIosArrowForward } from "react-icons/io";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useData } from "@/context/Context";
import { ButtonLoading } from "@/utils/Loading";
type FormDataType = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  initialGrantAuthorization: string;
  initialOwnershipRepresentation: string;
  initialLicensingProtection: string;
  initialAffiliateUse: string;
  initialWaiverCompensation: string;
  initialWarranties: string;
  initialIndemnification: string;
  initialPublicityPromotion: string;
  initialLimitationLiability: string;
  initialArbitrationVenue: string;
  initialGoverningLaw: string;
  initialCoverageFullWorks: string;
  // NOTE: this name exists in the current UI but is used for Song/Album Information
  initialEntireAgreement: string;
  copyrightOwnerName: string;
  copyrightOwnerSignature: string;
  copyrightOwnerDate: string;
  labelRepresentativeName: string;
  labelRepresentativeSignature: string;
  labelRepresentativeDate: string;
};
const PageWithCreateAccount = () => {
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const [accountType, setAccountType] = useState<"buyer" | "seller">("buyer");
  const [registerOtp, setRegisterOtp] = useState("");
  const [registerOtpToken, setRegisterOtpToken] = useState("");
  const [registerOtpSent, setRegisterOtpSent] = useState(false);
  const [registerOtpVerified, setRegisterOtpVerified] = useState(false);
  const [registerOtpSending, setRegisterOtpSending] = useState(false);
  const [registerOtpVerifying, setRegisterOtpVerifying] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    initialGrantAuthorization: "",
    initialOwnershipRepresentation: "",
    initialLicensingProtection: "",
    initialAffiliateUse: "",
    initialWaiverCompensation: "",
    initialWarranties: "",
    initialIndemnification: "",
    initialPublicityPromotion: "",
    initialLimitationLiability: "",
    initialArbitrationVenue: "",
    initialGoverningLaw: "",
    initialCoverageFullWorks: "",
    initialEntireAgreement: "",
    copyrightOwnerName: "",
    copyrightOwnerSignature: "",
    copyrightOwnerDate: "",
    labelRepresentativeName: "",
    labelRepresentativeSignature: "",
    labelRepresentativeDate: "",
  });
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { userData, setUserData } = useData();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "email" && accountType === "seller") {
      resetSellerOtpState();
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    const minLength = /^.{8,}$/;
    const hasNumber = /\d/;
    const hasUppercase = /[A-Z]/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

    if (!minLength.test(password))
      return "Password must be at least 8 characters.";
    if (!hasUppercase.test(password))
      return "Password must include at least one uppercase letter.";
    if (!hasNumber.test(password))
      return "Password must include at least one number.";
    if (!hasSpecialChar.test(password))
      return "Password must include at least one special character.";

    return "";
  };

  const resetSellerOtpState = () => {
    setRegisterOtp("");
    setRegisterOtpToken("");
    setRegisterOtpSent(false);
    setRegisterOtpVerified(false);
    setRegisterOtpSending(false);
    setRegisterOtpVerifying(false);
  };

  const requestSellerOtp = async () => {
    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address first.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    setRegisterOtpSending(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/register-otp/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || data?.error || "Failed to send OTP", {
          style: { background: "red", border: "none", color: "white" },
        });
        return;
      }

      setRegisterOtpSent(true);
      setRegisterOtpVerified(false);
      setRegisterOtpToken("");
      toast.success("OTP sent to your email.", {
        style: { background: "green", border: "none", color: "white" },
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to send OTP", {
        style: { background: "red", border: "none", color: "white" },
      });
    } finally {
      setRegisterOtpSending(false);
    }
  };

  const verifySellerOtp = async () => {
    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address first.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    if (!registerOtp || registerOtp.trim().length === 0) {
      toast.error("Please enter OTP.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    setRegisterOtpVerifying(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/register-otp/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.trim().toLowerCase(),
            otp: registerOtp.trim(),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || data?.error || "OTP verification failed", {
          style: { background: "red", border: "none", color: "white" },
        });
        return;
      }

      setRegisterOtpVerified(true);
      setRegisterOtpToken(data?.otpToken || "");
      toast.success("OTP verified. Contract form unlocked.", {
        style: { background: "green", border: "none", color: "white" },
      });
    } catch (err: any) {
      toast.error(err?.message || "OTP verification failed", {
        style: { background: "red", border: "none", color: "white" },
      });
    } finally {
      setRegisterOtpVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address.", {
        style: {
          background: "red",
          border: "none",
          color: "white"
        },
      });
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      toast.error(passwordError, {
        style: {
          background: "red",
          border: "none",
          color: "white"
        },
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.", {
        style: {
          background: "red",
          border: "none",
          color: "white"
        },
      });
      return;
    }

    if (accountType === "seller" && !registerOtpVerified) {
      toast.error("Seller account requires OTP verification to unlock contract form.", {
        style: { background: "red", border: "none", color: "white" },
      });
      return;
    }

    try {
      setIsLoading(true);
      const { confirmPassword: _, ...rest } = formData;

      // Buyer: only send basic fields. Seller: send basic + contract fields + otpToken.
      const baseData = {
        name: rest.name,
        email: rest.email,
        password: rest.password,
        country: rest.country,
        city: rest.city,
        state: rest.state,
        zipCode: rest.zipCode,
        accountType,
      };

      const sellerExtra = {
        otpToken: registerOtpToken,
        initialGrantAuthorization: rest.initialGrantAuthorization,
        initialOwnershipRepresentation: rest.initialOwnershipRepresentation,
        initialLicensingProtection: rest.initialLicensingProtection,
        initialAffiliateUse: rest.initialAffiliateUse,
        initialWaiverCompensation: rest.initialWaiverCompensation,
        initialWarranties: rest.initialWarranties,
        initialIndemnification: rest.initialIndemnification,
        initialPublicityPromotion: rest.initialPublicityPromotion,
        initialLimitationLiability: rest.initialLimitationLiability,
        initialArbitrationVenue: rest.initialArbitrationVenue,
        initialGoverningLaw: rest.initialGoverningLaw,
        initialCoverageFullWorks: rest.initialCoverageFullWorks,
        initialEntireAgreement: rest.initialEntireAgreement,
        copyrightOwnerName: rest.copyrightOwnerName,
        copyrightOwnerSignature: rest.copyrightOwnerSignature,
        copyrightOwnerDate: rest.copyrightOwnerDate,
        labelRepresentativeName: rest.labelRepresentativeName,
        labelRepresentativeSignature: rest.labelRepresentativeSignature,
        labelRepresentativeDate: rest.labelRepresentativeDate,
      };

      const cleanedData =
        accountType === "seller" ? { ...baseData, ...sellerExtra } : baseData;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cleanedData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Something went wrong!", {
          style: {
            background: "red",
            border: "none",
            color: "white"
          },
        });
        return;
      }

      if (data?.user?._id) {
        setUserData({
          ...data.user,
          token: data.token,
        });

        toast.success("User registered successfully!", {
          style: {
            background: "green",
            border: "none",
            color: "white"
          },
        });
        router.push(`/dashboard/${data.user._id}`);
      } else {
        toast.error("Unexpected response.", {
          style: {
            background: "red",
            border: "none",
            color: "white"
          },
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.", {
        style: {
          background: "red",
          border: "none",
          color: "white"
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const shouldOpen = searchParams.get("openForm");
    if (shouldOpen === "true") {
      setShowForm(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300); // slight delay to allow form render
    }
  }, [searchParams]);

  useEffect(() => {
    // Reset OTP + contract gate whenever switching away from seller
    if (accountType !== "seller") {
      resetSellerOtpState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountType]);

  return (
    <div className="">
      <div className="bg-[#071126] py-16">
        <div className="max-w-[1500px] mx-auto px-3">
          <div className="flex flex-col lg:flex-row justify-between gap-10">
            <div className="lg:w-[60%] space-y-4">
              <h2 className="text-4xl font-bold text-white">
                Sell Album. (Distribution Contract)
              </h2>
              <h3 className="text-xl font-semibold text-[#66FCF1]">
                Expanding the reach of your music ministry starts by partnering
                with us!
              </h3>
              <div className="text-lg space-y-3 text-white">
                <p>
                  Hallelujah Gospel offers unparalleled worldwide distribution
                  of the Gospel music you make.
                </p>
                <p>
                  Hallelujah Gospel understands where your music needs to be. As
                  we speak, the platform is in the making to provide you with
                  only the best tool to build your global audience. Be the first
                  to know when it&rsquo;s ready to go live! Simply select the
                  Create Account button below to furnish us with your contact
                  information so we could notify you and send you regular
                  updates.
                </p>
                <p>
                  High visibility - means more exposure and higher viewership of
                  your music in the retail marketplace. Display of your music
                  catalog - means providing our site users and listeners a vast
                  selection of Gospel music through access of your catalog on
                  their preferred device Monetary blessings- the listening
                  audience who purchase your music are also enabled to give
                  financially toward your ministries.
                </p>
                <p>
                  Create a connection - means our distribution platform is
                  designed to show your music at its best and encourage sales.
                  We believe that when Gospel music supporters make a connection
                  with their favorite artists, they want to support them all the
                  way.
                </p>
              </div>
              {!showForm && !userData._id && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowForm(true)}
                    className="relative bg-[#0d2c7b] hover:bg-transparent  overflow-hidden font-semibold text-lg px-7 py-2 group"
                  >
                    <span className="relative z-10">Create Your Account</span>
                    <span className="absolute inset-0 bg-second scale-x-0 origin-center transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="bg-[#0B1834] space-y-5  p-4 text-white">
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
                    <Link
                      href={"/login"}
                      className="flex items-center gap-3 hover:text-second"
                    >
                      <IoIosArrowForward className="text-second" size={25} />
                      <span className="font-medium text-xl">Login Account</span>
                    </Link>
                  )}
                  <Link
                    href={"/about"}
                    className="flex items-center gap-3 hover:text-second"
                  >
                    <IoIosArrowForward className="text-second" size={25} />
                    <span className="font-medium text-xl">About Us</span>
                  </Link>
                  <Link
                    href={"/privacy-policy"}
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
      {showForm && (
        <form onSubmit={handleSubmit}>
          <div
            ref={formRef}
            className="relative py-20 bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${bg1.src})`,
            }}
          >
            <div className="absolute inset-0 bg-black/50 z-0" />
            <div className="text-center  pb-10 relative ">
              <h2 className="text-2xl md:text-4xl font-extrabold text-second">
                Create Account
              </h2>
            </div>

            <div className="relative z-10 space-y-5 max-w-[1500px] mx-auto px-3">
              <div className="bg-[#0B1834] p-4 text-white space-y-3">
                <h3 className="text-xl font-semibold">Select Account Type</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accountType"
                      value="buyer"
                      checked={accountType === "buyer"}
                      onChange={() => setAccountType("buyer")}
                    />
                    <span className="font-medium">Buyer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accountType"
                      value="seller"
                      checked={accountType === "seller"}
                      onChange={() => setAccountType("seller")}
                    />
                    <span className="font-medium">Seller</span>
                  </label>
                </div>


              </div>
              {[
                { name: "name", placeholder: "Your Full Name", type: "text" },
                { name: "email", placeholder: "Your Email", type: "email" },
                { name: "password", placeholder: "Password", type: "password" },
                {
                  name: "confirmPassword",
                  placeholder: "Confirm Password",
                  type: "password",
                },
                { name: "city", placeholder: "City", type: "text" },
                { name: "state", placeholder: "State", type: "text" },
                { name: "country", placeholder: "Country", type: "text" },
                { name: "zipCode", placeholder: "Zip Code", type: "text" },
              ]
                .reduce((rows, field, index, array) => {
                  if (index % 2 === 0) rows.push(array.slice(index, index + 2));
                  return rows;
                }, [] as { name: string; placeholder: string; type: string }[][])
                .map((row, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-5">
                    {row.map(({ name, placeholder, type }) => (
                      <input
                        key={name}
                        type={type}
                        name={name}
                        placeholder={placeholder}
                        value={formData[name as keyof typeof formData] || ""}
                        onChange={handleChange}
                        className="w-full text-[1.1rem] py-3 px-4 outline-none bg-[#222F46] text-white placeholder:text-white/60 "
                        required
                      />
                    ))}
                  </div>
                ))}



              <div className="bg-[#0B1834] p-4 text-white space-y-3">
                {accountType === "seller" && (
                  <div className="space-y-3">
                    <p className="text-gray-200">
                      Seller accounts require email OTP verification to unlock the contract
                      form.
                    </p>

                    <div className="flex flex-col md:flex-row gap-3 md:items-center">
                      <button
                        type="button"
                        onClick={requestSellerOtp}
                        disabled={registerOtpSending}
                        className="bg-second text-black font-semibold px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {registerOtpSending ? "Sending..." : "Get Contract Form"}
                      </button>

                      {registerOtpSent && !registerOtpVerified && (
                        <div className="flex flex-col md:flex-row gap-3 md:items-center w-full">
                          <input
                            type="text"
                            placeholder="Enter OTP"
                            value={registerOtp}
                            onChange={(e) => setRegisterOtp(e.target.value)}
                            className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] text-white placeholder:text-white/60 "
                          />
                          <button
                            type="button"
                            onClick={verifySellerOtp}
                            disabled={registerOtpVerifying}
                            className="bg-second text-black font-semibold px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {registerOtpVerifying ? "Verifying..." : "Verify OTP"}
                          </button>
                        </div>
                      )}

                      {registerOtpVerified && (
                        <span className="text-green-300 font-semibold">
                          OTP verified
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>


            </div>
          </div>

          {accountType === "seller" && registerOtpVerified && (
            <div className=" bg-[#071126] text-[#fff] py-[3rem] ">
              <div className=" max-w-[1500px] mx-auto px-3 ">
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h2 className=" text-[2.5rem] font-semibold ">
                    Artist’s Original Music Consent and Release Form
                  </h2>
                  <p className=" text-gray-300 ">
                    This form is required for your music to be broadcast or distributed by
                    Hallelujah Gospel Globally.
                  </p>
                  <p className=" text-gray-300 ">
                    The undersigned Artist, Band, Independent Label, Recording Company, or
                    Copyright Holder (“Copyright Owner”) hereby grants Hallelujah Gospel
                    Globally, a California Limited Liability Company, and its affiliates,
                    licensees, successors, and assigns (collectively “Hallelujah Gospel
                    Globally”) the following rights and protections:
                  </p>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">
                    1. Grant of Authorization
                  </h3>
                  <div className=" text-gray-300 ">
                    <h4>
                      The Copyright Owner hereby grants{" "}
                      <span className=" font-semibold text-[#fff] ">
                        Hallelujah Gospel Globally
                      </span>{" "}
                      the non-exclusive, royalty-free, worldwide right to:
                    </h4>
                    <ul className=" list-disc list-inside space-y-2 mt-3 ">
                      <li>
                        Broadcast, stream, and distribute the submitted original music via
                        its websites, radio programming, and affiliate platforms;
                      </li>
                      <li>
                        Use excerpts of the work for promotional, news, or editorial
                        purposes;
                      </li>
                      <li>
                        Store, archive, and reproduce the submitted work in any format for
                        continued distribution.
                      </li>
                    </ul>
                  </div>
                  <div className=" flex items-center gap-2 ">
                    <label htmlFor="" className=" text-[1.2rem] ">
                      Initial:
                    </label>
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialGrantAuthorization"
                      value={formData.initialGrantAuthorization}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">
                    2. Ownership and Copyright Representation
                  </h3>
                  <div className=" text-gray-300 ">
                    <h4>The Copyright Owner affirms that:</h4>
                    <ul className=" list-disc list-inside space-y-2 mt-3 ">
                      <li>
                        The submitted recordings are original works or fully licensed by the
                        undersigned;
                      </li>
                      <li>
                        All necessary rights and permissions for use, including from
                        producers, writers, performers, or labels, have been secured.
                      </li>
                    </ul>
                  </div>
                  <div className=" flex items-center gap-2 ">
                    <label htmlFor="" className=" text-[1.2rem] ">
                      Initial:
                    </label>
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialOwnershipRepresentation"
                      value={formData.initialOwnershipRepresentation}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">
                    3. Ironclad Licensing Protection and Outside Interference
                  </h3>
                  <div className=" text-gray-300 space-y-4 ">
                    <h4>
                      This agreement supersedes any claim from{" "}
                      <span className=" font-semibold text-white ">
                        outside licensing organizations
                      </span>
                      , including but not limited to{" "}
                      <span className=" font-semibold text-white ">BMI</span>,{" "}
                      <span className=" font-semibold text-white ">ASCAP</span>,{" "}
                      <span className=" font-semibold text-white ">SESAC</span>,{" "}
                      <span className=" font-semibold text-white ">SoundExchange</span>,{" "}
                      <span className=" font-semibold text-white ">RIAA</span>, or any other
                      third-party collection or rights management agency.
                    </h4>
                    <p>
                      Hallelujah Gospel Globally shall not owe any third party any
                      royalties, licensing fees, or performance payments unless there is an
                      explicit written agreement directly between Hallelujah Gospel Globally
                      and the artist or rights holder.
                    </p>
                    <p>
                      The undersigned waives any future claims or demands from external
                      licensors or industry intermediaries unless a separate mutual
                      agreement is executed.
                    </p>
                    <p>
                      This clause is binding, irrevocable, and non-negotiable without
                      express written consent from Hallelujah Gospel Globally.
                    </p>
                  </div>
                  <div className=" flex items-center gap-2 ">
                    <label htmlFor="" className=" text-[1.2rem] ">
                      Initial:
                    </label>
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialLicensingProtection"
                      value={formData.initialLicensingProtection}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">
                    4. Use by Affiliates and Partners
                  </h3>
                  <div className=" text-gray-300 ">
                    <h4>
                      Permission granted herein extends to all platforms owned, operated, or
                      partnered with Hallelujah Gospel Globally, including:
                    </h4>
                    <ul className=" list-disc list-inside space-y-2 mt-3 ">
                      <li>Hallelujah Gospel Choice Radio</li>
                      <li>Hallelujah Gospel Globally’s website and mobile apps</li>
                      <li>Live and virtual events, showcases, or affiliate airplay</li>
                    </ul>
                  </div>
                  <div className=" flex items-center gap-2 ">
                    <label htmlFor="" className=" text-[1.2rem] ">
                      Initial:
                    </label>
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialAffiliateUse"
                      value={formData.initialAffiliateUse}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">
                    5. Waiver of Compensation
                  </h3>
                  <div className=" text-gray-300 ">
                    <h4>
                      The undersigned agrees that no payment is due for use of the submitted
                      content under this agreement. This includes:
                    </h4>
                    <ul className=" list-disc list-inside space-y-2 mt-3 ">
                      <li>
                        Airplay, performance, mechanical, or synchronization royalties
                      </li>
                      <li>Public performance or streaming payouts</li>
                    </ul>
                  </div>
                  <p className=" text-gray-300 ">
                    This waiver applies unless a separate agreement between the artist and
                    Hallelujah Gospel Globally states otherwise.
                  </p>
                  <div className=" flex items-center gap-2 ">
                    <label htmlFor="" className=" text-[1.2rem] ">
                      Initial:
                    </label>
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialWaiverCompensation"
                      value={formData.initialWaiverCompensation}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">6. Warranties</h3>
                  <div className=" text-gray-300 ">
                    <h4>The undersigned warrants that:</h4>
                    <ul className=" space-y-1 mt-3 ">
                      <li>
                        a) They own and/or control 100% of the rights in the submitted
                        materials;
                      </li>
                      <li>
                        b) They are not bound by any agreement that conflicts with this
                        release;
                      </li>
                      <li>
                        c) All material is original and not a cover, sample, or derivative
                        of another work;
                      </li>
                    </ul>
                    <ul className=" space-y-1 mt-3 ">
                      <li>
                        d) No submission will trigger external claims or payments from
                        licensing bodies.
                      </li>
                      <li>
                        e) that Copyright Owner has the right and authority to license all
                        rights granted herein, including, but not limited to, copyright and
                        trademark rights, performance rights, musical compositions, and
                        sound recording rights. Copyright owner understands and agrees this
                        consent and release further eliminates any external licensing
                        requirements of RIAA, BMI, SESAC, ASCAP, or any other performance
                        rights organizations.
                      </li>
                    </ul>
                  </div>
                  <p className=" text-gray-300 ">
                    If represented by an independent label, the label owner/director must
                    also sign this form.
                  </p>
                  <div className=" flex items-center gap-2 ">
                    <label htmlFor="" className=" text-[1.2rem] ">
                      Initial:
                    </label>
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialWarranties"
                      value={formData.initialWarranties}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">7. Indemnification</h3>
                  <div className=" text-gray-300 ">
                    <h4>
                      The undersigned agrees to indemnify and hold harmless Hallelujah
                      Gospel Globally and its representatives from any claims, damages, or
                      losses arising out of the submitted content or the breach of this
                      agreement.
                    </h4>
                  </div>
                  <div className=" flex items-center gap-2 ">
                    <label htmlFor="" className=" text-[1.2rem] ">
                      Initial:
                    </label>
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialIndemnification"
                      value={formData.initialIndemnification}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">
                    8. Publicity and Promotion Rights
                  </h3>
                  <div className=" text-gray-300 ">
                    <h4>
                      The undersigned grants Hallelujah Gospel Globally the right to use
                      artist and song information, including:
                    </h4>
                    <ul className=" list-disc list-inside space-y-2 mt-3 ">
                      <li>Names, logos, bios, photos, and album art</li>
                      <li>Song/album titles and credits</li>
                    </ul>
                  </div>
                  <p className=" text-gray-300 ">
                    For all promotional, programming, or marketing use.
                  </p>
                  <div className=" flex items-center gap-2 ">
                    <label htmlFor="" className=" text-[1.2rem] ">
                      Initial:
                    </label>
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialPublicityPromotion"
                      value={formData.initialPublicityPromotion}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">
                    9. Limitation of Liability
                  </h3>
                  <div className=" text-gray-300 ">
                    <h4>
                      Any liability by either party under this agreement is strictly limited
                      to <span className=" text-white font-semibold ">$100 USD</span>. No
                      party shall be liable for indirect or consequential damages.
                    </h4>
                  </div>
                  <div className=" flex items-center gap-2 ">
                    <label htmlFor="" className=" text-[1.2rem] ">
                      Initial:
                    </label>
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialLimitationLiability"
                      value={formData.initialLimitationLiability}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">
                    10. Arbitration and Legal Venue
                  </h3>
                  <div className=" text-gray-300 ">
                    <h4>
                      Any disputes shall be resolved exclusively through binding arbitration
                      in Contra Costa County, California, under the rules of the American
                      Arbitration Association.
                    </h4>
                  </div>
                  <div className=" flex items-center gap-2 ">
                    <label htmlFor="" className=" text-[1.2rem] ">
                      Initial:
                    </label>
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialArbitrationVenue"
                      value={formData.initialArbitrationVenue}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">11. Governing Law</h3>
                  <div className=" text-gray-300 ">
                    <h4>
                      This agreement is governed by the laws of the United States and the
                      State of California.
                    </h4>
                  </div>
                  <div className=" flex items-center gap-2 ">
                    <label htmlFor="" className=" text-[1.2rem] ">
                      Initial:
                    </label>
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialGoverningLaw"
                      value={formData.initialGoverningLaw}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">
                    12. Coverage of Full Works
                  </h3>
                  <div className=" text-gray-300 ">
                    <h4>
                      All tracks submitted via album, CD, or digital collection are covered
                      under this agreement, including every track listed or embedded unless
                      otherwise stated.
                    </h4>
                  </div>
                  <div className=" flex items-center gap-2 ">
                    <label htmlFor="" className=" text-[1.2rem] ">
                      Initial:
                    </label>
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialCoverageFullWorks"
                      value={formData.initialCoverageFullWorks}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">13. Entire Agreement</h3>
                  <div className=" text-gray-300 ">
                    <h4>
                      This form constitutes the entire agreement between the parties. No
                      oral or external agreements shall alter the terms herein unless made
                      in writing and signed by both parties.
                    </h4>
                  </div>
                </div>
                <div className=" space-y-5 border-b border-gray-500 pb-[2rem] mb-[2rem] ">
                  <h3 className=" text-[1.4rem] font-semibold ">Song/Album Information</h3>
                  <div className=" font-semibold ">
                    <h4>Artist Name Song Name Album Genre Independent Label (if any)</h4>
                  </div>
                  <div className=" flex items-center gap-2 ">
                    <input
                      className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                      type="text"
                      name="initialEntireAgreement"
                      value={formData.initialEntireAgreement}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <h3 className=" text-[1.3rem] font-semibold ">
                    Signature of Copyright Owner
                  </h3>
                  <div className=" space-y-2 mt-4 ">
                    <div className=" flex items-center gap-2 ">
                      <label htmlFor="" className=" text-[1.2rem] ">
                        Name (Print):
                      </label>
                      <input
                        className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                        type="text"
                        name="copyrightOwnerName"
                        value={formData.copyrightOwnerName}
                        onChange={handleChange}
                        required={accountType === "seller"}
                      />
                    </div>
                    <div className=" flex items-center gap-2 ">
                      <label htmlFor="" className=" text-[1.2rem] ">
                        Signature:
                      </label>
                      <input
                        className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                        type="text"
                        name="copyrightOwnerSignature"
                        value={formData.copyrightOwnerSignature}
                        onChange={handleChange}
                        required={accountType === "seller"}
                      />
                    </div>
                    <div className=" flex items-center gap-2 ">
                      <label htmlFor="" className=" text-[1.2rem] ">
                        Date:
                      </label>
                      <input
                        className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                        type="date"
                        name="copyrightOwnerDate"
                        value={formData.copyrightOwnerDate}
                        onChange={handleChange}
                        required={accountType === "seller"}
                      />
                    </div>
                  </div>
                </div>
                <div className=" mt-[3rem] ">
                  <p>If Applicable:</p>
                  <h3 className=" text-[1.3rem] font-semibold ">Label Representative</h3>
                  <div className=" space-y-2 mt-4 ">
                    <div className=" flex items-center gap-2 ">
                      <label htmlFor="" className=" text-[1.2rem] ">
                        Name (Print):
                      </label>
                      <input
                        className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                        type="text"
                        name="labelRepresentativeName"
                        value={formData.labelRepresentativeName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className=" flex items-center gap-2 ">
                      <label htmlFor="" className=" text-[1.2rem] ">
                        Signature:
                      </label>
                      <input
                        className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                        type="text"
                        name="labelRepresentativeSignature"
                        value={formData.labelRepresentativeSignature}
                        onChange={handleChange}
                      />
                    </div>
                    <div className=" flex items-center gap-2 ">
                      <label htmlFor="" className=" text-[1.2rem] ">
                        Date:
                      </label>
                      <input
                        className="w-full text-[1.1rem] py-2 px-4 outline-none max-w-[20rem] bg-[#222F46] border-b-2 border-[#445d88] text-white placeholder:text-white/60 "
                        type="date"
                        name="labelRepresentativeDate"
                        value={formData.labelRepresentativeDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          <div className="bg-[#071126] text-[#fff] py-[2rem]">
            <div className="max-w-[1500px] mx-auto px-3 flex justify-center flex-col items-center">
              <button
                type="submit"
                disabled={isLoading || (accountType === "seller" && !registerOtpVerified)}
                className="relative bg-second hover:bg-transparent disabled:opacity-60 disabled:cursor-not-allowed text-black overflow-hidden font-medium text-lg w-[12rem] h-[2.70rem] group"
              >
                <span className="relative z-10">
                  {isLoading ? <ButtonLoading /> : "Create Account"}
                </span>
                <span className="absolute inset-0 bg-second scale-x-0 origin-center transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </button>

              {accountType === "seller" && !registerOtpVerified && (
                <p className="text-gray-300 mt-3 text-center">
                  Verify OTP to unlock the contract form and enable account creation.
                </p>
              )}

            </div>
          </div>
        </form>
      )}

    </div>
  );
};

export default PageWithCreateAccount;
