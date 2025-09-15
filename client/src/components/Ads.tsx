import Link from "next/link";
import React from "react";

interface AdItem {
  videoSrc: string;
  link?: string;
}

interface AdsProps {
  items: AdItem[];
}

const Ads = ({ items }: AdsProps) => {
  return (
    <div className="bg-black py-5 px-3 ">
      <div className="flex flex-col  md:flex-row gap-5  max-w-[1400px] mx-auto py-5">
        {items.map((item: AdItem, index: number) => (
          <Link key={index} href={item.link || "/contact"}>
            <div className=" overflow-hidden shadow-md aspect-video">
              <video
                src={item.videoSrc}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Ads;
