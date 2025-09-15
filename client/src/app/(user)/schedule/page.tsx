import Breadcrum from "@/components/Breadcrum";
import Image from "next/image";
import React from "react";
import onairImg from "@/assets/onair.png";

import { TiArrowRightThick } from "react-icons/ti";
import Schedule from "@/components/Schedule";
import Ads from "@/components/Ads";
const page = () => {
  const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/contact" },
    { videoSrc: "/vid2.mp4", link: "/contact" },
    { videoSrc: "/vid3.mp4", link: "/contact" },
   
  ];
  return (
    <div>
      <Breadcrum
        mainTitle="Programs Schedule"
        subTitle="
Our Programs"
      />

      <div className="bg-[#273046] py-5  ">
        <div className="text-center space-y-2 py-8">
          <h3 className="text-xl font-extrabold text-[#66FCF1]">On Air Show</h3>
          <h2 className="text-2xl font-extrabold text-[#D9D9D9]">
            Currently Playing
          </h2>
        </div>

        <div className="flex items-center justify-evenly px-3 max-w-[1500px] mx-auto gap-10 py-5 pb-24 flex-wrap">
          <div className="relative  overflow-hidden  shadow-md">
            <Image
              src={onairImg}
              alt={`on air`}
              width={onairImg.width}
              height={onairImg.height}
              className="object-contain"
              priority
            />
          </div>
          <div className="bg-[#0B1834] w-96  text-gray-300 text-center text-xl md:text-2xl font-medium p-6 md:p-8  space-y-2 ">
            <p className="">Hallelujah Choice Radio</p>
            <p className="flex items-center justify-center gap-3 ">
              10:07 AM <TiArrowRightThick size={24} /> #### (EST)
            </p>
            <div className="py-3">
              <hr className="border-gray-600 " />
            </div>
            <p className="">By HGCRadio AutoDJ</p>
          </div>
          <div className="relative  overflow-hidden   shadow-md">
            <Image
              src={onairImg}
              alt={`on air`}
              width={onairImg.width}
              height={onairImg.height}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      <Schedule />

      <Ads items={videoAds} />
    </div>
  );
};

export default page;
