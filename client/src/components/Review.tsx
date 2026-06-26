"use client";

import React, { useState, useEffect } from "react";
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

  const [dynamicReviews, setDynamicReviews] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7501'}/api/public/testimonials?page=${page}&limit=6`);
        const data = await res.json();
        if (res.ok) {
          if (page === 1) {
            setDynamicReviews(data.testimonials);
          } else {
            setDynamicReviews((prev) => [...prev, ...data.testimonials]);
          }
          setHasMore(data.hasMore);
        }
      } catch (err) {
        console.error("Failed to fetch testimonials:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [page]);

  return (
    <div
      className="relative bg-cover bg-center bg-no-repeat overflow-hidden min-h-[50rem] py-[7rem]"
      style={{
        backgroundImage: `url(${Review1.src})`,
      }}
    >
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="relative z-10 text-center leading-tight mb-[2rem] flex flex-col items-center">
        <h2 className="text-[3rem] font-bold mb-6 text-[#fff]">Testimonials</h2>
        <div className="text-[2rem] font-semibold text-second mb-2">
          What Our Listeners Are Saying
        </div>
        <p className="text-[#fff] text-base md:text-lg text-center mb-6">
          Share your testimonial at{" "}
          <a className="underline text-second hover:text-white transition-colors" href="mailto:info@hgcradio.org">
            testify@hgcradio.org
          </a>
        </p>
        <div className="flex justify-center w-full px-4">
          <img src="/banner.png" alt="testify" className="object-contain w-full max-w-[500px] h-auto rounded-lg shadow-lg hover:scale-105 transition-transform duration-300" />
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-3 overflow-hidden mt-[1rem] pb-[3rem] relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {reviews.map((review, idx) => (
            <ReviewCard key={`static-${idx}`} review={review} />
          ))}
          {dynamicReviews.map((review, idx) => (
            <ReviewCard key={`dynamic-${review._id || idx}`} review={{
              name: review.name,
              designation: review.designation || "Listener",
              message: review.message,
              img: review.img || "https://ui-avatars.com/api/?name=" + encodeURIComponent(review.name) + "&background=random"
            }} />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loading}
              className="bg-second text-black px-8 py-3 rounded-full font-bold text-lg hover:bg-second/80 transition-all disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Review;
