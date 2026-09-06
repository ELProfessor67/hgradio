/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Breadcrum from "@/components/Breadcrum";
import Sponsor1 from "@/assets/Sponsor1.jpg";
// import { toast } from "sonner";
import { toast } from "sonner";
import { ButtonLoading } from "@/utils/Loading";
import { FaCreditCard, FaDollarSign, FaMoneyBillWave, FaMoneyCheck, FaCopy, FaCheckCircle, FaUser, FaSearch } from "react-icons/fa";

const Page = () => {
  return (
    <div>
      <Breadcrum mainTitle="Partner With Us" subTitle="Join us as a partner" />
      <Form />
    </div>
  );
};

export default Page;

const methodsContent = {
  "cash": {
    heading: "Cash App Payment",
    content: "Please use this $Cashtag on your Cash App.",
    id: "$hgcradio",
    label: "Cash Tag"
  },
  "zelle": {
    heading: "Zelle Payment",
    content: "Please use this Zelle number on your Zelle App.",
    id: "510-860-8608",
    label: "Phone Number"
  },
  "venmo": {
    heading: "Venmo Payment",
    content: "Please use this Venmo number on your Venmo App.",
    id: "9255942138",
    label: "Phone Number"
  },
  "check": {
    heading: "Check or Money Order",
    content: "Please mail your check or money order to the address below. You can include the program/person you are supporting in the memo line.",
    address: "Hallelujah Gospel Globally\n231 Market Place 195\nSan Ramon, CA 94583\nUSA",
    label: "Mailing Address"
  },
};

