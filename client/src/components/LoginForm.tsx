/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import bg1 from "@/assets/vector.jpg";
import { useData } from "@/context/Context";
import { ButtonLoading } from "@/utils/Loading";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useState } from "react";
import { toast } from "sonner";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginForm = () => {
  const { setUserData } = useData();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleRegisterClick = () => {
    router.push("/albums/sell-album?openForm=true");
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.email || !formData.password) {
      return alert("Please fill in both email and password.");
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return toast.error(data?.error || "Login failed. Try again.",{
          style: {
            background: "red",
            border: "none",
            color: "white",
          },
        });
      }

      if (data?.user?._id) {
        setUserData({
          ...data.user,
          token: data.token,
        });

        toast.success("User Log in successfully!", {
          style: {
            background: "green",
            border: "none",
            color: "white",
          },
        });
        router.push(`/dashboard/${data.user._id}`);
      } else {
        toast.error("Unexpected response.", {
          style: {
            background: "red",
            border: "none",
            color: "white",
          },
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed. Try again.", {
        style: {
          background: "red",
          border: "none",
          color: "white",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0B1834] py-10">
      <div className="space-y-5 pb-10">
        <h2 className=" text-xl md:text-3xl font-bold text-center  text-second">
          Access Your Account
        </h2>
        <h2 className="text-2xl md:text-4xl font-extrabold text-center  text-white">
          Enter Your Credentials
        </h2>
      </div>
      <div className="max-w-[1500px] mx-auto px-5 flex flex-col items-center lg:flex-row gap-10">
        <div className="w-full lg:w-[55%]">
          <form onSubmit={handleSubmit} className="   w-full space-y-6 ">
            <div className="space-y-8">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full text-[1rem] py-3 px-4 outline-none bg-white/10 text-white placeholder:text-white/60 "
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full text-[1rem] py-3 px-4 outline-none bg-white/10 text-white placeholder:text-white/60 "
                required
              />
            </div>

            <div className="flex justify-between items-center text-white text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="accent-second font-medium p-1 text-base"
                />
                Remember me
              </label>
              <a
                href="/forgot-password"
                className="hover:underline font-medium text-base text-second"
              >
                Forgot password?
              </a>
            </div>

            <div className="flex justify-between gap-4 ">
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 bg-second text-black py-2  hover:bg-opacity-90 relative  hover:bg-transparent  overflow-hidden font-medium text-lg p-3 group"
              >
                <span className="relative z-10">{loading ? <ButtonLoading /> : "Login"}</span>
                <span className="absolute inset-0 bg-second scale-x-0 origin-center transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </button>

              <button
                type="button"
                onClick={handleRegisterClick}
                className="w-1/2 border border-second text-second py-2 relative hover:bg-opacity-90  font-medium hover:bg-second hover:text-black transition hover:bg-transparent  overflow-hidden  text-lg p-3 group"
              >
                <span className="relative z-10">
                  Register
                </span>
                <span className="absolute inset-0 bg-second scale-x-0 origin-center transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </button>
            </div>
          </form>
        </div>
        <div className="flex-1">
          <Image src={bg1} alt="Vector" className="" />
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
