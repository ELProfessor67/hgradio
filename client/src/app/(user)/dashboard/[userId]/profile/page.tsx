"use client";

import Breadcrum from "@/components/Breadcrum";
import React, { useEffect, useState } from "react";
import bg2 from "@/assets/previous-show.jpg";
import Link from "next/link";
import { useData } from "@/context/Context";
import { ButtonLoading, PageLoading, SubmitLoading } from "@/utils/Loading";
import { uploadFile } from "@/utils/imageUpload";
import { FaXmark } from "react-icons/fa6";
import Image from "next/image";
import { FaCloudUploadAlt } from "react-icons/fa";
import { toast } from "sonner";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";


interface FormDataType {
  name: string;
  country: string;
  city: string;
  state: string;
  zipCode: string;
  description: string;
  profileImg: string;
}

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
            <h3 className=" text-[1.5rem] text-second ">My Profile</h3>
            <Link
              href={`/dashboard/${userData._id}`}
              className=" bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out px-7 py-2 "
            >
              Dashboard
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
  const { userData, setUserData } = useData();
  const [formData, setFormData] = useState<FormDataType>({
    name: userData.name || "",
    city: userData.city || "",
    state: userData.state || "",
    country: userData.country || "",
    zipCode: userData.zipCode || "",
    description: userData.description || "",
    profileImg: userData.profileImg || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/update`,
        {
          method: "PUT",
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
      }
      console.log("hello", result.user);
      
        if(result.user && result.token){
          setUserData({
            ...result.user,
            token: result.token
          })
        }
        else{
          toast.success("Failed to update profile", {
        style: {
          background: "red",
          border: "none",
          color: "white",
        },
      });
      return
        }
      toast.success("Profile Updated Successfully", {
        style: {
          background: "green",
          border: "none",
          color: "white",
        },
      });
      // setFormData({
      //   name: "",
      //   city: "",
      //   state: "",
      //   country: "",
      //   zipCode: "",
      //   description: "",
      //   profileImg: "",
      // });

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
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className=" mt-[4rem] space-y-3 ">
      <ImageUpload formData={formData} setFormData={setFormData} />

      <input
        type="text"
        placeholder="Full Name"
        value={formData.name}
        onChange={(e) =>
          setFormData({
            ...formData,
            name: e.target.value,
          })
        }
        className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
      />
      <div className=" flex items-center gap-3 ">
        <input
          type="email"
          placeholder="Email"
          value={userData.email}
          readOnly
          className="text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
        />
        <input
          type="text"
          placeholder="Country"
          value={formData.country}
          onChange={(e) =>
            setFormData({
              ...formData,
              country: e.target.value,
            })
          }
          className="text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full"
        />
      </div>

      <div className=" flex items-center gap-2 ">
        <input
          type="text"
          placeholder="City"
          value={formData.city}
          onChange={(e) =>
            setFormData({
              ...formData,
              city: e.target.value,
            })
          }
          className="text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full"
        />
        <input
          type="text"
          placeholder="State"
          value={formData.state}
          onChange={(e) =>
            setFormData({
              ...formData,
              state: e.target.value,
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

      <div className=" pt-[1rem] ">
        <button
          // disabled={loading}
          className=" bg-second hover:bg-second/90 transition-all duration-300 ease-in-out w-[10rem] h-[2.7rem] text-[#000] relative "
        >
          {loading ? <ButtonLoading /> : "Update Profile"} 
        </button>
      </div>
    </form>
  );
};

interface DataProps {
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
}

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
              profileImg: uploadedUrl,
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
    <div className=" max-w-[20rem]  w-full space-y-2 ">
      <label htmlFor="" className=" text-lg font-semibold ">
        Profile Image
      </label>
      <div className=" relative border-2 border-second h-[20rem] rounded-lg overflow-hidden ">
        {loading && <SubmitLoading />}
        {!loading && formData.profileImg ? (
          <div>
            <div
              onClick={() => {
                setFormData({
                  ...formData,
                  profileImg: "",
                });
              }}
              className={` ${
                loading ? "hidden" : ""
              } cursor-pointer absolute right-3 top-3 p-2 z-40 shadow-inner bg-red-400 rounded-full text-[#fff] w-fit text-[1.5rem] `}
            >
              <FaXmark />
            </div>
            <div className=" w-full h-[20rem] relative ">
              <Image
                src={formData.profileImg}
                alt="Profile Img"
                fill
                className=" w-full h-full object-cover  "
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
          className={` mt-1 ${
            toastMessage.type === "Error" ? "text-red-500" : "text-green-500"
          } `}
        >
          {toastMessage.message}
        </p>
      )}
    </div>
  );
};
