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
import s1 from "@/assets/s1.jpg";
import s2 from "@/assets/s2.jpg";
import s3 from "@/assets/s3.jpg";
import s4 from "@/assets/s4.jpg";
import s5 from "@/assets/s5.jpg";
import s6 from "@/assets/s6.jpg";
import s7 from "@/assets/s33.jpg";
const days = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];


const showsData = {
  Saturday: [
    {
      id: 1,
      showImg: s3,
      artistImg: s3,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 3,
      showImg: s5,
      artistImg: s5,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 4,
      showImg: s6,
      artistImg: s6,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 5,
      showImg: s1,
      artistImg: s1,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 6,
      showImg: s2,
      artistImg: s2,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
  ],
  Sunday: [
    {
      id: 1,
      showImg: s1,
      artistImg: s1,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 3,
      showImg: s2,
      artistImg: s2,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
  ],
  Monday: [
    {
      id: 1,
      showImg: s1,
      artistImg: s1,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
  ],
  Tuesday: [
    {
      id: 1,
      showImg: s1,
      artistImg: s1,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 3,
      showImg: s2,
      artistImg: s2,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
  ],
  Wednesday: [
    {
      id: 1,
      showImg: s1,
      artistImg: s1,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 3,
      showImg: s2,
      artistImg: s2,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
  ],
  Thursday: [
    {
      id: 1,
      showImg: s1,
      artistImg: s1,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: s2,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 3,
      showImg: s3,
      artistImg: s3,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 4,
      showImg: s4,
      artistImg: s4,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 5,
      showImg: s5,
      artistImg: s5,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 6,
      showImg: s6,
      artistImg: s6,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 7,
      showImg: s1,
      artistImg: s1,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 8,
      showImg: s2,
      artistImg: s2,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
  ],
  Friday: [
    {
      id: 1,
      showImg: s1,
      artistImg: s1,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: s2,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 3,
      showImg: s3,
      artistImg: s3,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 4,
      showImg: s4,
      artistImg: s4,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 5,
      showImg: s5,
      artistImg: s5,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 6,
      showImg: s6,
      artistImg: s6,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 7,
      showImg: s1,
      artistImg: s1,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
    {
      id: 8,
      showImg: s2,
      artistImg: s2,
      time: "09:00-10:AM",
      showName: "Music of Pop",
      artistName: "RJ Janeski",
    },
  ],
};

const Schedule = () => {
  const pathname = usePathname();
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const todayIndex: number = new Date().getDay();
    const days: string[] = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[todayIndex];
  });

  const itemsPerPage = 6;
  const shows = showsData[selectedDay as keyof typeof showsData] || [];

  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    setStartIndex(0);
  }, [selectedDay]);

  const len = shows.length;

  const extendedShows = [...shows, ...shows];
  const currentShows = extendedShows.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePrev = () => {
    setStartIndex((prev) => (prev === 0 ? len - 1 : prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev === len - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative bg-[#0c1c3d] z-20 text-white min-h-screen py-10 overflow-hidden">
      <Image src={bglefttop} alt="corner" className="absolute top-8 left-8" />
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
      <div className="text-center py-16">
        <h2 className="text-3xl md:text-7xl z-50 font-extrabold">
          Scheduled Programs
        </h2>
      </div>
      <div className="max-w-[1500px] mx-auto px-3 z-50">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-[300px]">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-5">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`p-4 text-lg text-center font-semibold bg-[#2f3e58] hover:bg-second/20 hover:text-second ${
                    selectedDay === day
                      ? "text-second bg-second/20"
                      : "text-white"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {currentShows.map((show, index) => (
                // <Link href={"/show-details"} key={startIndex + "-" + index}>
                  <div key={startIndex + "-" + index} className="relative   w-full md:w-[350px] h-[260px] overflow-hidden   group cursor-pointer">
                    <Image
                      src={s7.src}
                      width={s7.width}
                      height={s7.height}
                      alt="Descriptive text about the image"
                      className="object-cover w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent transition-opacity duration-300 flex flex-col justify-between p-4">
                      <div>
                        <h3 className="text-xl font-semibold">{show.time}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-white">
                        <div className="flex-shrink-0">
                          <Image
                            src={show.artistImg}
                            alt={show.artistName}
                            width={50}
                            height={50}
                            className="rounded-full object-cover w-12 h-12"
                          />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="text-xl font-semibold">
                            {show.showName}
                          </h3>
                          <p className="text-base font-medium text-gray-300">
                            {show.artistName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                // </Link>
              ))}
            </div>

            {shows.length > itemsPerPage && (
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={handlePrev}
                  className="px-2 py-1  bg-second text-gray-800"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
