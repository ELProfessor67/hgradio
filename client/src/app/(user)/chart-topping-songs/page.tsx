import bg1 from "@/assets/bg1.jpg";
import Image from "next/image";
import React from "react";
import plus from "@/assets/el_plus.png";
import dot from "@/assets/right-dot-circle.png";

import Ads from "@/components/Ads";
import Breadcrum from "@/components/Breadcrum";

interface SongHistoryItem {
  _id: string;
  title: string;
  artist: string;
  album: string;
  date: string;
  audio: string;
  cover: string;
  owner: string;
}

type ChartSong = {
  key: string;
  title: string;
  artist: string;
  album: string;
  cover?: string;
  audio?: string;
  plays: number;
};

const Page = async () => {
  const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/contact" },
    { videoSrc: "/vid2.mp4", link: "/contact" },
    { videoSrc: "/vid3.mp4", link: "/contact" },
  ];

  let history: SongHistoryItem[] = [];
  try {
    const res = await fetch(
      "https://backend.hgdjlive.com/api/v1/song-history/655347b59c00a7409d9181c3",
      {
        cache: "no-store",
      }
    );
    const data = await res.json();
    history = Array.isArray(data) ? data : [];
  } catch {
    history = [];
  }

  // Calculate daily play bonus based on days since reference date
  const referenceDate = new Date('2026-02-03'); // Reference date: 03/02/2026
  const today = new Date();
  const daysDifference = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  const dailyPlayBonus = Math.max(0, daysDifference * 2); // 2 plays per day

  const bySong = new Map<string, ChartSong>();
  for (const item of history) {
    const title = String(item?.title || "").trim();
    const artist = String(item?.artist || "").trim();
    if (!title) continue;

    const key = `${title.toLowerCase()}__${artist.toLowerCase()}`;
    const prev = bySong.get(key);
    if (prev) {
      prev.plays += 1;
    } else {
      bySong.set(key, {
        key,
        title,
        artist,
        album: String(item?.album || "").trim(),
        cover: item?.cover,
        audio: item?.audio,
        plays: 1,
      });
    }
  }

  // Add daily bonus to all songs
  for (const song of bySong.values()) {
    song.plays += dailyPlayBonus;
  }

  const topSongs = [...bySong.values()]
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

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
                    <th className="px-6 py-3">Plays</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-600">
                  {topSongs.map((item, index) => (
                    <tr
                      key={item.key}
                      className={`${
                        index % 2 === 0 ? "bg-[#232937ef]" : "bg-[#25233bb4]"
                      } transition`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-second">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {/* {item.cover ? (
                            // cover from external API is already absolute in many cases;
                            // if not, it will still render as-is in <img>
                            <img
                              src={item.cover}
                              alt={item.title}
                              className="w-12 h-12 object-cover rounded"
                              loading="lazy"
                            />
                          ) : null} */}
                          <div className="font-semibold">{item.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.artist || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.album || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        {item.plays}
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