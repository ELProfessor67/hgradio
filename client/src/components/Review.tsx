"use client";

import React from "react";
// import Slider from "react-slick";
import Team2 from "@/assets/Team2.jpeg";
import Team3 from "@/assets/Team3.jpg";
import Review3 from "@/assets/Review3.png";

// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
// import {
//   MdOutlineKeyboardArrowLeft,
//   MdOutlineKeyboardArrowRight,
// } from "react-icons/md";
import Image from "next/image";
import Review1 from "@/assets/Review1.jpg"

// type ArrowProps = React.HTMLAttributes<HTMLDivElement>;

const Review = () => {

  // const SampleNextArrow = ({ onClick }: ArrowProps) => (
  //   <div
  //     onClick={onClick}
  //     className="absolute top-0 right-0 h-full w-[50px] z-10 flex items-center justify-center cursor-pointer"
  //   >
  //     <div className="h-[50px] w-[40px] bg-[#0400ff] flex items-center justify-center ">
  //       <MdOutlineKeyboardArrowRight className="text-white text-[2rem]" />
  //     </div>
  //   </div>
  // );

  // const SamplePrevArrow = ({ onClick }: ArrowProps) => (
  //   <div
  //     onClick={onClick}
  //     className="absolute top-0 left-0 h-full w-[50px] z-10 flex items-center justify-center cursor-pointer"
  //   >
  //     <div className="h-[50px] w-[40px] bg-[#0400ff] flex items-center justify-center ">
  //       <MdOutlineKeyboardArrowLeft className="text-white text-[2rem]" />
  //     </div>
  //   </div>
  // );

  const reviews = [
    {
      img: Team3,
      name: "Aposite Gary L. Wyatt",
      designation: "Music Artist",
      message:
        "Welcome, Our Lovely Listener, to a world of captivating melodies and engaging conversations. Join us for an enriching radio experience!",
    },
    {
      img: Team2,
      name: "Jon Harris and Voices",
      designation: "Music Artist",
      message:
        "Dear Listener, Embrace the Joy of Music and Connection. Join Our Community for Inspiring Tunes and Meaningful Conversations.",
    },
    {
      img: Review3,
      name: "Kenny Andrews",
      designation: "Music Artist",
      message:
        "Hello, Beloved Listener! Dive into a world of music and stories, where every tune resonates with your heart. Join us today!",
    },
    {
      img: Team2,
      name: "Jon Harris and Voices",
      designation: "Music Artist",
      message:
        "Dear Listener, Embrace the Joy of Music and Connection. Join Our Community for Inspiring Tunes and Meaningful Conversations.",
    },
  ];

  // const settings = {
  //   dots: true,
  //   fade: true,
  //   infinite: true,
  //   autoplay: true,
  //   speed: 1000,
  //   autoplaySpeed: 3000,
  //   slidesToShow: 1,
  //   slidesToScroll: 1,
  //   waitForAnimate: false,
  //   cssEase: "linear",
  //   nextArrow: <SampleNextArrow />,
  //   prevArrow: <SamplePrevArrow />,
  // };

  return (
    <div className="relative bg-cover bg-center bg-no-repeat overflow-hidden min-h-[50rem] py-[7rem] "
      style={{
        backgroundImage: `url(${Review1.src})`,
      }}>
        <div className="absolute inset-0 bg-black/50 z-0" />
      <div className=' relative z-10 text-center leading-tight mb-[8rem]  '>
        <div className="text-[2rem] font-semibold text-second mb-2 ">What Our Lovely Listeners Say</div>
      <h2 className="text-[3rem] font-bold mb-6 text-[#fff] ">Testimonials</h2>
      </div>
      {/* slider-container */}
      <div className=" max-w-[1500px] mx-auto px-3 overflow-hidden mt-[4rem] pb-[3rem] relative">
        {/* <Slider {...settings}> */}
          <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 ">
            {reviews.map((review, idx) => (
            <div key={idx} className=" bg-[#0b1834] p-4  ">
              <div className=" flex items-center gap-4 ">
                <div className=" p-1 bg-[#5A6ACF]   ">
                <Image
                  src={review.img}
                  alt="Review img"
                  className=" w-[4.5rem] h-[4.5rem]  object-cover "
                />
              </div>
              <div className=" text-[#fff] ">
                <div className=" text-[1.2rem] font-medium  ">{review.name}</div>
                <div className=" text-[#e6e6e6] ">{review.designation}</div>
              </div>
              </div>
              <p className=" mt-[2rem] text-base md:text-lg max-w-[35rem] mx-auto text-[#fff] ">
                {review.message}
              </p>
            </div>
          ))}
          </div>
        {/* </Slider> */}
      </div>
    </div>
  );
};

export default Review;
