import bg1 from "@/assets/bg1.jpg";
import Image from "next/image";
import React from "react";
import plus from "@/assets/el_plus.png";
import dot from "@/assets/right-dot-circle.png";

import Ads from "@/components/Ads";
import Breadcrum from "@/components/Breadcrum";

interface SongHistoryItem {
  _id : string
  title: string;
  artist: string;
  album: string;
  date: string;
  audio: string;
  cover: string;
  owner: string;
}

const Page = async () => {
  const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/contact" },
    { videoSrc: "/vid2.mp4", link: "/contact" },
    { videoSrc: "/vid3.mp4", link: "/contact" },
  ];

  const res = await fetch(
    "https://backend.hgdjlive.com/api/v1/song-history/655347b59c00a7409d9181c3",
    {
      cache: "no-store", 
    }
  );

  const history = await res.json();

  return (
    <div>
      <Breadcrum mainTitle="Previously Played" subTitle="History" />

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
            Music History
          </h3>
          <h2 className="text-2xl font-extrabold text-[#D9D9D9]">
            Recently Played
          </h2>
        </div>

        <div className="max-w-[1500px] mx-auto px-3 pb-20">
          <div className="overflow-x-auto bg-transparent shadow-md">
            <table className="w-full text-left text-white">
              <thead className="bg-[#4F535B] text-sm uppercase tracking-wider">
                <tr className="border-b-2 ">
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Artist</th>
                  <th className="px-6 py-3">Album</th>
                  <th className="px-6 py-3">Hours/Date</th>
                  <th className="px-6 py-3">Purchase</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-600">
                {history?.map((item: SongHistoryItem, index: number) => (
                  <tr
                    key={item._id}
                    className={`${
                      index % 2 === 0
                        ? "bg-[#232937ef]"
                        : "bg-[#25233bb4]"
                    } transition  `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.artist}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.album}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(item.date).toLocaleString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Ads items={videoAds} />
    </div>
  );
};

export default Page;
