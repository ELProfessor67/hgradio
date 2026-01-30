"use client";
import Image, { StaticImageData } from "next/image";
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
import { useData } from "@/context/Context";
import Link from "next/link";
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
      time: "08:00 AM - 09:00 AM",
      showName: "Morning Pop Boost",
      artistName: "RJ Janeski",
    },
    {
      id: 2,
      showImg: s5,
      artistImg: s5,
      time: "09:15 AM - 10:15 AM",
      showName: "Pop Hits Hour",
      artistName: "DJ Alexa",
    },
    {
      id: 3,
      showImg: s6,
      artistImg: s6,
      time: "10:30 AM - 11:30 AM",
      showName: "Weekend Vibes",
      artistName: "MC Carter",
    },
    {
      id: 4,
      showImg: s1,
      artistImg: s1,
      time: "12:00 PM - 01:00 PM",
      showName: "Lunch Time Pop",
      artistName: "Luna Ray",
    },
    {
      id: 5,
      showImg: s2,
      artistImg: s2,
      time: "01:15 PM - 02:15 PM",
      showName: "Afternoon Chill",
      artistName: "DJ Mike",
    },
  ],

  Sunday: [
    {
      id: 1,
      showImg: s1,
      artistImg: s1,
      time: "11:00 AM - 12:00 PM",
      showName: "Sunday Brunch Beats",
      artistName: "Ella Green",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: s2,
      time: "12:30 PM - 01:30 PM",
      showName: "Soft Pop Session",
      artistName: "Theo Banks",
    },
  ],

  Monday: [
    {
      id: 1,
      showImg: s1,
      artistImg: s1,
      time: "07:30 AM - 08:30 AM",
      showName: "Monday Morning Energy",
      artistName: "Ava Blue",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: s2,
      time: "08:45 AM - 09:45 AM",
      showName: "Pop Express",
      artistName: "Liam Cross",
    },
  ],

  Tuesday: [
    {
      id: 1,
      showImg: s1,
      artistImg: s1,
      time: "08:00 AM - 09:00 AM",
      showName: "Pop Start",
      artistName: "Maya Vale",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: s2,
      time: "09:30 AM - 10:30 AM",
      showName: "Fresh Pop Tracks",
      artistName: "Noah Reed",
    },
    {
      id: 3,
      showImg: s3,
      artistImg: s3,
      time: "11:00 AM - 12:00 PM",
      showName: "Midday Pop Hits",
      artistName: "Zoe Hart",
    },
  ],

  Wednesday: [
    {
      id: 1,
      showImg: s1,
      artistImg: s1,
      time: "10:00 AM - 11:00 AM",
      showName: "Midweek Pop Reload",
      artistName: "Ethan Fox",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: s2,
      time: "11:30 AM - 12:30 PM",
      showName: "Pop & Relax",
      artistName: "Sophie Lane",
    },
    {
      id: 3,
      showImg: s3,
      artistImg: s3,
      time: "01:00 PM - 02:00 PM",
      showName: "Afternoon Pop",
      artistName: "Ryan Cole",
    },
  ],

  Thursday: [
    {
      id: 1,
      showImg: s1,
      artistImg: s1,
      time: "06:00 PM - 07:00 PM",
      showName: "Evening Pop Drive",
      artistName: "Mila Storm",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: s2,
      time: "07:15 PM - 08:15 PM",
      showName: "Prime Time Pop",
      artistName: "Leo Grant",
    },
    {
      id: 3,
      showImg: s3,
      artistImg: s3,
      time: "08:30 PM - 09:30 PM",
      showName: "Night Beats",
      artistName: "Chloe King",
    },
  ],

  Friday: [
    {
      id: 1,
      showImg: s1,
      artistImg: s1,
      time: "04:00 PM - 05:00 PM",
      showName: "Friday Kickoff",
      artistName: "Olivia Reed",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: s2,
      time: "05:15 PM - 06:15 PM",
      showName: "Drive Home Pop",
      artistName: "Jack Rivers",
    },
    {
      id: 3,
      showImg: s3,
      artistImg: s3,
      time: "06:30 PM - 07:30 PM",
      showName: "Weekend Warmup",
      artistName: "Nina Brooks",
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
  // const {showsData} = useData()

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
    <div className="relative bg-[#0c1c3d] z-20 text-white h-fit py-10 overflow-hidden">
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
      <div className="text-center pt-4 pb-14">
        <h2 className="text-3xl md:text-5xl z-50 font-extrabold">
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
                <Link href={`/programs/${show.id}`} key={show.id}>
                  <div  className="relative   w-full md:w-[350px] h-[260px] overflow-hidden   group cursor-pointer">
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
                </Link>
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
