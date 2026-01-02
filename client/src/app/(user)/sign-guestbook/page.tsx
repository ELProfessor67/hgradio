"use client";
import Ads from "@/components/Ads";
import Breadcrum from "@/components/Breadcrum";
import Sponsor1 from "@/assets/Sponsor1.jpg";
import { ButtonLoading } from "@/utils/Loading";
import React, { useState } from "react";
import { toast } from "sonner";

interface GuestbookFormData {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  state: string;
  inviteFullName: string;
  inviteEmail: string;
  inviteCountry: string;
  inviteCity: string;
  inviteState: string;
  inviteZipCode: string;
  message: string;
}



const Page = () => {
  const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/contact" },
    { videoSrc: "/vid2.mp4", link: "/contact" },
    { videoSrc: "/vid3.mp4", link: "/contact" },
  ];

  return (
    <div>
      <Breadcrum
        mainTitle="Sign Guestbook"
        subTitle="Invite Friends & Family"
      />
      <Form />
      <Ads items={videoAds} />
    </div>
  );
};

export default Page;

const Form = () => {
  const [formData, setFormData] = useState<GuestbookFormData>({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    city: "",
    state: "",
    inviteFullName: "",
    inviteEmail: "",
    inviteCountry: "",
    inviteCity: "",
    inviteState: "",
    inviteZipCode: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const buildComment = (data: GuestbookFormData) => {
    const lines: string[] = [];
    lines.push("Guestbook Submission");
    lines.push("");
    lines.push("Your Information:");
    lines.push(`- Country: ${data.country || "-"}`);
    lines.push(`- City: ${data.city || "-"}`);
    lines.push(`- State: ${data.state || "-"}`);
    lines.push("");
    lines.push("Invite Friends & Family:");
    lines.push(`- Full Name: ${data.inviteFullName || "-"}`);
    lines.push(`- Email: ${data.inviteEmail || "-"}`);
    lines.push(`- Country: ${data.inviteCountry || "-"}`);
    lines.push(`- City: ${data.inviteCity || "-"}`);
    lines.push(`- State: ${data.inviteState || "-"}`);
    lines.push(`- Zip Code: ${data.inviteZipCode || "-"}`);
    lines.push("");
    lines.push("Message:");
    lines.push(data.message || "-");
    return lines.join("\n");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.firstName.trim()) {
      toast.error("First name is required.", {
        style: { background: "red", border: "none", color: "white" },
      });
      setLoading(false);
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last name is required.", {
        style: { background: "red", border: "none", color: "white" },
      });
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required.", {
        style: { background: "red", border: "none", color: "white" },
      });
      setLoading(false);
      return;
    }
    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address.", {
        style: { background: "red", border: "none", color: "white" },
      });
      setLoading(false);
      return;
    }
    if (!formData.message.trim()) {
      toast.error("Message is required.", {
        style: { background: "red", border: "none", color: "white" },
      });
      setLoading(false);
      return;
    }
    if (formData.inviteEmail.trim() && !validateEmail(formData.inviteEmail)) {
      toast.error("Please enter a valid invite email address.", {
        style: { background: "red", border: "none", color: "white" },
      });
      setLoading(false);
      return;
    }

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      comment: buildComment(formData),
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data?.message || "Something went wrong", {
          style: { background: "red", border: "none", color: "white" },
        });
        return;
      }

      toast.success("Guestbook submitted successfully!", {
        style: { background: "green", border: "none", color: "white" },
      });

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        country: "",
        city: "",
        state: "",
        inviteFullName: "",
        inviteEmail: "",
        inviteCountry: "",
        inviteCity: "",
        inviteState: "",
        inviteZipCode: "",
        message: "",
      });
    } catch (_) {
      toast.error("Failed to submit guestbook", {
        style: { background: "red", border: "none", color: "white" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url(${Sponsor1.src})`,
      }}
      className=" bg-black py-[5rem] text-[#fff] relative "
    >
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className=" max-w-[1500px] mx-auto px-3 relative z-20 ">
        <div className=" text-center leading-tight mb-[5rem] ">
          <div className="text-[2rem] font-semibold text-second mb-2 ">
            Sign Guestbook
          </div>
          <h2 className=" text-[2.5rem] md:text-[3rem] font-bold mb-6 text-[#fff] ">
            Invite Friends & Family
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className=" space-y-10 ">
            <div>
              <h3 className=" text-[1.5rem] font-semibold mb-[2rem] text-second ">
                Enter Your Information
              </h3>
              <div className=" space-y-2 md:space-y-3 ">
                <div className=" flex items-center gap-2 md:gap-5 ">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
                <div className=" flex items-center gap-2 md:gap-5 ">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
                <div className=" flex items-center gap-2 md:gap-5 ">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                    value={formData.city}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className=" text-[1.5rem] font-semibold mb-[2rem] text-second ">
                Invite Friends And Family Members
              </h3>
              <div className=" space-y-2 md:space-y-3 ">
                <div className=" flex items-center gap-2 md:gap-5 ">
                  <input
                    type="text"
                    name="inviteFullName"
                    placeholder="Full Name"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                    value={formData.inviteFullName}
                    onChange={handleChange}
                  />
                  <input
                    type="email"
                    name="inviteEmail"
                    placeholder="Email"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                    value={formData.inviteEmail}
                    onChange={handleChange}
                  />
                </div>
                <div className=" flex items-center gap-2 md:gap-5 ">
                  <input
                    type="text"
                    name="inviteCountry"
                    placeholder="Country"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                    value={formData.inviteCountry}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="inviteCity"
                    placeholder="City"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                    value={formData.inviteCity}
                    onChange={handleChange}
                  />
                </div>
                <div className=" flex items-center gap-2 md:gap-5 ">
                  <input
                    type="text"
                    name="inviteState"
                    placeholder="State"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                    value={formData.inviteState}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    name="inviteZipCode"
                    placeholder="Zip Code"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                    value={formData.inviteZipCode}
                    onChange={handleChange}
                  />
                </div>
                <textarea
                  rows={7}
                  name="message"
                  placeholder="Message"
                  className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className=" flex justify-center pt-[1rem] ">
              <button
                type="submit"
                disabled={loading}
                className=" bg-second relative w-[10rem] h-[2.70rem] text-[#000] font-semibold  "
              >
                {loading ? <ButtonLoading /> : "Submit"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
