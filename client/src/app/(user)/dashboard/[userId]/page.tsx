"use client";

import Breadcrum from "@/components/Breadcrum";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import bg2 from "@/assets/previous-show.jpg";
import { useData } from "@/context/Context";
import { FetchLoading, PageLoading } from "@/utils/Loading";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SongType {
  name: string;
  duration: number;
  url: string;
}

interface AlbumType {
  _id: string;
  title: string;
  artist: string; // ObjectId as string
  releaseYear: number;
  price: number;
  description: string;
  coverImg: string;
  songs: SongType[];
  createdAt?: string;
  updatedAt?: string;
}

const Page = () => {
  const { userData, logout } = useData();

  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [albums, setAlbums] = useState<AlbumType[]>([]);
  const [error, setError] = useState("");

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/get-albums`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to fetch albums");
        return;
      }

      setAlbums(data.albums || []);
      setError("");
    } catch (err) {
      console.error("Fetch albums error:", err);
      setError("Failed to fetch albums.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    if (userData?.token) {
      fetchAlbums();
    }
  }, [userData?.token]);

  if (!hasMounted) return <PageLoading />;

  return (
    <div className=" min-h-[100vh] ">
      <Breadcrum mainTitle="Dashboard" subTitle="Add and manage your albums" />
      <div
        className="relative z-20 min-h-screen bg-no-repeat bg-cover text-[#fff] "
        style={{ backgroundImage: `url(${bg2.src})` }}
      >
        <div className="absolute inset-0 bg-black/60 z-[-1]" />

        <div className="max-w-[1500px] mx-auto py-5 px-3">
          <div className=" flex justify-between ">
            <h3 className=" text-[1.5rem] font-medium ">My Albums</h3>
            <div className=" flex items-center gap-2 ">
              <div
                onClick={() => {
                  logout();
                  toast.success("User Logged Out Successfully", {
                    style: {
                      background: "green",
                      border: "none",
                      color: "white",
                    },
                  });
                  router.push("/login");
                }}
                className=" cursor-pointer bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out w-[8rem] text-center py-2 "
              >
                Log Out
              </div>

              <Link
                href={`/dashboard/${userData._id}/profile`}
                className=" bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out w-[8rem] text-center py-2 "
              >
                Profile
              </Link>
            </div>
          </div>
            <div className=" mt-2 flex justify-end ">
              <Link
                href={`/dashboard/${userData._id}/add-album`}
                className=" bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out w-[8rem] text-center py-2 "
              >
                Add Album
              </Link>
            </div>

          {error && <p className=" text-sm text-red-500 my-2 ">{error}</p>}

          {loading && (
            <div className=" h-[20rem] relative ">
              <FetchLoading />
            </div>
          )}

          {albums.length > 0 ? (
            <div className=" mt-[4rem] grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 xl:grid-cols-4 gap-3 ">
              {albums.map((album, idx) => (
                <div key={idx} className=" group ">
                  <div className=" w-full h-[17rem] relative overflow-hidden ">
                    <Image
                      src={album.coverImg}
                      alt="Cover img"
                      fill
                      className=" object-cover group-hover:scale-110 transition-all duration-300 ease-in-out "
                    />
                  </div>
                  <div className=" bg-[#0b1834] p-3 ">
                    <div className=" text-[1.4rem] font-medium line-clamp-1 ">
                      {album.title}
                    </div>
                    <div className=" mt-3 flex items-center gap-3 ">
                      <div className=" relative w-[3.5rem] h-[3.5rem] rounded-full bg-blue-900 ">
                        {
                          userData.profileImg && <Image src={userData.profileImg} fill alt="Profile Image" className=" rounded-full object-cover " />
                        }
                      </div>
                      <div>{userData.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className=" text-gray-200 text-center h-[10rem] flex items-center justify-center ">
              There are no album yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
