import bg1 from "@/assets/bg1.jpg";
import Image from "next/image";
import React from "react";
import plus from "@/assets/el_plus.png";
import dot from "@/assets/right-dot-circle.png";

import Ads from "@/components/Ads";
import Breadcrum from "@/components/Breadcrum";


interface TopSong {
  _id: string;
  songId: string;
  songName: string;
  songUrl: string;
  songDuration: number;
  views: number;
  albumTitle: string;
  albumCover: string;
  albumId: string;
  artistName: string;
  artistId: string;
}

const Page = async () => {
  const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/contact" },
    { videoSrc: "/vid2.mp4", link: "/contact" },
    { videoSrc: "/vid3.mp4", link: "/contact" },
  ];

  let topSongs: TopSong[] = [];
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/album/top-songs?limit=10`,
      {
        cache: "no-store",
      }
    );
    const data = await res.json();
    topSongs = data.success && Array.isArray(data.songs) ? data.songs : [];
  } catch (error) {
    console.error("Error fetching top songs:", error);
    topSongs = [];
  }

  return (
    <div>
      <Breadcrum mainTitle="Chart Topping Songs" subTitle="Chart Topping Songs" />

      <div
        className="relative z-20 min-h-screen bg-no-repeat bg-cover"
        style={{
          backgroundImage: `url(${bg1.src})`,
        }}
      >
        <Image
          src={plus}
          alt="corner"
          className="absolute top-20 left-0 z-[-1]"
        />
        <Image
          src={dot}
          alt="corner"
          className="absolute top-0 right-0 z-[-1]"
        />
        <div className="absolute inset-0 bg-[#090F1D]/80 z-[-2]" />

        <div className="text-center space-y-2 py-8 relative z-[2]">
          <h3 className="text-xl font-extrabold text-[#66FCF1]">
            Most Listened To Music
          </h3>
          <h2 className="text-2xl font-extrabold text-[#D9D9D9]">
            Chart Topping Songs
          </h2>
        </div>

        <div className="max-w-[1500px] mx-auto px-3 pb-20">
          {topSongs.length === 0 ? (
            <div className="text-center text-white py-10">
              No chart data available.
            </div>
          ) : (
            <div className="overflow-x-auto bg-transparent shadow-md">
              <table className="w-full text-left text-white">
                <thead className="bg-[#4F535B] text-sm uppercase tracking-wider">
                  <tr className="border-b-2 ">
                    <th className="px-6 py-3">Rank</th>
                    <th className="px-6 py-3">Song</th>
                    <th className="px-6 py-3">Artist</th>
                    <th className="px-6 py-3">Album</th>
                    <th className="px-6 py-3">Views</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-600">
                  {topSongs.map((item, index) => (
                    <tr
                      key={item.songId}
                      className={`${index % 2 === 0 ? "bg-[#232937ef]" : "bg-[#25233bb4]"
                        } transition`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-second">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {item.albumCover && (
                            <img
                              src={item.albumCover}
                              alt={item.songName}
                              className="w-12 h-12 object-cover rounded"
                              loading="lazy"
                            />
                          )}
                          <div className="font-semibold">{item.songName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.artistName || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.albumTitle || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        {item.views}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Ads items={videoAds} />
    </div>
  );
};

export default Page;