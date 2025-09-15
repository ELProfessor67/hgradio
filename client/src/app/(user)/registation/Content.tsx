"use client";

import { useData } from "@/context/Context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { RiHome9Line } from "react-icons/ri";
import { toast } from "sonner";
import { ButtonLoading } from "@/utils/Loading";

const Page = () => {
  // const { userData } = useData();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    message: "",
  });
  const router = useRouter();
  const { setUserData } = useData();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
      return "Password must be at least 8 characters long.";
    if (!hasUppercase.test(password))
      return "Password must include at least one uppercase letter.";
    if (!hasNumber.test(password))
      return "Password must include at least one number.";
    if (!hasSpecialChar.test(password))
      return "Password must include at least one special character.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      setToastMessage({
        type: "ERROR",
        message: "Please enter a valid email address.",
      });
      return;
    }

    const validationError = validatePassword(formData.password);
    if (validationError) {
      setToastMessage({
        type: "ERROR",
        message: validationError,
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setToastMessage({
        type: "ERROR",
        message: "Passwords do not match.",
      });
      return;
    }

    setToastMessage({
      type: "",
      message: "",
    });

    try {
      setToastMessage({
        type: "",
        message: "",
      });
      setIsLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setToastMessage({
          type: "ERROR",
          message: data.error || "Something went wrong",
        });
        return;
      }

      console.log(data);
      if (data?.user?._id) {
        setIsLoading(false)
        toast.success("User Registered Successfully!!",{
                style: {
                  background: "green",
                  border : "none",
                  color : "white"
                },
              });
          setUserData({
            ...data?.user,
            token: data?.token,
          });
          router.push(`/dashboard/${data?.user?._id}`);
      } else {
        setToastMessage({
          type: "ERROR",
          message: "Something went wrong!!",
        });
        setIsLoading(false)
        return;
      }
    } catch (err: unknown) {
      let message = "Something went wrong";

      if (err instanceof Error) {
        message = err.message;
      }

      setToastMessage({
        type: "ERROR",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // console.log(formData);

  // if (userData._id) {
  //   return (
  //     <div className="bg-[#000]/90 h-[100vh] flex flex-col">
  //       <div className="max-w-[1400px] mx-auto px-3 w-full">
  //         <div className="h-[5rem] flex items-center justify-between">
  //           <Link href={`/`} className="text-[2rem] text-white">
  //             EduBridge
  //           </Link>
  //           <Link
  //             href={`/`}
  //             className="flex items-center gap-2 border-2 border-[#0400ff] text-white transition-colors duration-300 ease-in-out  px-8 py-2 text-[1.1rem]"
  //           >
  //             <RiHome9Line className="text-[1.3rem]" />
  //             <span>Home</span>
  //           </Link>
  //         </div>
  //       </div>

  //       <div className="flex-1 flex flex-col items-center justify-center text-white text-[1.2rem] font-medium text-center">
  //         <h3 className="mb-3">You are already logged in</h3>
  //         <Link
  //           href={`/dashboard/${userData._id}`}
  //           className="underline text-blue-400 hover:text-blue-500 transition"
  //         >
  //           Go to Dashboard
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className=" bg-[#000000] min-h-screen h-full text-[#fff] login-bg ">
      <div className=" max-w-[1400px] mx-auto h-full px-3 ">
        <div className=" h-[5rem] flex items-center justify-between  ">
          <Link href={`/`} className=" text-[2rem] ">
            <div>EduBridge</div>
          </Link>
          <Link
            href={`/`}
            className="flex items-center gap-2 border-2 border-[#0400ff] text-[#fff] transition-colors duration-300 ease-in-out  px-8 py-2 text-[1.1rem]  "
          >
            <RiHome9Line className=" text-[1.3rem] " />
            <span>Home</span>
          </Link>
        </div>

        <div className=" h-[calc(100vh-5rem)] flex items-center ">
          <form
            onSubmit={handleSubmit}
            className=" max-w-[40rem] border-2 border-[#252525] mx-auto p-[2rem]  "
          >
            <div className=" text-center space-y-2 ">
              <h3 className=" text-[2rem] ">Sign Up</h3>
              {/* <p className=" text-[#cfcfcf] max-w-[22rem] mx-auto ">
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                Inventore, rem.
              </p> */}
            </div>

            <div className=" mt-[2rem] space-y-3 ">
              <div className=" text-[1.1rem] space-y-2 ">
                <label htmlFor="">Name*</label>
                <input
                  type="text"
                  placeholder="Enter your email"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 bg-[#fff]/10 text-white  focus:ring-2 focus:ring-[#0400ff] transition-all duration-300 ease-out outline-none"
                />
              </div>
              <div className=" text-[1.1rem] space-y-2 ">
                <label htmlFor="">Email*</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 bg-[#fff]/10 text-white  focus:ring-2 focus:ring-[#0400ff] transition-all duration-300 ease-out outline-none"
                />
              </div>
              <div className=" text-[1.1rem] space-y-2 ">
                <label htmlFor="">Password*</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 bg-[#fff]/10 text-white  focus:ring-2 focus:ring-[#0400ff] transition-all duration-300 ease-out outline-none"
                />
              </div>
              <div className=" text-[1.1rem] space-y-2 ">
                <label htmlFor="">Confirm Password*</label>
                <input
                  type="password"
                  placeholder="Enter your confirm password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 bg-[#fff]/10 text-white  focus:ring-2 focus:ring-[#0400ff] transition-all duration-300 ease-out outline-none"
                />
              </div>

              <div className="  ">
                {toastMessage && toastMessage.type && toastMessage.message && (
                  <p
                    className={` text-sm ${
                      toastMessage.type === "ERROR"
                        ? "text-red-500"
                        : "text-green-500"
                    } `}
                  >
                    {toastMessage.message}
                  </p>
                )}
              </div>

              <div className=" pt-[1rem]  text-[1.1rem] ">
                <button className=" relative h-[2.7rem] w-full bg-[#0400ff] text-[#fff] hover:bg-[#2f00ff]  font-medium transition-all duration-300 ease-in-out ">
                  {isLoading ? <ButtonLoading /> : (
                    "Sign Up"
                  )}
                </button>
              </div>

              <div className=" pt-[1rem] ">
                New to EduBridge?{" "}
                <Link
                  href={`/login`}
                  className=" text-[#0400ff] border-b border-[#0400ff] font-medium "
                >
                  Sign In Now
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
