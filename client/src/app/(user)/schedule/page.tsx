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

      

      <Schedule />

      <Ads items={videoAds} />
    </div>
  );
};

export default page;
