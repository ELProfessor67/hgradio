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
import Team1 from "@/assets/Team1.png";
import Team2 from "@/assets/Team2.jpeg";
import Team3 from "@/assets/Team3.jpg";
import Team4 from "@/assets/Team4.png";
import Team5 from "@/assets/kenny.png";
import Team6 from "@/assets/greg.jpg";
import Team7 from "@/assets/adia.png";
import Team8 from "@/assets/PLA.jpg";
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
      artistImg: Team8,
      time: "8:00 AM - 10:00 AM",
      showName: "Morning Pop Boost",
      artistName: "Pastor Larry Austin",
      engineerId: "Pastor-Larry",
    },
    {
      id: 2,
      showImg: s5,
      artistImg: Team5,
      time: "10:00 AM - 12:00 PM",
      showName: "Pop Hits Hour",
      artistName: "Kenny Andrews",
      engineerId: "Kenny-Andrews",
    },
    {
      id: 3,
      showImg: s6,
      artistImg: Team3,
      time: "12:00 PM - 2:00 PM",
      showName: "Weekend Vibes",
      artistName: "Apostle Gary L. Wyatt",
      engineerId: "Apostle-Gary-Wyatt",
    },
    {
      id: 4,
      showImg: s1,
      artistImg: Team1,
      time: "2:00 PM - 4:00 PM",
      showName: "Lunch Time Pop",
      artistName: "Pastor Ben Cha Me",
      engineerId: "Pastor-Ben-Cha-Me",
    },
    {
      id: 5,
      showImg: s2,
      artistImg: Team6,
      time: "4:00 PM - 6:00 PM",
      showName: "Afternoon Chill",
      artistName: "Gregory Franklin",
      engineerId: "Gregory-Franklin",
    },
  ],

  Sunday: [
    {
      id: 1,
      showImg: s1,
      artistImg: Team4,
      time: "9:00 AM - 11:00 AM",
      showName: "Sunday Brunch Beats",
      artistName: "Dr Edwards",
      engineerId: "Dr-Edwards",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: Team7,
      time: "11:00 AM - 1:00 PM",
      showName: "Soft Pop Session",
      artistName: "Adia Adia",
      engineerId: "Adia-Adia",
    },
    {
      id: 3,
      showImg: s3,
      artistImg: Team3,
      time: "1:00 PM - 3:00 PM",
      showName: "Sunday Pop & Relax",
      artistName: "Apostle Gary L. Wyatt",
      engineerId: "Apostle-Gary-Wyatt",
    },
    {
      id: 4,
      showImg: s4,
      artistImg: Team1,
      time: "3:00 PM - 5:00 PM",
      showName: "Afternoon Gospel",
      artistName: "Pastor Ben Cha Me",
      engineerId: "Pastor-Ben-Cha-Me",
    },
  ],

  Monday: [
    {
      id: 1,
      showImg: s1,
      artistImg: Team2,
      time: "6:00 AM - 8:00 AM",
      showName: "Monday Morning Energy",
      artistName: "Pastor J'on Harris and Voices",
      engineerId: "Pastor-Harris-and-Voices",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: Team6,
      time: "8:00 AM - 10:00 AM",
      showName: "Pop Express",
      artistName: "Gregory Franklin",
      engineerId: "Gregory-Franklin",
    },
    {
      id: 3,
      showImg: s1,
      artistImg: Team8,
      time: "10:00 AM - 12:00 PM",
      showName: "Midday Pop Start",
      artistName: "Pastor Larry Austin",
      engineerId: "Pastor-Larry",
    },
    {
      id: 4,
      showImg: s3,
      artistImg: Team5,
      time: "12:00 PM - 2:00 PM",
      showName: "Afternoon Pop Hits",
      artistName: "Kenny Andrews",
      engineerId: "Kenny-Andrews",
    },
  ],

  Tuesday: [
    {
      id: 1,
      showImg: s1,
      artistImg: Team8,
      time: "7:00 AM - 9:00 AM",
      showName: "Morning Pop Start",
      artistName: "Pastor Larry Austin",
      engineerId: "Pastor-Larry",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: Team4,
      time: "9:00 AM - 11:00 AM",
      showName: "Fresh Pop Tracks",
      artistName: "Dr Edwards",
      engineerId: "Dr-Edwards",
    },
    {
      id: 3,
      showImg: s3,
      artistImg: Team5,
      time: "11:00 AM - 1:00 PM",
      showName: "Midday Pop Hits",
      artistName: "Kenny Andrews",
      engineerId: "Kenny-Andrews",
    },
    {
      id: 4,
      showImg: s4,
      artistImg: Team1,
      time: "1:00 PM - 3:00 PM",
      showName: "Afternoon Gospel Pop",
      artistName: "Pastor Ben Cha Me",
      engineerId: "Pastor-Ben-Cha-Me",
    },
  ],

  Wednesday: [
    {
      id: 1,
      showImg: s1,
      artistImg: Team1,
      time: "8:00 AM - 10:00 AM",
      showName: "Midweek Pop Reload",
      artistName: "Pastor Ben Cha Me",
      engineerId: "Pastor-Ben-Cha-Me",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: Team7,
      time: "10:00 AM - 12:00 PM",
      showName: "Pop & Relax",
      artistName: "Adia Adia",
      engineerId: "Adia-Adia",
    },
    {
      id: 3,
      showImg: s3,
      artistImg: Team3,
      time: "12:00 PM - 2:00 PM",
      showName: "Afternoon Pop",
      artistName: "Apostle Gary L. Wyatt",
      engineerId: "Apostle-Gary-Wyatt",
    },
    {
      id: 4,
      showImg: s4,
      artistImg: Team8,
      time: "2:00 PM - 4:00 PM",
      showName: "Midweek Vibes",
      artistName: "Pastor Larry Austin",
      engineerId: "Pastor-Larry",
    },
  ],

  Thursday: [
    {
      id: 1,
      showImg: s1,
      artistImg: Team2,
      time: "5:00 PM - 7:00 PM",
      showName: "Evening Pop Drive",
      artistName: "Pastor J'on Harris and Voices",
      engineerId: "Pastor-Harris-and-Voices",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: Team6,
      time: "7:00 PM - 9:00 PM",
      showName: "Prime Time Pop",
      artistName: "Gregory Franklin",
      engineerId: "Gregory-Franklin",
    },
    {
      id: 3,
      showImg: s3,
      artistImg: Team4,
      time: "9:00 PM - 11:00 PM",
      showName: "Night Beats",
      artistName: "Dr Edwards",
      engineerId: "Dr-Edwards",
    },
    {
      id: 4,
      showImg: s4,
      artistImg: Team3,
      time: "11:00 PM - 1:00 AM",
      showName: "Late Night Gospel",
      artistName: "Apostle Gary L. Wyatt",
      engineerId: "Apostle-Gary-Wyatt",
    },
  ],

  Friday: [
    {
      id: 1,
      showImg: s1,
      artistImg: Team8,
      time: "3:00 PM - 5:00 PM",
      showName: "Friday Kickoff",
      artistName: "Pastor Larry Austin",
      engineerId: "Pastor-Larry",
    },
    {
      id: 2,
      showImg: s2,
      artistImg: Team5,
      time: "5:00 PM - 7:00 PM",
      showName: "Drive Home Pop",
      artistName: "Kenny Andrews",
      engineerId: "Kenny-Andrews",
    },
    {
      id: 3,
      showImg: s3,
      artistImg: Team1,
      time: "7:00 PM - 9:00 PM",
      showName: "Weekend Warmup",
      artistName: "Pastor Ben Cha Me",
      engineerId: "Pastor-Ben-Cha-Me",
    },
    {
      id: 4,
      showImg: s4,
      artistImg: Team7,
      time: "9:00 PM - 11:00 PM",
      showName: "Friday Night Pop",
      artistName: "Adia Adia",
      engineerId: "Adia-Adia",
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

  const extendedShows = [...shows];
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
          <div className="lg:w-[300px]">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-5">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`p-4 text-lg text-center font-semibold bg-[#2f3e58] hover:bg-second/20 hover:text-second ${selectedDay === day
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
                <div key={`${show.id}-${index}`} className="relative   w-full md:w-[350px] h-[260px] overflow-hidden   group cursor-pointer">
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
                      <Link href={`/studio-engineers/${show.engineerId}`} className="flex-shrink-0">
                        <Image
                          src={show.artistImg}
                          alt={show.artistName}
                          width={50}
                          height={50}
                          className="rounded-full object-cover w-12 h-12 hover:ring-2 hover:ring-second transition-all"
                        />
                      </Link>
                      <div className="flex flex-col">
                        <h3 className="text-xl font-semibold">
                          {show.showName}
                        </h3>
                        <Link href={`/studio-engineers/${show.engineerId}`} className="text-base font-medium text-gray-300 hover:text-second transition-colors">
                          {show.artistName}
                        </Link>
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
