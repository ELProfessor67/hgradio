/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import Breadcrum from "@/components/Breadcrum";
import Sponsor1 from "@/assets/Sponsor1.jpg";
// import { toast } from "sonner";
import { toast } from "sonner";
import { ButtonLoading } from "@/utils/Loading";

const Page = () => {
  return (
    <div>
      <Breadcrum mainTitle="Sponsors" subTitle="Join us as a sponsor" />
      <Form />
    </div>
  );
};

export default Page;

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

  const [amount, setAmount] = useState("");
  const [otherText, setOtherText] = useState("");

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
  };

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload: Record<string, any> = {
        ...formData,
      };

      if (formData.method === "gift" && amount) {
        payload.amount = amount;
      }

      if (formData.method === "other" && otherText) {
        payload.otherText = otherText;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sponsor`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to submit");

      toast.success("Sponsorship submitted!",{
                style: {
                  background: "green",
                  border : "none",
                  color : "white"
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
    } catch (err) {
      toast.error("Submission failed",{
                style: {
                  background: "red",
                  border : "none",
                  color : "white"
                },
              });
    }finally{
      setLoading(false)
    }
  };

  return (
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
            Join As A Sponsor
          </h2>
          <div className="text-second font-semibold text-center">
            <p>Thank you for considering sponsoring our radio station!</p>
            <p>
              Please fill out the form below to specify your sponsorship
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
              Please select the type of program or person you wish to sponsor:
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
          </div>

          {/* Sponsorship Method */}
          <div className="space-y-3">
            <p>Please describe how you wish to sponsor:</p>
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
              <input
                type="number"
                placeholder="Amount (USD)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-[1.1rem] py-3 px-4 bg-[#28344cdb] w-full outline-none"
              />
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
              and understand that your sponsorship will be used to further our
              programming and outreach efforts.
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-second relative w-[10rem] h-[2.70rem] text-black font-semibold"
            >
              {loading ? <ButtonLoading /> : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
