"use client";

import Ads from "@/components/Ads";
import Breadcrum from "@/components/Breadcrum";
import { FetchLoading } from "@/utils/Loading";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import bg2 from "@/assets/previous-show.jpg";

const videoAds = [
  { videoSrc: "/vid1.mp4", link: "/contact" },
  { videoSrc: "/vid2.mp4", link: "/contact" },
  { videoSrc: "/vid3.mp4", link: "/contact" },
];

interface ArtistType {
  _id: string;
  name: string;
  profileImg: string;
}

interface AlbumType {
  _id: string;
  title: string;
  artist: ArtistType;
  releaseYear: number;
  price: number;
  description: string;
  coverImg: string;
  createdAt?: string;
  updatedAt?: string;
}

const Page = () => {
  const [albums, setAlbums] = useState<AlbumType[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchNewReleases = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/album?page=1&limit=10`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to fetch new releases");
        setAlbums([]);
      } else {
        setAlbums(Array.isArray(data?.albums) ? data.albums : []);
      }
    } catch (err) {
      console.error("Fetch new releases error:", err);
      setError("Failed to fetch new releases.");
      setAlbums([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchNewReleases();
  }, []);

  return (
    <div>
      <Breadcrum mainTitle="Epic Unveiling Albums" subTitle="Epic Unveiling Albums" />

      <div
        className="relative z-20 min-h-screen bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${bg2.src})` }}
      >
        <div className="absolute inset-0 bg-black/60 z-[-1]" />

        <div className="max-w-[1500px] mx-auto py-10 px-3">
          <div className="relative z-10 py-3 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">
              Epic Unveiling Albums
            </h2>
            <p className="mt-2 text-lg md:text-xl text-second font-semibold">
              New Released Projects
            </p>
          </div>

          {error && <p className="text-red-500 my-4">{error}</p>}

          {loading && (
            <div className="relative h-[20rem]">
              <FetchLoading />
            </div>
          )}

          {!loading && !error && albums.length === 0 && (
            <p className="my-5 text-white">No albums found.</p>
          )}

          <div className="mt-[4rem] grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 xl:grid-cols-4 gap-3">
            {albums.filter((al: any) => al?.approvalStatus == "approved").map((album, idx) => (
              <Link
                href={`/albums/${album._id}`}
                key={album._id}
                className="group cursor-pointer"
              >
                <div className="w-full h-[17rem] relative overflow-hidden border border-white/10">
                  <div className="absolute left-3 top-3 z-20 bg-white/10 text-white px-3 py-1 text-sm font-semibold border border-white/10">
                    New #{idx + 1}
                  </div>
                  <Image
                    src={album.coverImg}
                    alt="Cover img"
                    fill
                    className="group-hover:scale-110 transition-all duration-300 ease-in-out object-contain"
                  />
                </div>

                <div className="bg-[#0b1834] p-3 text-white">
                  <div className="text-[1.6rem] line-clamp-1 font-semibold">
                    “ {album.title} ”
                  </div>

                  <div className="mt-2 text-sm text-gray-300">
                    Release Year:{" "}
                    <span className="text-white font-semibold">
                      {album.releaseYear}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-[3.5rem] h-[3.5rem] rounded-full bg-second/70 relative overflow-hidden">
                      {album.artist?.profileImg ? (
                        <img
                          src={album.artist.profileImg}
                          loading="lazy"
                          alt="Profile Image"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="text-xl font-medium line-clamp-1">
                      {album.artist?.name}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Ads items={videoAds} />
    </div>
  );
};

export default Page;