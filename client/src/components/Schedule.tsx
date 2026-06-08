"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import bglefttop from "@/assets/left-plus.png";
import bgrighttop from "@/assets/about-circle2.png";
import bgleftbottom from "@/assets/bottom-box-shape.png";
import bgrightbottom from "@/assets/bottom-line.png";

import { usePathname } from "next/navigation";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
import s7 from "@/assets/s33.jpg";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface ScheduleEntry {
  name: string;
  profilePicUrl: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  days: string[];
}

type ScheduleData = Record<string, ScheduleEntry[]>;

/** Generate initials (up to 2 chars) from a name */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Pick a deterministic background color from name */
function getAvatarColor(name: string): string {
  const colors = [
    "#e74c3c",
    "#e67e22",
    "#f1c40f",
    "#2ecc71",
    "#1abc9c",
    "#3498db",
    "#9b59b6",
    "#e91e63",
    "#00bcd4",
    "#ff5722",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/** Format "HH:MM" => "H:MM AM/PM" */
function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

interface AvatarProps {
  name: string;
  profilePicUrl: string | null;
}

const Avatar: React.FC<AvatarProps> = ({ name, profilePicUrl }) => {
  if (profilePicUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profilePicUrl}
        alt={name}
        className="rounded-full object-cover w-12 h-12 flex-shrink-0"
      />
    );
  }

  const initials = getInitials(name);
  const bg = getAvatarColor(name);

  return (
    <div
      className="rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center font-bold text-white text-base"
      style={{ backgroundColor: bg }}
      title={name}
    >
      {initials}
    </div>
  );
};

const Schedule = () => {
  const pathname = usePathname();

  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const todayIndex: number = new Date().getDay();
    return DAYS[todayIndex];
  });

  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("https://hgdjlive.com/api/v1/schedule-public");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ScheduleData = await res.json();
        setScheduleData(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load schedule"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const itemsPerPage = 6;
  const shows: ScheduleEntry[] = scheduleData[selectedDay] || [];

  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    setStartIndex(0);
  }, [selectedDay]);

  const len = shows.length;
  const currentShows = shows.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    setStartIndex((prev) => (prev === 0 ? Math.max(0, len - itemsPerPage) : prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      prev + itemsPerPage >= len ? 0 : prev + 1
    );
  };

  return (
    <div className="relative bg-[#0c1c3d] z-20 text-white h-fit py-10 overflow-hidden">
      <Image src={bglefttop} alt="corner" className="absolute top-8 left-8 -z-[1]" />
      {pathname !== "/" ? (
        <Image
          src={bgrighttop}
          alt="corner"
          className="absolute -top-[10%] -right-[25%] md:-top-[15%] md:-right-[18%] lg:-top-[28%] lg:-right-[14%] w-[200px] md:w-[300px] lg:w-[577px] z-[-1]"
          style={{ animation: "spin 10s linear infinite" }}
        />
      ) : (
        ""
      )}
      {pathname !== "/" ? (
        <Image
          src={bgleftbottom}
          alt="corner"
          className="absolute bottom-0 left-0 z-[-1]"
        />
      ) : (
        ""
      )}
      <Image
        src={bgrightbottom}
        alt="corner"
        className="absolute bottom-0 right-0 z-[-1]"
      />
      <div className="text-center pt-4 pb-14">
        <h2 className="text-3xl md:text-5xl z-50 font-extrabold">
          Daily Programs Schedule
        </h2>
      </div>
      <div className="max-w-[1500px] mx-auto px-3 z-50">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Day selector */}
          <div className="lg:w-[300px]">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-5">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`p-4 text-lg text-center font-semibold bg-[#2f3e58] hover:bg-second/20 hover:text-second ${
                    selectedDay === day ? "text-second bg-second/20" : "text-white"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule cards */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-second"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-48 text-red-400">
                <p>Error: {error}</p>
              </div>
            ) : shows.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                <p>No shows scheduled for {selectedDay}.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {currentShows.map((show, index) => (
                    <div
                      key={`${show.name}-${show.startTime}-${index}`}
                      className="relative w-full md:w-[350px] h-[260px] overflow-hidden group cursor-pointer"
                    >
                      <Image
                        src={s7.src}
                        width={s7.width}
                        height={s7.height}
                        alt="Schedule background"
                        className="object-cover w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent transition-opacity duration-300 flex flex-col justify-between p-4">
                        <div>
                          <h3 className="text-xl font-semibold">
                            {formatTime(show.startTime)} – {formatTime(show.endTime)}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-white">
                          <Avatar
                            name={show.name}
                            profilePicUrl={show.profilePicUrl}
                          />
                          <div className="flex flex-col">
                            <h3 className="text-xl font-semibold">{show.name}</h3>
                            <p className="text-sm text-gray-300">{show.timezone}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {shows.length > itemsPerPage && (
                  <div className="flex justify-center gap-4 mt-6">
                    <button
                      onClick={handlePrev}
                      className="px-2 py-1 bg-second text-gray-800"
                    >
                      <IoIosArrowBack size={20} />
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-2 py-1 bg-second text-gray-800"
                    >
                      <IoIosArrowForward size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
