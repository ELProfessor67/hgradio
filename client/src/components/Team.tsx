import React from "react";
import HAbout1 from "@/assets/HAbout1.png";
import Team1 from "@/assets/Team1.png";
import Team2 from "@/assets/Team2.jpeg";
import Team3 from "@/assets/Team3.jpg";
import Team4 from "@/assets/Team4.png";
import HAbout4 from "@/assets/HAbout4.png";
import Image from "next/image";
import Link from "next/link";

const Team = () => {
  const items = [
    {
      img: Team1,
      name: "Pastor Ben Cha Me",
      link: "/studio-engineers/Pastor-Ben-Cha-Me"

    },
    {
      img: Team2,
      name: "Pastor J'on Harris and Voices",
      link: "/studio-engineers/Pastor-Harris-and-Voices"
    },
    {
      img: Team3,
      name: "Apostle Gary L. Wyatt",
      link: "/studio-engineers/Apostle-Gary-Wyatt",
    },
    {
      img: Team4,
      name: "Dr Edwards",
      link: "/studio-engineers/Dr-Edwards"
    },
  ];

  return (
    <div className=" relative py-[8rem] bg-[#121416] ">
      <div className=" absolute right-0 bottom-0 ">
        <Image
          src={HAbout4}
          alt="Home about 1"
          className=" w-[5rem] object-contain "
        />
      </div>
      <div className=" absolute top-5 left-5 ">
        <Image
          src={HAbout1}
          alt="Home about 1"
          className=" w-[20rem] object-contain "
        />
      </div>
      <div className=" max-w-[1500px] mx-auto px-3 py-[1rem] ">
        <div className=" text-center leading-tight mb-[5rem] ">
          <div className="text-[2rem] font-semibold text-second mb-2 ">
            Studio Engineers
          </div>
          <h2 className="text-[3rem] font-bold mb-6 text-[#fff] ">
            Our Expert RB
          </h2>
        </div>

        <div className=" grid md:grid-cols-2 grid-cols-1 lg:grid-cols-4 gap-3 ">
          {items.map((item, idx) => (
            <Link href={item.link} key={idx} className=" relative   overflow-hidden group ">
              <div key={idx} className=" relative   overflow-hidden group ">
                <Image
                  src={item.img}
                  alt="Team Image"
                  className=" group-hover:scale-110 h-[30rem] object-cover transition-all duration-300 ease-in-out "
                />
                <div
                  className="absolute bottom-0 left-0 w-full bg-black/80 text-white text-[1.2rem] text-center py-3 
                transform translate-y-full opacity-0 
                group-hover:translate-y-0 group-hover:opacity-100 
                transition-all duration-500 ease-in-out"
                >
                  {item.name}
                </div>{" "}
              </div>
            </Link>
          ))}
        </div>

        <div className=" flex justify-center mt-[2rem] ">
          <Link
            href={`/studio-engineers`}
            className=" px-8 py-3 text-[#000] bg-second font-medium "
          >
            Explore More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Team;
