"use client";
import Breadcrum from "@/components/Breadcrum";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import HAbout3 from "@/assets/HAbout3.png";
import HAbout1 from "@/assets/HAbout1.png";
import About1 from "@/assets/About1.jpg";
import About2 from "@/assets/About2.jpg";
import About3 from "@/assets/About3.jpg";
import { Accordian } from "@/utils/Util";
import Review1 from "@/assets/Review1.jpg";
import HAbout4 from "@/assets/HAbout4.png";
import Ads from "@/components/Ads";
import { useState } from "react";
import { getDevotionForDay } from "@/utils/devotions";


const page = () => {

  const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/sign-guestbook" },
    { videoSrc: "/vid2.mp4", link: "/sign-guestbook" },
    { videoSrc: "/vid3.mp4", link: "/sign-guestbook" },

  ];

  return (
    <div>
      <Breadcrum mainTitle="About Us" subTitle="Our Introduction" />
      <AboutUs />
      <Websites />
      <Stats />
      <Daily />
      <Ads items={videoAds} />
    </div>
  );
};

export default page;

const Daily = () => {
  const [date, setDate] = useState<string>("");
  const [devotion, setDevotion] = useState<any>([]);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  useEffect(() => {
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    setDate(`${day} ${monthNames[month]} ${year}`);
    /**
     * Straight from the shared table — no padding step any more. The old code
     * topped every reading up to 10 blocks by repeating earlier ones, which is
     * why the same "Meditation" and "Question for Today" closed every single
     * devotion. Each supplied reading is complete on its own.
     */
    setDevotion(getDevotionForDay(day));
  }, [])
  return (
    <div className=" bg-[#000000e0] py-[5rem] relative ">

      <div className=" absolute right-0 bottom-0 ">
        <Image
          src={HAbout4}
          alt="Home about 1"
          className=" w-[5rem] object-contain "
        />
      </div>

      <div className=" text-center leading-tight mb-[5rem] ">
        <div className="text-[2rem] font-semibold text-second mb-2 ">
          {date}
        </div>
        <h2 className="text-[3rem] font-bold mb-6 text-[#fff] ">
          Daily Devotions
        </h2>

        
      </div>

      <div className=" max-w-[1000px] mx-auto px-3 text-[#fff] md:text-xl min-h-[30rem] ">
       {devotion.map((item: any, index: number) => (
        <div key={index}>
          {item.type === "title" && <h3 className="text-[1.5rem] font-bold mb-2 text-[#fff] ">{item.text}</h3>}
          {item.type === "subtitle" && <h4 className="text-[1.2rem] font-semibold mb-2 text-second ">{item.text}</h4>}
          {item.type === "verse" && <p className="text-[1.2rem] font-semibold mb-2 text-[#fff] ">{item.text}</p>}
          {item.type === "section" && <h4 className="text-[1.2rem] font-semibold mb-2 text-[#fff] ">{item.text}</h4>}
          {item.type === "paragraph" && <p className="text-[1.2rem] mb-2 text-[#fff] ">{item.text}</p>}
          {item.type === "prayer" && <p className="text-[1.2rem] font-semibold mb-2 text-[#fff] ">{item.text}</p>}
        </div>
       ))}
      </div>
    </div>
  )
}

