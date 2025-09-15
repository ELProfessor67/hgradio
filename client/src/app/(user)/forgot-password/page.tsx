/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import Logo from "@/assets/Logo.png";
import { ButtonLoading } from "@/utils/Loading";
import Link from "next/link";
import Image from "next/image";
import { useData } from "@/context/Context";


const Page = () => {
  return (
    <div className="bg-black min-h-screen flex items-center justify-center  text-white">
      <PasswordResetForm/>
    </div>
  );
};

export default Page;


const PasswordResetForm = () => {
  const {userData} = useData()
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Please enter your email", {
        style: { background: "red", color: "white" },
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();
      
      if (data.success) {
        toast.success("Password reset link sent!", {
          style: { background: "green", color: "white" },
        });
        setEmail("");
      } else {
        toast.error(data.message || "Failed to send reset link", {
          style: { background: "red", color: "white" },
        });
      }
    } catch (err) {
      toast.error("Error sending reset link", {
        style: { background: "red", color: "white" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
       <div className="flex items-center justify-center pb-10">
        <Link href={`/`} className=" flex items-center gap-1 font-poppins ">
          <Image src={Logo} alt="Logo" className=" w-[10rem] object-contain " />
        </Link>
       </div>
      <div className="max-w-[500px] border shadow-lg p-5 space-y-5 mx-auto ">
        <p>Forgot your password? No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one.</p>

        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="text-[1.1rem] py-3 px-4 bg-[#28344cdb] w-full outline-none mb-6"
        />

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-second w-[12rem] h-[3rem] text-black font-semibold"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </div>
      </div>
    </div>
  );
};

