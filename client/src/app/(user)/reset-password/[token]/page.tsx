"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ButtonLoading } from "@/utils/Loading";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    type: "",
    message: "",
  });
  const [validation, setValidation] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleResetPassword = async () => {
   if (!password) {
    setToastMessage({
      type: "ERROR",
      message: "Enter a new password",
    });
    return;
  }
  
  // Check if confirm password is empty
  if (!confirmPassword) {
    setToastMessage({
      type: "ERROR",
      message: "Please confirm your password",
    });
    return;
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    setToastMessage({
      type: "ERROR",
      message: "Passwords do not match",
    });
    return;
  }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setToastMessage({
          type: "SUCCESS",
          message: "Password reset successful",
        });
        setTimeout(() => {
           router.push("/login"); 
        }, 2000);
      } else {
        setToastMessage({
          type: "ERROR",
          message: data.message || "Failed to reset password",
        });
      }
    } catch (err) {
      console.log("server error", err);
      
      setToastMessage({
        type: "ERROR",
        message: "Server error",
      });
    } finally {
      setLoading(false);
    }
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

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const error = validatePassword(value);
    setValidation((prev) => ({
      ...prev,
      password: error,
    }));
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setValidation((prev) => ({
      ...prev,
      confirmPassword:
        value !== password ? "Passwords do not match." : undefined,
    }));
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="border shadow-md  p-6 max-w-sm w-full">
        <h1 className="text-xl font-semibold mb-8 text-[#fff] ">
          Reset Your Password
        </h1>
        <div>
          <input
            type="password"
            className="w-full bg-[#28344cdb] outline-none text-[#fff]  px-3 py-3  mb-4"
            placeholder="New password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
          />
          {validation.password && (
            <p className="text-red-500 text-sm mb-2">{validation.password}</p>
          )}
        </div>
        <div className="  ">
          <input
            type="password"
            className="w-full bg-[#28344cdb] outline-none  text-[#fff] px-3 py-3  mb-4"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
          />
          {validation.confirmPassword && (
            <p className="text-red-500 text-sm ">
              {validation.confirmPassword}
            </p>
          )}
        </div>
        {toastMessage.message && toastMessage.type && (
          <p
            className={` mt-2 text-sm ${
              toastMessage.type === "ERROR" ? "text-red-500" : "text-green-500"
            } `}
          >
            {toastMessage.message}
          </p>
        )}
        <button
          className=" mt-2 w-full bg-second text-[#000] py-2 "
          onClick={handleResetPassword}
          disabled={loading}
        >
          {loading ? <ButtonLoading /> : "Reset Password"}
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
