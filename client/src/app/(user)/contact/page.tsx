"use client";

import Ads from "@/components/Ads";
import Breadcrum from "@/components/Breadcrum";
import ContactForm from "@/components/Contact";
import Link from "next/link";
import React from "react";
import { FaHeart } from "react-icons/fa";
import { IoLocationOutline, IoMailOutline } from "react-icons/io5";

const Page = () => {

  const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/contact" },
    { videoSrc: "/vid2.mp4", link: "/contact" },
    { videoSrc: "/vid3.mp4", link: "/contact" },

  ];

  return (
    <div>
      <Breadcrum mainTitle="Contact Us" subTitle="Send us a message" />
      <div className=" bg-[#071126] text-[#fff] py-[3rem] ">
        <h2 className=" text-[2.5rem] md:text-[3rem] font-semibold text-center pb-[1rem] ">
          Contact Info
        </h2>

        <div className=" max-w-[1300px] mx-auto px-3 grid grid-cols-1 md:grid-cols-3 gap-3 ">
          <div className=" bg-[#0b1834] p-[1rem]  space-y-[2rem] ">
            <div className=" flex items-center gap-5 ">
              <div className=" text-[2.5rem] md:text-[3rem] text-second bg-second/10 p-4  ">
                <IoLocationOutline />
              </div>
              <h3 className=" text-[1.7rem] md:text-[2rem] font-semibold ">Location</h3>
            </div>

            <div className=" flex gap-4 ">
              <div className=" w-2 h-2 rounded-full bg-white mt-2 "></div>
              <div>
                <p>Hallelujah Gospel Globally</p>
                <p>231 Market Place 195</p>
                <p>San Ramon CA, 94583, USA</p>
              </div>
            </div>
          </div>

          <div className=" bg-[#0b1834] p-[1rem]  space-y-[2rem] ">
            <div className=" flex items-center gap-5 ">
              <div className=" text-[2.5rem] md:text-[3rem] text-second bg-second/10 p-4  ">
                <IoMailOutline />
              </div>
              <h3 className=" text-[1.7rem] md:text-[2rem] font-semibold ">Mail</h3>
            </div>

            <div>
              <div className=" flex items-center gap-4 ">
                <div className=" w-2 h-2 rounded-full bg-white"></div>
                <p>radio@hallelujahgospel.com</p>
              </div>
              <div className=" flex items-center gap-4 ">
                <div className=" w-2 h-2 rounded-full bg-white"></div>
                <p>info@hgcradio.com</p>
              </div>
            </div>
          </div>

          <div className=" bg-[#0b1834] p-[1rem]  space-y-[2rem] ">
            <div className=" flex items-center gap-5 ">
              <div className=" text-[2.5rem] md:text-[3rem] text-second bg-second/10 p-4  ">
                <IoMailOutline />
              </div>
              <h3 className=" text-[1.7rem] md:text-[2rem] font-semibold ">Gospel Support</h3>
            </div>

            <div>
              <p>
                Please support this Gospel radio station and other Gospel
                ministries here and worldwide.
              </p>
              <Link href="/donate">
                Click here to Donate
                <div className=" mt-[1rem] flex items-center gap-1 font-semibold bg-[#12c4d1] px-6 py-1  w-fit text-[#000] ">
                  <FaHeart />
                  Share Your Love Gift
                  <FaHeart />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className=" bg-[#0b1834] text-[#fff] py-[4rem] ">
        <div className=" max-w-[1300px] mx-auto px-3 ">
          <h2 className=" text-[2.5rem] md:text-[3rem] font-semibold text-center mb-[2rem] ">
            Write Your Message
          </h2>
          <div className=" flex items-center gap-5 bg-[#d9d9d9]/10 py-4 px-5 ">
            <div className="w-1 h-[4rem] bg-second "></div>
            <p>
              We value your feedback on our platform, services, and products.
              Your input is important as we work to provide the best experience
              for our community. Thank you for being a part of our family of
              believers.
            </p>
          </div>

          <div className=" mt-[2rem] flex gap-8 md:flex-row flex-col ">
            {/* <div className=" flex-1 space-y-3 ">
              <div className=" flex items-center gap-3 ">
                <input
                  type="text"
                  placeholder="Your First Name"
                  className=" text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full "
                />
                <input
                  type="text"
                  placeholder="Your Last Name"
                  className=" text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full "
                />
              </div>
              <input
                type="email"
                placeholder="Your Email"
                className=" text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full "
              />
              <textarea
                rows={5}
                placeholder="Write a comments"
                className=" text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full "
              />
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span>I have read and agree to the Privacy Terms.</span>
              </label>
              <div className=" flex justify-center pt-[1rem] ">
                <button className=" bg-second px-10 py-3 text-[#000] font-semibold  ">Submit</button>
              </div>
            </div> */}
            <ContactForm />
            <div className=" flex-1 ">
              <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1608736.3520417982!2d-122.166628!3d38.04561400000001!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808ff28182fda679%3A0x6e3da371ea2ea132!2s231%20Market%20Pl%20%23195%2C%20San%20Ramon%2C%20CA%2094583!5e0!3m2!1sen!2sus!4v1754343804144!5m2!1sen!2sus" className=" w-full md:h-full h-[25rem] " allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
            </div>
          </div>
        </div>
      </div>
      <Ads items={videoAds} />
    </div>
  );
};

export default Page;
