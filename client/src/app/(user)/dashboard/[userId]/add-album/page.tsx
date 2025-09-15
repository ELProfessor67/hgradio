"use client";

import Breadcrum from "@/components/Breadcrum";
import React, { useEffect, useState } from "react";
import bg2 from "@/assets/previous-show.jpg";
import Link from "next/link";
import { useData } from "@/context/Context";
import { ButtonLoading, PageLoading, SubmitLoading } from "@/utils/Loading";
import { uploadFile, uploadVideo } from "@/utils/imageUpload";
import { FaXmark } from "react-icons/fa6";
import Image from "next/image";
import { FaCloudUploadAlt, FaTrash } from "react-icons/fa";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SongType {
  name: string;
  duration: number;
  url: string;
}

interface FormDataType {
  title: string;
  description: string;
  coverImg: string;
  price: string | number;
  releaseYear: string | number;
  songs: SongType[];
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
            <h3 className=" text-[1.5rem] text-second ">Add Album</h3>
            <Link
              href={`/dashboard/${userData._id}`}
              className=" bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out px-7 py-2 "
            >
              Dashboards
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
  const [formData, setFormData] = useState<FormDataType>({
    title: "",
    description: "",
    coverImg: "",
    price: "",
    releaseYear: "",
    songs: [],
  });
  const [loading, setLoading] = useState(false)
  const { userData } = useData();
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/add-album`,
        {
          method: "POST",
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
        // throw new Error(result.message || "Something went wrong");
      }

      toast.success("Album Added Successfully", {
        style: {
          background: "green",
          border: "none",
          color: "white",
        },
      });
      setFormData({
        title: "",
        description: "",
        coverImg: "",
        price: "",
        releaseYear: "",
        songs: [],
      });

      setTimeout(() => {
        router.push(`/dashboard/${userData._id}`)
      }, 2000);

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
      console.error("Error creating album:", error);
    } finally {
      setLoading(false)
    }
  };

  return (
    <form onSubmit={handleSubmit} className=" mt-[4rem] space-y-3 ">
      <ImageUpload formData={formData} setFormData={setFormData} />

      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) =>
          setFormData({
            ...formData,
            title: e.target.value,
          })
        }
        className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
      />
      <div className=" flex items-center gap-3 ">
        <input
          type="number"
          placeholder="Release Year"
          min="1900"
          max={new Date().getFullYear()}
          value={formData.releaseYear}
          onChange={(e) =>
            setFormData({
              ...formData,
              releaseYear: e.target.value,
            })
          }
          className="text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full"
        />
        <input
          type="number"
          placeholder="Price"
          min="0"
          step="0.01"
          value={formData.price ?? 0}
          onChange={(e) =>
            setFormData({
              ...formData,
              price: e.target.value,
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
      <SongUpload formData={formData} setFormData={setFormData} />

      <div className=" pt-[1rem] ">
        <button disabled={loading} className=" bg-second w-[10rem] h-[2.7rem] text-[#000] relative ">
          {
            loading ? <ButtonLoading /> : "Add Album"
          }
        </button>
      </div>
    </form>
  );
};

interface DataProps {
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
}

const SongUpload: React.FC<DataProps> = ({ formData, setFormData }) => {
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: string;
    message: string;
  }>({ type: "", message: "" });

  const maxSize = 15 * 1024 * 1024; // max 15MB per song

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
        URL.revokeObjectURL(audio.src);
      };
      audio.onerror = () => resolve(0); // fallback
    });
  };

  const handleFilesUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      if (files[i].size <= maxSize) {
        validFiles.push(files[i]);
      } else {
        setToastMessage({
          type: "Error",
          message: `File "${files[i].name}" exceeds 15 MB limit and was skipped.`,
        });
      }
    }

    if (validFiles.length === 0) return;

    setLoading(true);
    setToastMessage({ type: "", message: "" });

    try {
      const uploadedSongs: SongType[] = [];
      for (const file of validFiles) {
        const url = await uploadVideo(file);
        if (url) {
          const duration = await getAudioDuration(file);
          uploadedSongs.push({ name: file.name, url, duration });
        }
      }

      if (uploadedSongs.length > 0) {
        setFormData({
          ...formData,
          songs: [...(formData.songs || []), ...uploadedSongs],
        });
        setToastMessage({
          type: "Success",
          message: `${uploadedSongs.length} song${
            uploadedSongs.length > 1 ? "s" : ""
          } uploaded successfully.`,
        });
        setTimeout(() => {
          setToastMessage({
            type: "",
            message: "",
          });
        }, 5000);
      }
    } catch (error) {
      console.error("Song upload error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "An error occurred during song upload.";

      toast.error(errorMessage, {
        style: {
          background: "red",
          border: "none",
          color: "white",
        },
      });

      setToastMessage({
        type: "Error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
      event.target.value = ""; // reset input
    }
  };

  const removeSong = (index: number) => {
    const updatedSongs = formData.songs.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      songs: updatedSongs,
    });
  };

  return (
    <div className="max-w-2xl w-full  rounded-lg shadow-md space-y-4">
      <label className="block text-lg font-semibold mb-2">Upload Songs</label>

      <div
        className={`relative border-2 min-h-[13rem] border-dashed rounded-md border-gray-400 p-6 cursor-pointer hover:border-second transition-colors ${
          loading ? "opacity-60 pointer-events-none" : ""
        }`}
        onClick={() => document.getElementById("songUploadInput")?.click()}
      >
        {loading ? (
          <SubmitLoading />
        ) : (
          <div>
            <div className="flex flex-col items-center justify-center gap-3 text-gray-600">
              <FaCloudUploadAlt className="text-4xl" />
              <p>Click or drag & drop audio files here</p>
              <p className="text-sm text-gray-400">
                Supported formats: MP3, WAV, OGG
              </p>
              <p className="text-sm text-gray-400">Max size per file: 15MB</p>
            </div>
            <input
              type="file"
              id="songUploadInput"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={handleFilesUpload}
            />
          </div>
        )}
      </div>

      {/* {loading && <p className="text-center text-green-600 font-medium">Uploading songs...</p>} */}

      {formData.songs && formData.songs.length > 0 && (
        <div className="space-y-3">
          <p className="font-semibold">Uploaded Songs:</p>
          <ul className="max-h-64 overflow-auto space-y-2 ">
            {formData.songs.map((song, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-[#222222] py-1 px-2 rounded-md shadow-sm"
              >
                <div className=" space-y-2 ">
                  {/* <p className="truncate max-w-xs">{song.name}</p> */}
                  <input
                    type="text"
                    placeholder="Song Name"
                    value={song.name}
                    onChange={(e) => {
                      const updatedSongs = [...formData.songs];
                      updatedSongs[index].name = e.target.value;
                      setFormData({ ...formData, songs: updatedSongs });
                    }}
                    className=" outline-none px-3 bg-transparent text-white w-full border-b border-gray-600 pb-1 "
                  />
                  <audio
                    controls
                    src={song.url}
                    className="w-56 "
                    preload="metadata"
                    style={{
                      colorScheme: "dark",
                      backgroundColor: "transparent",
                      height: "1.7rem",
                    }}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => removeSong(index)}
                    className="text-red-600 hover:text-red-800 p-2"
                    aria-label={`Remove song ${song.name}`}
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {toastMessage.message && (
        <p
          className={`mt-2 text-center ${
            toastMessage.type === "Error" ? "text-red-600" : "text-green-600"
          } font-medium`}
        >
          {toastMessage.message}
        </p>
      )}
    </div>
  );
};

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
              coverImg: uploadedUrl,
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
    <div className=" max-w-[25rem]  w-full space-y-2 ">
      <label htmlFor="" className=" text-lg font-semibold ">
        Cover Image
      </label>
      <div className=" relative border-2 border-second h-[20rem] rounded-lg overflow-hidden ">
        {loading && <SubmitLoading />}
        {!loading && formData.coverImg ? (
          <div>
            <div
              onClick={() => {
                setFormData({
                  ...formData,
                  coverImg: "",
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
                src={formData.coverImg}
                alt="Album Cover Img"
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