const Form = () => {
  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    email: "",
    phone: "",
    sponsorType: "",
    sponsorTarget: "",
    method: "",
    comment: "",
  });
  const [loading, setLoading] = useState(false);
  const [selectedAltMethod, setSelectedAltMethod] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [amount, setAmount] = useState("");
  const [otherText, setOtherText] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");


  const [checkPolicyAccepted, setCheckPolicyAccepted] = useState(false);
  const [policyModelOpen, setPolicyModelOpen] = useState(false);

  /*
    A Love Gift is designated exactly as it is on the donate page: the station's
    general fund, or a named artist. Program/Individual above is just a label on
    the partnership and does not decide where the money is designated.
  */
  type Artist = { _id: string; name: string; username?: string; profileImg?: string; genre?: string };

  /*
    What separates two artists sharing a display name. The handle is the part a
    donor can check against what the artist told them; artists registered before
    handles existed fall back to a fragment of their account id, which is at
    least unique, until they set one.
  */
  const artistTag = (a: Artist) => {
    const handle = a.username ? `@${a.username}` : `ID ${a._id.slice(-6)}`;
    return a.genre ? `${handle} · ${a.genre}` : handle;
  };
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [giftRecipientType, setGiftRecipientType] = useState<"station" | "artist">("station");
  const [artistId, setArtistId] = useState("");
  const [artistSearch, setArtistSearch] = useState("");

  /*
    Two artists may share a display name, so the donor picks from rows carrying a
    photo and genre, and the gift is stored against the account id — never the
    name. The chosen artist is restated before payment so a mistake is visible
    while it can still be corrected.
  */
  const selectedArtist = artists.find((a) => a._id === artistId) || null;

  const matchingArtists = useMemo(() => {
    const q = artistSearch.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((a) => a.name?.toLowerCase().includes(q));
  }, [artists, artistSearch]);

  const showArtistPicker = formData.method === "gift";

  // Only approved artists are offered; the server re-checks the choice on submit
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setArtistsLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/love-gift/artists`);
        const data = await res.json();
        if (!cancelled && res.ok) setArtists(data.artists || []);
      } catch {
        if (!cancelled) setArtists([]);
      } finally {
        if (!cancelled) setArtistsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => String(current + i));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMethodSelect = (method: string) => {
    setFormData((prev) => ({ ...prev, method }));
    if (method !== "gift") setAmount("");
    if (method !== "other") setOtherText("");
    if (method !== "gift") {
      setCardNumber("");
      setExpiryMonth("");
      setExpiryYear("");
      setCvv("");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!", {
      style: { background: "green", border: "none", color: "white" },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    // Basic validation (keep it lightweight but avoid DB validation errors)
    if (!formData.name.trim()) {
      toast.error("Name is required", { style: { background: "red", border: "none", color: "white" } });
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required", { style: { background: "red", border: "none", color: "white" } });
      return;
    }
    if (!formData.sponsorType) {
      toast.error("Please select sponsor type", { style: { background: "red", border: "none", color: "white" } });
      return;
    }
    if (!formData.sponsorTarget.trim()) {
      toast.error("Please enter sponsor target", { style: { background: "red", border: "none", color: "white" } });
      return;
    }
    if (!formData.method) {
      toast.error("Please select sponsorship method", { style: { background: "red", border: "none", color: "white" } });
      return;
    }
    if (formData.method === "gift") {
      if (giftRecipientType === "artist" && !artistId) {
        toast.error("Choose the artist this gift is for", { style: { background: "red", border: "none", color: "white" } });
        return;
      }
      const amt = Number(amount);
      if (!amt || amt <= 0) {
        toast.error("Please enter a valid amount", { style: { background: "red", border: "none", color: "white" } });
        return;
      }
      if (!/^\d{13,19}$/.test(cardNumber.replace(/\s+/g, ""))) {
        toast.error("Enter a valid card number", { style: { background: "red", border: "none", color: "white" } });
        return;
      }
      if (!/^\d{2}$/.test(expiryMonth) || Number(expiryMonth) < 1 || Number(expiryMonth) > 12) {
        toast.error("Enter valid expiry month", { style: { background: "red", border: "none", color: "white" } });
        return;
      }
      if (!/^\d{4}$/.test(expiryYear)) {
        toast.error("Enter valid expiry year", { style: { background: "red", border: "none", color: "white" } });
        return;
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        toast.error("Enter valid CVV", { style: { background: "red", border: "none", color: "white" } });
        return;
      }
    }
    if (formData.method === "other" && !otherText.trim()) {
      toast.error("Please specify other method", { style: { background: "red", border: "none", color: "white" } });
      return;
    }

    setLoading(true);
    try {
      const basePayload: Record<string, any> = {
        ...formData,
      };

      if (formData.method === "other" && otherText) basePayload.otherText = otherText;

      // Designation travels with the gift, exactly as it does from the donate page
      if (formData.method === "gift") {
        basePayload.recipientType = giftRecipientType;
        if (giftRecipientType === "artist") basePayload.artistId = artistId;
      }

      let res: Response;

      if (formData.method === "gift") {
        res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sponsor/process-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sponsorData: basePayload,
            payment: {
              amount: Number(amount),
              cardNumber: cardNumber.replace(/\s+/g, ""),
              expiryMonth,
              expiryYear,
              cvv,
            },
          }),
        });
      } else {
        res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sponsor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basePayload),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to submit");

      toast.success("Partnership submitted!", {
        style: {
          background: "green",
          border: "none",
          color: "white"
        },
      });
      setFormData({
        name: "",
        organization: "",
        email: "",
        phone: "",
        sponsorType: "",
        sponsorTarget: "",
        method: "",
        comment: "",
      });
      setAmount("");
      setOtherText("");
      setCardNumber("");
      setExpiryMonth("");
      setExpiryYear("");
      setCvv("");
      setArtistId("");
      setArtistSearch("");
      setGiftRecipientType("station");
    } catch (err) {
      // A card error carries the gateway's own wording ("declined",
      // "insufficient funds"), which a donor needs; other methods keep the
      // original generic message.
      const cardError = formData.method === "gift" && err instanceof Error && err.message;
      toast.error(cardError || "Submission failed", {
        style: {
          background: "red",
          border: "none",
          color: "white"
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        style={{ backgroundImage: `url(${Sponsor1.src})` }}
        className="bg-black py-[5rem] text-white relative"
      >
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="max-w-[1000px] mx-auto px-3 relative z-20">
          <div className="text-center leading-tight mb-[5rem]">
            <h2
              className="text-[3rem] font-bold mb-6"
            >
              Join As A Partner
            </h2>
            <div className="text-second font-semibold text-center">
              <p>Thank you for considering partnering with us!</p>
              <p>
                Please fill out the form below to specify your partnership
                details.
              </p>
            </div>
          </div>

          <div className="space-y-10">
            {/* Name and Org */}
            <div className="flex items-center gap-5">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                type="text"
                placeholder="Full Name"
                className="text-[1.1rem] py-3 px-4 bg-[#28344cdb] w-full outline-none"
              />
              <input
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                type="text"
                placeholder="Organization (optional)"
                className="text-[1.1rem] py-3 px-4 bg-[#28344cdb] w-full outline-none"
              />
            </div>

            {/* Email and Phone */}
            <div className="flex items-center gap-5">
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                placeholder="Email"
                className="text-[1.1rem] py-3 px-4 bg-[#28344cdb] w-full outline-none"
              />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                type="tel"
                placeholder="Phone"
                className="text-[1.1rem] py-3 px-4 bg-[#28344cdb] w-full outline-none"
              />
            </div>

            {/* Sponsor Type */}
            <div className="space-y-3">
              <p>
                Please select the type of program or person you wish to partner with:
              </p>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sponsorType"
                    value="program"
                    checked={formData.sponsorType === "program"}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sponsorType: "program" }))
                    }
                    className="accent-second scale-125"
                  />
                  <span>Program</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sponsorType"
                    value="individual"
                    checked={formData.sponsorType === "individual"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sponsorType: "individual",
                      }))
                    }
                    className="accent-second scale-125"
                  />
                  <span>Individual</span>
                </label>
              </div>
              {formData.sponsorType && (
                <input
                  name="sponsorTarget"
                  value={formData.sponsorTarget}
                  onChange={handleChange}
                  type="text"
                  placeholder={
                    formData.sponsorType === "program"
                      ? "Program name"
                      : "Person/host name"
                  }
                  className="text-[1.1rem] py-3 px-4 bg-[#28344cdb] w-full outline-none"
                />
              )}

              {/*
                Same designation as the donate page: the general fund, or a named
                artist. Choosing an artist is what carries the gift into that
                artist's payout total.
              */}
              {showArtistPicker && (
                <div className="space-y-3">
                  <p className="font-semibold">Who is this gift for?</p>
                  <select
                    value={giftRecipientType}
                    onChange={(e) => {
                      setGiftRecipientType(e.target.value as "station" | "artist");
                      setArtistId("");
                      setArtistSearch("");
                    }}
                    className="text-[1.1rem] py-3 px-4 bg-[#28344cdb] w-full outline-none md:w-1/2"
                  >
                    <option value="station" className="text-black">HGC Radio (general fund)</option>
                    <option value="artist" className="text-black">A specific artist</option>
                  </select>

                  {giftRecipientType === "artist" && selectedArtist && (
                    <div className="bg-[#28344cdb] p-4 flex items-center gap-4">
                      {selectedArtist.profileImg ? (
                        <img
                          src={selectedArtist.profileImg}
                          alt=""
                          className="w-14 h-14 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-black/30 flex items-center justify-center shrink-0">
                          <FaUser className="text-second" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-300">You&apos;re sending a Love Gift to:</p>
                        <p className="font-semibold truncate">{selectedArtist.name}</p>
                        <p className="text-sm text-second truncate">{artistTag(selectedArtist)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setArtistId(""); setArtistSearch(""); }}
                        className="text-sm underline shrink-0 hover:text-second transition-colors"
                      >
                        Change artist
                      </button>
                    </div>
                  )}

                  {giftRecipientType === "artist" && !selectedArtist && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-300">Select the artist you want to support</p>

                      <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          value={artistSearch}
                          onChange={(e) => setArtistSearch(e.target.value)}
                          type="text"
                          placeholder="Search artist by name"
                          className="text-[1.1rem] py-3 pl-11 pr-4 bg-[#28344cdb] w-full outline-none"
                        />
                      </div>

                      {artistsLoading ? (
                        <p className="text-sm text-gray-400">Loading artists…</p>
                      ) : artists.length === 0 ? (
                        <p className="text-sm text-red-300">
                          No artists are available to receive gifts right now. Please choose HGC Radio instead.
                        </p>
                      ) : matchingArtists.length === 0 ? (
                        <p className="text-sm text-gray-400">
                          No artist matches “{artistSearch}”.
                        </p>
                      ) : (
                        <div className="max-h-[260px] overflow-y-auto divide-y divide-white/10 bg-[#28344cdb]">
                          {matchingArtists.map((a) => (
                            <button
                              key={a._id}
                              type="button"
                              onClick={() => setArtistId(a._id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors"
                            >
                              {a.profileImg ? (
                                <img
                                  src={a.profileImg}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center shrink-0">
                                  <FaUser className="text-second" size={12} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-medium truncate">{a.name}</div>
                                <div className="text-xs text-gray-400 truncate">{artistTag(a)}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sponsorship Method */}
            <div className="space-y-3">
              <p>Please describe how you wish to partner:</p>
              <div className="flex items-center space-x-4 flex-wrap">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    checked={formData.method === "prayer"}
                    onChange={() => handleMethodSelect("prayer")}
                    className="accent-second scale-125"
                  />
                  <span>Prayer and Fasting</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    checked={formData.method === "gift"}
                    onChange={() => handleMethodSelect("gift")}
                    className="accent-second scale-125"
                  />
                  <span>Love Gift</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    checked={formData.method === "other"}
                    onChange={() => handleMethodSelect("other")}
                    className="accent-second scale-125"
                  />
                  <span>Other</span>
                </label>
              </div>

              {formData.method === "gift" && (
                <div className="space-y-4">
                  <input
                    type="number"
                    placeholder="Amount (USD)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-[1.1rem] py-3 px-4 bg-[#28344cdb] w-full outline-none"
                  />

                  <div className="space-y-3 bg-[#28344cdb] p-4">
                    <p className="font-semibold flex items-center gap-2">
                      <FaCreditCard className="text-second" /> Card Details
                    </p>

                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="Card Number"
                      inputMode="numeric"
                      className="text-[1.1rem] py-3 px-4 bg-black/20 w-full outline-none"
                    />

                    <div className="flex items-center gap-4 flex-wrap">
                      <input
                        value={expiryMonth}
                        onChange={(e) => setExpiryMonth(e.target.value)}
                        placeholder="MM"
                        inputMode="numeric"
                        maxLength={2}
                        className="text-[1.1rem] py-3 px-4 bg-black/20 w-full outline-none"
                      />
                      <select
                        value={expiryYear}
                        onChange={(e) => setExpiryYear(e.target.value)}
                        className="text-[1.1rem] py-3 px-4 bg-black/20 w-full outline-none"
                      >
                        <option value="">YYYY</option>
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <input
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="CVV"
                        inputMode="numeric"
                        maxLength={4}
                        className="text-[1.1rem] py-3 px-4 bg-black/20 w-full outline-none"
                      />
                    </div>

                    <p className="text-sm text-gray-200">
                      This form processes a real card payment via Authorize.Net if your backend keys are set.
                    </p>
                  </div>

                  {/* Alternative Payment Methods */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold mb-1 text-white">Or Choose Alternative Payment Method</p>
                      <p className="text-sm text-gray-400">Select your preferred payment method below</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedAltMethod(selectedAltMethod === 'cash' ? null : 'cash')}
                        className={`flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all ${selectedAltMethod === 'cash'
                          ? 'bg-second text-black'
                          : 'bg-black/20 text-white hover:bg-black/30'
                          }`}
                      >
                        <img src="/cash-app.png" alt="Cash App" className="w-8 h-8" />
                        Cash App
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedAltMethod(selectedAltMethod === 'zelle' ? null : 'zelle')}
                        className={`flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all ${selectedAltMethod === 'zelle'
                          ? 'bg-second text-black'
                          : 'bg-black/20 text-white hover:bg-black/30'
                          }`}
                      >
                        <img src="/zelle.png" alt="Zelle" className="w-10 h-10" />
                        Zelle
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedAltMethod(selectedAltMethod === 'venmo' ? null : 'venmo')}
                        className={`flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all ${selectedAltMethod === 'venmo'
                          ? 'bg-second text-black'
                          : 'bg-black/20 text-white hover:bg-black/30'
                          }`}
                      >
                        <img src="/venmo.png" alt="Venmo" className="w-10 h-10" />
                        Venmo
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedAltMethod(selectedAltMethod === 'check' ? null : 'check')}
                        className={`flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all ${selectedAltMethod === 'check'
                          ? 'bg-second text-black'
                          : 'bg-black/20 text-white hover:bg-black/30'
                          }`}
                      >
                        <img src="/check.png" alt="Check" className="w-10 h-10" />
                        Check / Money Order
                      </button>
                    </div>

                    {selectedAltMethod && (
                      <div className="bg-black/20 p-6 space-y-3 transition-all duration-300 border-l-4 border-second">
                        <h3 className="text-xl font-bold text-second">
                          {methodsContent[selectedAltMethod as keyof typeof methodsContent].heading}
                        </h3>
                        <p className="text-gray-300">
                          {methodsContent[selectedAltMethod as keyof typeof methodsContent].content}
                        </p>
                        <div className="flex items-center gap-3 bg-black/30 p-4 rounded">
                          <div className="flex-1">
                            <p className="text-sm text-gray-400 mb-1">
                              {methodsContent[selectedAltMethod as keyof typeof methodsContent].label}
                            </p>
                            {selectedAltMethod === 'check' ? (
                              <p className="text-lg font-bold text-second whitespace-pre-line">
                                {methodsContent[selectedAltMethod as keyof typeof methodsContent].address}
                              </p>
                            ) : (
                              <p className="text-2xl font-bold text-second">
                                {methodsContent[selectedAltMethod as keyof typeof methodsContent].id}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(
                              selectedAltMethod === 'check'
                                ? methodsContent[selectedAltMethod as keyof typeof methodsContent].address!
                                : methodsContent[selectedAltMethod as keyof typeof methodsContent].id!
                            )}
                            className="bg-second hover:bg-second/80 text-black px-4 py-2 rounded font-semibold flex items-center gap-2 transition-all"
                          >
                            {copied ? (
                              <>
                                <FaCheckCircle /> Copied
                              </>
                            ) : (
                              <>
                                <FaCopy /> Copy
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-gray-400 italic">
                          {selectedAltMethod === 'check'
                            ? 'Please include the program/person name in the memo line of your check or on a separate note with your money order.'
                            : 'After making your payment, you can fill out the form to let us know about your partnership.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formData.method === "other" && (
                <input
                  type="text"
                  placeholder="Please specify"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  className="text-[1.1rem] py-3 px-4 bg-[#28344cdb] w-full outline-none"
                />
              )}
            </div>

            {/* Comments */}
            <div className="space-y-3">
              <label>Additional Comments or Instructions</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                rows={5}
                placeholder="Write your comments here..."
                className="text-[1.1rem] py-3 px-4 bg-[#28344cdb] w-full outline-none"
              />
            </div>
            <div>
              <p className="text-lg">
                By submitting this form, you agree to support our radio station
                and understand that your partnership will be used to further our
                programming and outreach efforts.
              </p>
            </div>



            <div className="flex items-center gap-2">
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


            <p className="text-sm text-gray-500 flex items-start justify-start gap-2">
              <span className="text-gray-300">
                Legal-Clean & Professional Secure Payment Processing This website uses Authorize.Net for secure credit card processing. Transactions are protected by advanced encryption and comply with PCI-DSS security standards.
              </span>
            </p>


            {/*
              Last restatement of who is being paid and how much, directly above
              the button that charges the card — the point where a wrong
              recipient is still free to fix.
            */}
            {formData.method === "gift" && Number(amount) > 0 && (
              <div className="bg-[#28344cdb] border-l-4 border-second p-4">
                <p className="text-sm text-gray-300">Please confirm your recipient</p>
                <p className="mt-1">
                  You&apos;re sending{" "}
                  <span className="font-semibold text-second">
                    ${Number(amount).toFixed(2)}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {giftRecipientType === "artist"
                      ? selectedArtist?.name ?? "an artist you have not chosen yet"
                      : "HGC Radio (general fund)"}
                  </span>
                  {giftRecipientType === "artist" && selectedArtist
                    ? ` (${artistTag(selectedArtist)})`
                    : ""}
                  .
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading || !checkPolicyAccepted}
                className="bg-second relative w-[10rem] h-[2.70rem] text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <ButtonLoading /> : "Submit"}
              </button>
            </div>
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
    </>
  );
};
