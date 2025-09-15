import Ads from "@/components/Ads";
import Breadcrum from "@/components/Breadcrum";
import React from "react";
import Sponsor1 from "@/assets/Sponsor1.jpg"



const page = () => {
  const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/contact" },
    { videoSrc: "/vid2.mp4", link: "/contact" },
    { videoSrc: "/vid3.mp4", link: "/contact" },
  ];

  return (
    <div>
      <Breadcrum
        mainTitle="Sign Guestbook"
        subTitle="Invite Friends & Family"
      />
      <Form />
      <Ads items={videoAds} />
    </div>
  );
};

export default page;

const Form = () => {
  return (
    <div style={{
        backgroundImage: `url(${Sponsor1.src})`,
      }} className=" bg-black py-[5rem] text-[#fff] relative ">
        <div className="absolute inset-0 bg-black/50 z-0" />
      <div className=" max-w-[1500px] mx-auto px-3 relative z-20 ">
        <div className=" text-center leading-tight mb-[5rem] ">
          <div className="text-[2rem] font-semibold text-second mb-2 ">
            Sign Guestbook
          </div>
          <h2 className=" text-[2.5rem] md:text-[3rem] font-bold mb-6 text-[#fff] ">
            Invite Friends & Family
          </h2>
        </div>

        <div>
          <div className=" space-y-10 ">
            <div>
              <h3 className=" text-[1.5rem] font-semibold mb-[2rem] text-second ">
                Enter Your Information
              </h3>
              <div className=" space-y-2 md:space-y-3 ">
                <div className=" flex items-center gap-2 md:gap-5 ">
                  <input
                    type="text"
                    placeholder="First Name"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  />
                </div>
                <div className=" flex items-center gap-2 md:gap-5 ">
                  <input
                    type="text"
                    placeholder="Email"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  />
                </div>
                <div className=" flex items-center gap-2 md:gap-5 ">
                  <input
                    type="text"
                    placeholder="City"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  />
                  <input
                    type="text"
                    placeholder="State"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className=" text-[1.5rem] font-semibold mb-[2rem] text-second ">
                Invite Friends And Family Members
              </h3>
              <div className=" space-y-2 md:space-y-3 ">
                <div className=" flex items-center gap-2 md:gap-5 ">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  />
                  <input
                    type="text"
                    placeholder="Email"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  />
                </div>
                <div className=" flex items-center gap-2 md:gap-5 ">
                  <input
                    type="text"
                    placeholder="Country"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  />
                  <input
                    type="text"
                    placeholder="City"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  />
                </div>
                <div className=" flex items-center gap-2 md:gap-5 ">
                  <input
                    type="text"
                    placeholder="State"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  />
                  <input
                    type="text"
                    placeholder="Zip Code"
                    className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                  />
                </div>
                <textarea
                  rows={7}
                  placeholder="Message"
                  className=" text-[1.1rem] py-3 px-4 outline-none bg-[#28344cdb] w-full "
                />
              </div>
            </div>

            <div className=" flex justify-center pt-[1rem] ">
              <button className=" bg-second px-10 py-3 text-[#000] font-semibold  ">
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
