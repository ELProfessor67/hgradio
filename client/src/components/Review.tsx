"use client";

import React, { useState } from "react";
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
import Review1 from "@/assets/Review1.jpg";
import { StaticImageData } from "next/image";

// type ArrowProps = React.HTMLAttributes<HTMLDivElement>;

const PREVIEW_LENGTH = 180;

const ReviewCard = ({
  review,
}: {
  review: {
    img: StaticImageData | string;
    name: string;
    designation: string;
    message: string;
  };
}) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.message.length > PREVIEW_LENGTH;
  const displayedMessage =
    expanded || !isLong
      ? review.message
      : review.message.slice(0, PREVIEW_LENGTH).trimEnd() + "…";

  return (
    <div className="bg-[#0b1834] p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-1 bg-[#5A6ACF] flex-shrink-0">
          <Image
            src={review.img as string}
            alt={`${review.name} photo`}
            width={72}
            height={72}
            className="w-[4.5rem] h-[4.5rem] object-cover"
          />
        </div>
        <div className="text-[#fff]">
          <div className="text-[1.1rem] font-semibold leading-snug">
            {review.name}
          </div>
          <div className="text-[#c8c8c8] text-sm leading-snug">
            {review.designation}
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="mt-4 flex flex-col flex-1">
        <p className="text-[#e2e2e2] text-base leading-relaxed flex-1">
          {displayedMessage}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-3 self-start text-[#5A6ACF] hover:text-[#7a8fef] text-sm font-semibold transition-colors duration-200 underline underline-offset-2"
          >
            {expanded ? "Read Less ▲" : "Read More ▼"}
          </button>
        )}
      </div>
    </div>
  );
};

const Review = () => {
  const reviews: {
    img: StaticImageData | string;
    name: string;
    designation: string;
    message: string;
  }[] = [
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
    {
      img: "/greg.webp",
      name: "Greg",
      designation: "Kingdom Visionary",
      message:
        "Thank You, Jesus. You always show up. I give God all the glory — this vision was never meant for one person alone; it was designed for shared purpose and shared impact in the Kingdom of God. Hallelujah Gospel Globally is the main hub God is establishing for the Gospel to go forth into the world. This Gospel must be preached around the world. To anyone who has been given a vision or a dream from God: stand. Because what God has spoken, He will bring to pass. Your breakthrough is not just coming — it is already in motion.",
    },
    {
      img: "/fuazia.jpeg",
      name: "Faiza Noreen",
      designation: "District Coordinator, Human Rights & Minority Affairs",
      message:
        "I have learned about the Lord Jesus Christ my entire life, and I believe in Him and love Him with my entire being. My husband Michael and I believe Jesus is calling us to the ministry of sharing His truth and His love with others. We desire to teach the Word of God to people — many who cannot read — and to share His love with the desperately poor.",
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
    <div
      className="relative bg-cover bg-center bg-no-repeat overflow-hidden min-h-[50rem] py-[7rem]"
      style={{
        backgroundImage: `url(${Review1.src})`,
      }}
    >
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="relative z-10 text-center leading-tight mb-[2rem]">
        <div className="text-[2rem] font-semibold text-second mb-2">
          What Our Lovely Listeners Say
        </div>
        <h2 className="text-[3rem] font-bold mb-6 text-[#fff]">Testimonials</h2>
        <p className="text-[#fff] text-base md:text-lg text-center">
          Share your testimonial at{" "}
          <a className="underline" href="mailto:info@hgcradio.org">
            admin@hgcradio.org
          </a>
        </p>
      </div>

      {/* slider-container */}
      <div className="max-w-[1500px] mx-auto px-3 overflow-hidden mt-[1rem] pb-[3rem] relative">
        {/* <Slider {...settings}> */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {reviews.map((review, idx) => (
            <ReviewCard key={idx} review={review} />
          ))}
        </div>
        {/* </Slider> */}
      </div>
    </div>
  );
};

export default Review;
