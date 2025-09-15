"use client";

import { useData } from "@/context/Context";
import { FetchLoading } from "@/utils/Loading";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";



interface UserType {
  _id: string;
  email: string;
  name?: string;
}

interface PageProps {
  params: Promise<{ adminId: string }>;
}

const Page: React.FC<PageProps> = ({ params }) => {
  const { adminId } = React.use(params);

  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userData, setUserData } = useData();
  // const [updateField, setUpdateField] = useState("");
  const router = useRouter()
  const [toastMessage, setToastMessage] = useState({
    type: "",
    message: "",
    msgFor: "",
  });
  const [emailChangeData, setEmailChangeData] = useState({
    password: "",
    newEmail: "",
    confirmEmail: "",
  });
  const [passwordChangeData, setPasswordChangeData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/auth/me/${adminId}`,
          {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userData.token}`,
    },
  }
        );
        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }
        const data = await res.json();
        setUser(data.user);

        // Update formData when user data is fetched
      } catch (err: unknown) {
        console.error(err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unknown error");
        }
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [adminId]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailChangeData({
      ...emailChangeData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordChangeData({
      ...passwordChangeData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangeEmailSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!userData?.token || !userData?._id) {
      setToastMessage({
        type: "ERROR",
        message: "Something went wrong!!",
        msgFor: "EMAIL",
      });
      return;
    }

    const payload = {
      password: emailChangeData.password?.trim(),
      newEmail: emailChangeData.newEmail?.trim(),
      confirmEmail: emailChangeData.confirmEmail?.trim(),
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/${userData._id}/change-email`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setUserData({
          ...userData,
          email: emailChangeData.newEmail,
        });
        setEmailChangeData({
          password: "",
          newEmail: "",
          confirmEmail: "",
        });
        setToastMessage({
          type: "SUCCESS",
          message: "Email changed successfully!",
          msgFor: "EMAIL",
        });
      } else {
        setToastMessage({
          type: "ERROR",
          message: data.message || "Failed to change email",
          msgFor: "EMAIL",
        });
      }
    } catch (error) {
      console.error("Email update error:", error);
      setToastMessage({
        type: "ERROR",
        message: "Something went wrong!!",
        msgFor: "EMAIL",
      });
    }
  };

  const handleChangePasswordSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!userData?.token) {
      setToastMessage({
        type: "ERROR",
        message: "Something went wrong!!",
        msgFor: "PASSWORD",
      });
      return;
    }

    const payload = {
      oldPassword: passwordChangeData.oldPassword?.trim(),
      newPassword: passwordChangeData.newPassword?.trim(),
      confirmPassword: passwordChangeData.confirmPassword?.trim(),
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/${userData._id}/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setPasswordChangeData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setToastMessage({
          type: "SUCCESS",
          message: "Password changed successfully!",
          msgFor: "PASSWORD",
        });
      } else {
        setToastMessage({
          type: "ERROR",
          message: data.message || "Failed to change password",
          msgFor: "PASSWORD",
        });
      }
    } catch (error) {
      console.error("Password update error:", error);
      setToastMessage({
        type: "ERROR",
        message: "Something went wrong!!",
        msgFor: "PASSWORD",
      });
    }
  };


  const deleteAccount = async () => {
    

    if(!userData.token){
      setToastMessage({
        type: "ERROR",
        msgFor: "DeleteAccount",
        message: "You do not authenticate to delete account"
      })
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/${adminId}/delete-account`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userData.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setToastMessage({
          type: "ERROR",
        msgFor: "DeleteAccount",
          message: errorData.message || "Failed to delete user",
        });
        return;
      }

      setToastMessage({
        type: "SUCCESS",
        msgFor: "DeleteAccount",
        message: "Account Deleted Successfully!!",
      });

      setUserData({})
      router.push("/")

    } catch (error) {
      console.error("Cancel account deletion error:", error);
      setToastMessage({
        type: "ERROR",
        msgFor: "DeleteAccount",
        message: "Failed to delete account",
      });
    }
  };


  if (loading)
    return (
      <div className=" relative min-h-[20rem] ">
        <FetchLoading />
      </div>
    );
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user data</div>;

  return (
    <div className=" max-w-[40rem] mx-auto ">
      {/* {updateField === "EMAIL" && ( */}
      <form onSubmit={handleChangeEmailSubmit} className=" mt-[2rem] text-[#fff] ">
        <div className=" space-y-2 ">
          <input
            type="password"
            className=" w-full py-2 px-3 bg-transparent border-2 border-[#e4e4e4]  outline-none  "
            placeholder="Password"
            name="password"
            value={emailChangeData.password}
            onChange={handleEmailChange}
          />
          <input
            type="email"
            className=" w-full py-2 px-3 bg-transparent border-2 border-[#e4e4e4]  outline-none  "
            placeholder="New Email"
            name="newEmail"
            value={emailChangeData.newEmail}
            onChange={handleEmailChange}
          />
          <input
            type="email"
            className=" w-full py-2 px-3 bg-transparent border-2 border-[#e4e4e4]  outline-none  "
            placeholder="Confirm New Email"
            name="confirmEmail"
            value={emailChangeData.confirmEmail}
            onChange={handleEmailChange}
          />
        </div>
        <button className=" bg-second border-2 border-second text-[#000] w-full py-2  text-center mt-[1rem] ">
          Change Email
        </button>
      </form>

      {toastMessage &&
        toastMessage.msgFor === "PASSWORD" &&
        toastMessage.message &&
        toastMessage.type && (
          <p
            className={` text-sm mt-2 ${
              toastMessage.type === "ERROR" ? "text-red-500" : "text-green-500"
            } `}
          >
            {toastMessage.message}
          </p>
        )}
      {/* )} */}
      {/* {updateField === "PASSWORD" && ( */}
      <form onSubmit={handleChangePasswordSubmit} className=" mt-[4rem] ">
        <div className=" space-y-2 ">
          <input
            type="password"
            className=" w-full py-2 px-3 bg-transparent border-2 border-[#e4e4e4]  outline-none  "
            placeholder="Old Password"
            name="oldPassword"
            value={passwordChangeData.oldPassword}
            onChange={handlePasswordChange}
          />
          <input
            type="password"
            className=" w-full py-2 px-3 bg-transparent border-2 border-[#e4e4e4]  outline-none  "
            placeholder="New Password"
            name="newPassword"
            value={passwordChangeData.newPassword}
            onChange={handlePasswordChange}
          />
          <input
            type="password"
            className=" w-full py-2 px-3 bg-transparent border-2 border-[#e4e4e4]  outline-none  "
            placeholder="Confirm New Password"
            name="confirmPassword"
            value={passwordChangeData.confirmPassword}
            onChange={handlePasswordChange}
          />
        </div>
        <button className=" bg-second border-2 border-second text-[#000] w-full py-2  text-center mt-[1rem] ">
          Change Password
        </button>
      </form>
      {/* )} */}

      {toastMessage &&
        toastMessage.msgFor === "EMAIL" &&
        toastMessage.message &&
        toastMessage.type && (
          <p
            className={` text-sm mt-2 ${
              toastMessage.type === "ERROR" ? "text-red-500" : "text-green-500"
            } `}
          >
            {toastMessage.message}
          </p>
        )}

      <div className=" mt-[3rem] ">
        <div onClick={deleteAccount} className=" bg-[#fc1f44] cursor-pointer border-2 border-[#fc1f44] text-[#fff] hover:bg-[#fff] hover:border-[#fff] transition-colors duration-300 ease-in-out w-full py-2  text-center mt-[1rem] ">
          Delete Account
        </div>
      </div>
    </div>
  );
};

export default Page;
