import React, { useState } from "react";
import HAbout1 from "@/assets/HAbout1.png";
import HAbout2 from "@/assets/HAbout2.jpg";
import HAbout3 from "@/assets/HAbout3.png";
import HAbout4 from "@/assets/HAbout4.png";
import Image from "next/image";
import Link from "next/link";

const AboutUs = () => {
  const [seemore, setseemore] = useState(false);
  return (
    <div className=" relative py-[1rem] bg-[#1f2226] overflow-hidden ">
      <div className=" absolute right-0 bottom-0 ">
        <Image
          src={HAbout4}
          alt="Home about 1"
          className=" w-[3rem] md:w-[5rem] object-contain "
        />
      </div>
      <div className="     ">
        <div className=" ">
          <Image
            src={HAbout1}
            alt="Home about 1"
            className=" md:w-[16rem] w-[12rem] lg:w-[20rem] object-contain "
          />
        </div>
        {/* <div className=" max-w-[1500px] mx-auto ">
          <div className=" flex-1 relative   ">
            <div className=" absolute -top-[5rem] lg:-top-[12.5rem] right-0 ">
              <Image
                src={HAbout3}
                alt="rotation image"
                className=" w-[15rem] lg:w-[20rem] object-contain slow-spin "
              />
            </div>
            <Image src={HAbout2} alt="cd image" />
            <p className=" mt-[1rem] text-[1.3rem] text-yellow-500 text-center ">
              Come back To Gospel Choice Radio
            </p>
          </div>
          <div className=" text-[#fff] flex-1 flex items-center lg:pl-[5rem] ">
            <div>
              <h3 className=" text-second md:text-[1.7rem] text-[1.5rem] lg:text-[2rem] font-semibold ">
                About Us
              </h3>
              <div className=" md:text-[2.5rem] text-[2rem] lg:text-[3rem] font-semibold ">
                Welcome to HGC Radio Station!
              </div>
              <p className=" text-lg my-[2rem] ">
                If you are searching for hope, you have come to the right place.
                At Choice Radio, we see ourselves as a platform with a strong
                mandate to empower people to worship God like never before. We
                endeavor to make your every encounter with Choice Radio
                uplifting and encouraging, so please enjoy the station and allow
                us to be a blessing to you.
              </p>
              {
                !seemore &&
                <div className="  ">
                  <button
                    onClick={() => setseemore(!seemore)}
                    className="  px-8 py-3 bg-second font-semibold text-[#000] "
                  >
                    See More
                  </button>
                </div>
              }
            </div>
          </div>
          {seemore && <>
            <div className=" text-[#fff] mt-[2rem] space-y-5 text-lg ">
              <p>
                It's all about praising God together! This is also a venue to get your
                ministries heard throughout the region and across the globe, so be sure to
                contact us to know more about our program schedule and how we can work
                together.
              </p>
              <p>
                It is no coincidence that you have found us online, and we hope that you
                also find Choice Radio a place of refuge, faith, love, healing, and
                deliverance.
              </p>
              <div className=" bg-[#1b2846] p-3 flex gap-4 ">
                <div className=" w-[2px] h-7 bg-second rounded-full " />
                <p>
                  He Put A New Song In My Mouth, A Hymn Of Praise To Our God. (- Psalm 40:3)
                </p>
              </div>
            </div>

            <div className="mt-4">
              <button className="px-8 py-3 bg-second font-semibold text-[#000]" onClick={() => setseemore(false)}>
                See Less
              </button>
            </div>

          </>}


        </div> */}


        <div className=" max-w-[1500px] mx-auto px-3 ">
          <div className=" flex lg:flex-row flex-col py-[1rem] lg:gap-0 gap-[2rem] ">
            <div className=" flex-1 relative   ">
              <div className=" absolute -top-[5rem] lg:-top-[13rem] right-0 ">
                <Image
                  src={HAbout3}
                  alt="rotation image"
                  className=" w-[15rem] lg:w-[20rem] object-contain slow-spin "
                />
              </div>
              <Image src={HAbout2} alt="cd image" />
              <p className=" mt-[1rem] text-[1.3rem] text-yellow-500 text-center ">
                Come back To Gospel Choice Radio
              </p>
            </div>
            <div className=" text-[#fff] flex-1 flex laptop:items-center items-start lg:pl-[2rem] ">
              <div>
                <h3 className=" text-second md:text-[1.7rem] text-[1.5rem] lg:text-[2rem] font-semibold ">
                  About Us
                </h3>
                <div className=" md:text-[2.5rem] text-[2rem] lg:text-[3rem] font-semibold ">
                  Welcome to HGC Radio Station!
                </div>
                <p className="overflow-hidden transition-all duration-700 ease-in-out text-lg leading-8 ">
                  If you are searching for hope, you have come to the right place. At
                  Choice Radio, we see ourselves as a platform with a strong mandate to
                  empower people to worship God like never before. We endeavor to make
                  your every encounter with Choice Radio uplifting and encouraging, so
                  please enjoy the station and allow us to be a blessing to you.
                  Whatever the day brings, we are here to keep you company. It is our
                  prayer that you will come with an expectant heart and let the Lord
                  minister to you. And remember to invite your family and friends, so
                  that they, too, will experience the anointing and feel the jubilance
                  in their spirit.
                </p>

                {
                  !seemore &&
                  <div className="  ">
                    <button
                      onClick={() => setseemore(true)}
                      className="  px-8 py-3 bg-second font-semibold text-[#000] mt-4"
                    >
                      See More
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>

          {
            seemore && <>
              <div className=" text-[#fff] mt-[2rem] space-y-5 text-lg ">
                <p>
                  It's all about praising God together! This is also a venue to get your
                  ministries heard throughout the region and across the globe, so be sure to
                  contact us to know more about our program schedule and how we can work
                  together.
                </p>
                <p>
                  It is no coincidence that you have found us online, and we hope that you
                  also find Choice Radio a place of refuge, faith, love, healing, and
                  deliverance.
                </p>
                <div className=" bg-[#1b2846] p-3 flex gap-4 ">
                  <div className=" w-[2px] h-7 bg-second rounded-full " />
                  <p>
                    He Put A New Song In My Mouth, A Hymn Of Praise To Our God. (- Psalm
                    40:3)
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button className="px-8 py-3 bg-second font-semibold text-[#000]" onClick={() => setseemore(false)}>
                  See Less
                </button>
              </div>
            </>
          }

        </div>

      </div>
    </div>
  );
};

export default AboutUs;


import Stat1 from "@/assets/Stat1.png"
import Stat2 from "@/assets/Stat2.png"

export const Stats = () => {
  return (
    <div className=" bg-[#1f2226] text-[#fff] py-[5rem] md:py-[8rem] relative ">
      <div className=" absolute left-0 bottom-0 ">
        <Image src={Stat2} alt="stat img 2" className=" " />
      </div>
      <div className=" max-w-[1300px] mx-auto px-3 flex items-center md:flex-row flex-col md:gap-0 gap-5 ">
        <div className=" md:w-[40%] space-y-3 ">
          <h2 className=" md:text-[2.5rem] text-[2rem] lg:text-[3rem] md:text-left text-center font-semibold leading-tight ">
            The Movement We're Leading
          </h2>
          <p className=" text-gray-300 md:text-left text-center ">
            We're leading a global outreach powered by faith and vision impacting lives
            beyond borders and inviting others into something eternal. Your support
            helps it grow.
          </p>
        </div>

        <div className=" md:w-[60%] grid grid-cols-2 gap-5 ">
          <div className=" text-[#fff] font-semibold bg-[#2f3237] text-center  py-[2.5rem] ">
            <div className=" text-[1.2rem] text-second ">10k+</div>
            <div className=" text-[1.4rem] ">Listeners</div>
          </div>
          <div className=" text-[#fff] font-semibold bg-[#2f3237] text-center  py-[2.5rem] ">
            <div className=" text-[1.2rem] text-second ">20+</div>
            <div className=" text-[1.4rem] ">Shows</div>
          </div>
          <div className=" text-[#fff] font-semibold bg-[#2f3237] text-center  py-[2.5rem] ">
            <div className=" text-[1.2rem] text-second ">3+ years</div>
            <div className=" text-[1.4rem] ">Experience</div>
          </div>
          <div className="  ">
            <Image src={Stat1} alt="stamp icon" className=" w-[9rem] mx-auto object-contain " />
          </div>
        </div>
      </div>
    </div>
  )
}