const Stats = () => {
  return (
    <div
      className="relative bg-cover bg-center bg-no-repeat overflow-hidden py-[7rem] "
      style={{
        backgroundImage: `url(${Review1.src})`,
      }}
    >
      <div className="absolute inset-0 bg-black/50 z-0" />

      <div className=" relative z-20 max-w-[1300px] mx-auto px-3 flex items-center lg:flex-row flex-col gap-10 text-[#fff]  ">
        <div className=" flex-1 ">
          <Image src={About3} alt="Review image 3 " className="  " />
        </div>
        <div className=" flex-1 pl-[0rem] ">
          <h3 className=" text-second text-[2rem] font-semibold ">
            Music Shows
          </h3>
          <div className=" text-[2rem] lg:text-[3rem] font-bold leading-tight ">
            <span className="text-green-400">Vision:</span> Reaching Over 2.6 Billion People One Faith, One Future.
          </div>
          <p className=" text-lg my-[2rem] lg:my-[3rem] text-gray-200 ">
            Let the soul-stirring melodies of gospel music uplift you on our
            Hallelujah Radio station. Tune in for divine inspiration today.
          </p>
          <div className=" grid grid-cols-3 gap-3 ">
            <div className="  font-semibold leading-tight ">
              <div className=" text-[2rem] text-second ">Be one of <br />2B+</div>
              <div className=" text-[2rem] ">Listeners</div>
            </div>
            <div className="  font-semibold leading-tight ">
              <div className=" text-[3rem] text-second ">20+</div>
              <div className=" text-[2rem] ">Shows</div>
            </div>
            <div className="  font-semibold leading-tight ">
              <div className=" text-[3rem] text-second ">5+</div>
              <div className=" text-[2rem] ">RJs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Websites = () => {
  return (
    <div className=" bg-[#000000e0] relative py-[5rem] ">
      <div className="  absolute top-5 left-5 ">
        <Image
          src={HAbout1}
          alt="Home about 1"
          className=" w-[20rem] object-contain "
        />
      </div>

      <div className=" text-center leading-tight mb-[5rem] px-3 ">
        <div className="text-[2rem] font-semibold text-second mb-2 ">
          Our websites
        </div>
        <h2 className=" text-[2.5rem] lg:text-[3rem] font-bold mb-6 text-[#fff] ">
          Hallelujah Gospel Platforms
        </h2>
      </div>

      <div className=" max-w-[1300px] mx-auto px-3 flex items-center lg:flex-row flex-col lg:gap-4 gap-7 xl:gap-10 ">
        <div className=" w-full lg:w-[40%] flex lg:justify-start justify-center ">
          <Image src={About2} alt="About image 2" />
        </div>
        <div className=" w-full lg:w-[60%] ">
          <Accordian />
        </div>
      </div>
    </div>
  );
};

const AboutUs = () => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className=" relative py-[3rem] bg-[#1f2226] ">
      <div className=" max-w-[1300px] mx-auto px-3 ">
        <div className=" max-w-[1300px] mx-auto px-3 flex py-[1rem] md:flex-row flex-col md:gap-0 gap-5  ">
          <div className="flex-1 relative flex sm:justify-start justify-center overflow-hidden ">
            <div className=" sm:flex hidden absolute bottom-0 right-0 -z-0 h-full items-center">
              <Image
                src={HAbout3}
                alt="rotation image"
                className="w-[40rem] object-contain slow-spin"
              />
            </div>
            <Image
              src={About1}
              alt="cd image"
              className="relative  z-50"
            />
          </div>

          <div className=" text-[#fff] flex-1 flex items-center md:pl-[2rem] lg:pl-[5rem] ">
            <div>
              <h3 className=" text-second text-[2rem] font-semibold ">
                About Us
              </h3>
              <div className=" text-[2rem] font-semibold ">
                Welcome! We Are So Glad You Are Here!
              </div>
              <div className=" text-lg my-[2rem] ">
                <p className=" font-semibold ">
                  If you are searching for hope, you have come to the right
                  place.
                </p>
                <p>
                  At Choice Radio, we see ourselves as a platform with a strong
                  mandate to empower people to worship God like never before. We
                  endeavor to make your every encounter with Choice Radio
                  uplifting and encouraging, so please enjoy the station and
                  allow us to be a blessing to you.
                </p>

                {expanded && <>

                  <p className=" my-2">
                    Whatever the day brings, we are here to keep you company.
                    It is our prayer that you will come with an expectant heart and let the Lord minister to you.
                    And remember to invite your family and friends, so that they,
                    too, will experience the anointing and feel the jubilance in their spirit.
                  </p>
                </>}
              </div>
              {!expanded && <>
                <div className="">
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="  px-8 py-3 bg-second font-semibold text-[#000] "
                  >
                    See More
                  </button>
                </div>
              </>}
            </div>
          </div>
        </div>

        {expanded && <>
          <p className=" my-2 text-white text-lg">
            It's all about praising God together! This is also a venue to get your ministries heard throughout the region and across the globe, so be sure to contact us to know more about our program schedule and how we can work together.
          </p>
          <p className=" my-2 text-white text-lg">
            It is no coincidence that you have found us online, and we hope that you also find Choice Radio a place of refuge, faith, love, healing, and deliverance.
          </p>
          <blockquote className="mt-4 bg-[#1b2846] p-3 text-white text-lg rounded-md py-4 flex items-center">
            <span className="h-[2rem] w-[2px] bg-second rounded-full inline-block mr-2"></span>
            He Put A New Song In My Mouth, A Hymn Of Praise To Our God. (- Psalm 40:3)
          </blockquote>
        </>}
      </div>
    </div>
  );
};
