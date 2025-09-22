import React from "react";
import HeroImg from "@/assets/HeroImg.jpg";
import { HeroTextBox } from "@/utils/Util";
import LegacyHeroPlayer from "@/components/LagacyHeroPlayer";

const Hero = () => {
  return (
    <div
      className="relative h-[35rem] lg:h-[40rem] bg-cover bg-top bg-no-repeat flex items-start lg:items-center lg:pt-0 pt-[5rem] overflow-hidden "
      style={{
        backgroundImage: `url(${HeroImg.src})`,
      }}
    >
      <HeroTextBox
        direction="left"
        texts={[
          "Hallelujah Gospel Choice Radio Station",
          "The Revival Station",
        ]}
      />
      <HeroTextBox
        direction="right"
        texts={[
          "Hallelujah Gospel Choice Radio Station",
          "Your highest praise",
          "Radio Station",
        ]}
      />

      <section className=" hero px-3 max-w-[1400px] mx-auto space-y-6 text-center py-16 ">
        <div className="max-w-[800px] mx-auto">
          <h1 className=" text-[2rem] md:text-[3rem] xl:text-[5rem] font-extrabold leading-tight text-[#fff] ">
            Uplifting spirits with divine melodies
          </h1>
        </div>
        <div className=" text-[#19e234] font-semibold text-[1.1rem] md:text-[1.3rem]">
          Hallelujah Choice Radio Gospel Charting God&apos;s Enormous Blessings
          Below.
        </div>
      </section>

      <div className=" absolute bottom-0 left-0 w-full ">
        <LegacyHeroPlayer />
      </div>

      {/* <div className=" absolute left-0 bottom-0 px-5 py-5 bg-black/70 w-full flex items-center justify-between lg:flex-row flex-col gap-4 ">
        <div className=" w-full flex items-center gap-4 ">
          <div className=" w-[5rem] h-[5rem] rounded-full bg-[#0e90b1] "></div>
          <div className=" text-[#fff] space-y-2 ">
            <h3 className=" text-[1.2rem] font-medium ">&quot;Auto DJ&quot;</h3>
            <div className=" text-sm space-y-1 ">
              <p>Current song : Prayer Changes Things</p>
              <p>Artist: Jon Harris , Album: Jon Harris</p>
              <p>Next song : Everything</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-7 md:gap-12 xl:gap-20 xl:pr-[10rem] w-full ">
          <div className="text-[1.6rem] text-white flex items-center gap-4 md:gap-7">
            <div className="opacity-50">
              <IoCallOutline />
            </div>
            <div>
              <FiPlay />
            </div>
            <div className="opacity-50">
              <BiCommentDots />
            </div>
          </div>

          <div className="flex items-center gap-3 max-w-[50rem] flex-grow ">
            <div className="text-white text-[1.5rem] flex items-center">
              <MdVolumeUp />
            </div>

            <div className="w-full flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value="30"
                readOnly
                className="w-full h-[.35rem] bg-[#fc2626] appearance-none cursor-pointer range-sm 
          [&::-webkit-slider-thumb]:appearance-none 
          [&::-webkit-slider-thumb]:h-5 
          [&::-webkit-slider-thumb]:w-5 
          [&::-webkit-slider-thumb]:rounded-full 
          [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
          </div>
        </div>
      </div> */}


    </div>
  );
};

export default Hero;
