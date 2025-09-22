/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState } from "react";
import {
  motion,
  Variants,
  useAnimationControls,
  TargetAndTransition,
} from "framer-motion";
import Ads from "@/components/Ads";
import { IoIosArrowDown } from "react-icons/io";
import { MdOutlineArrowUpward } from "react-icons/md";


type HeroTextBoxProps = {
  texts: string[];
  direction?: "left" | "right";
};

export const HeroTextBox: React.FC<HeroTextBoxProps> = ({
  texts,
  direction = "right",
}) => {
  const controls = useAnimationControls();

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.3,
        duration: 0.6,
        ease: "easeOut",
      },
    }),
    exit: (i: number) => ({
      opacity: 0,
      y: -10,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeIn",
      },
    }),
  };

  const boxVariants: Variants = {
    hidden: {
      opacity: 0,
      x: direction === "left" ? -100 : 100,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 2,
        ease: "easeInOut",
      },
    },
  };

  useEffect(() => {
    let mounted = true;

    const loopAnimation = async () => {
      const totalInDuration = texts.length * 0.3 + 0.6;
      const pauseAfterVisible = 3;
      const pauseAfterExit = 1;

      while (mounted) {
        await controls.start(
          textVariants.visible as (i: number) => TargetAndTransition
        );

        await new Promise((res) =>
          setTimeout(res, (totalInDuration + pauseAfterVisible) * 1000)
        );
        await controls.start(
          textVariants.exit as (i: number) => TargetAndTransition
        );

        await new Promise((res) => setTimeout(res, pauseAfterExit * 1000));
      }
    };

    loopAnimation();

    return () => {
      mounted = false;
    };
  }, [controls, texts.length]);

  return (
    <motion.div
      variants={boxVariants}
      initial="hidden"
      animate="visible"
      className={`absolute md:flex hidden z-50 max-w-[15rem] h-full w-full top-0 ${
        direction === "left" ? "left-5 animate-left" : "right-5 animate-right"
      } h-full flex items-center`}
    >
      {/* border-4 border-transparent */}
      <div className="relative  overflow-hidden h-[15rem] w-full  bg-clip-padding bg-transparent border-gradient">
        <div className="relative h-full px-2 text-center flex flex-col justify-center gap-[2rem] text-[1.2rem] font-medium text-white  bg-[#6b4646]/80 backdrop-blur-sm">
          {texts.map((line, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={textVariants}
              initial="hidden"
              animate={controls}
            >
              {line}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const HomeAds = () => {
  const videoAds = [
    { videoSrc: "/HAds1.mp4", link: "/contact" },
    { videoSrc: "/HAds2.mp4", link: "/contact" },
    { videoSrc: "/HAds3.mp4", link: "/contact" },
    { videoSrc: "/HAds4.mp4", link: "/contact" },
  ];

  return (
    <div>
      <Ads items={videoAds} />
    </div>
  );
};

export const Accordian = () => {
  const [isOpen, setIsOpen] = useState<number | null>(0);
  const dataArr = [
    {
      title: "Hallelujah Gospel Globally",
      description:
        "This will let you explore seamlessly the exciting array of Gospel music, events, news, Biblical truths, people, interactions, projects, concepts, and efforts while giving you a glimpse of what Hallelujah Gospel is behind the name.",
    },
    {
      title: "Gospel Pipeline",
      description:
        "Are you in search of better-quality faith-building videos? This is the venue to stream family-friendly videos or make one yourself. Watch and share top videos and inspiring movies or upload your own Christian-themed content.",
    },
    {
      title: "Gospel Store",
      description:
        "Shop smarter at Hallelujah Gospel Online. Enjoy irresistible prices and exclusive deals. Discover a wider selection of top-grade goods. Take delight in terrific gift ideas for a variety of occasions. Save more on bundled products. Browse personalized promotional merchandise.",
    },
    {
      title: "Gospel Scroll Pages (Social Media)",
      description:
        "If you're ready for something different, what we are offering is the best new alternative to social media as we know it. We've made Scroll Pages like a breath of fresh air - with less ad targeting and more secure sharing so that you can communicate with the people in your life in every sense of the word.",
    },
    {
      title: "Gospel Classifieds",
      description:
        "Hallelujah Classifieds promises to find the perfect match for the ad you are looking for and to house your next cost-free campaign with only a few clicks of the mouse. This is the ultimate marketplace to advertise or check out location-based listings for practically everything you need. If you want to connect with prospective clients or just get the word out about your company, you can't go wrong with Hallelujah Classifieds.",
    },
    {
      title: "Gospel Forum",
      description:
        "Our Gospel Forum is a wonderful avenue for you to connect and find fellowship with like-minded individuals. We have numerous forums, sub forums and several topics that will encourage you and meet your need for a supportive community no matter where you are in your Christian walk.",
    },
  ];

  const toggle = (idx: number) => {
    setIsOpen((prevIdx) => (prevIdx === idx ? null : idx));
  };

  return (
    <div className=" w-full ">
      {dataArr.map((PerAccordion, idx) => (
        <div key={idx} className="my-2 bg-[#0b1834] text-white !py-8 px-4 laptop:py-7">
          <button
            onClick={() => toggle(idx)}
            className="flex h-full w-full items-center justify-between font-medium text-[#fff] outline-none text-[1.3rem] "
          >
            <span>{PerAccordion.title}</span>
            <IoIosArrowDown
              className={` ${
                isOpen === idx ? "rotate-180" : ""
              } transition-all duration-300 ease-in-out text-[1.4rem]  `}
            />
          </button>
          <div
            className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
              isOpen === idx
                ? "grid-rows-[1fr] pb-1 pt-3 opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden pr-4 text-lg ">
              {PerAccordion.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button after scrolling down
  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    isVisible && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-50 p-2 bg-second text-black shadow-lg hover:bg-second/80 transition"
        aria-label="Scroll to top"
      >
        <MdOutlineArrowUpward className=" text-2xl " />
      </button>
    )
  );
};

// export const MusicPlayerWrapper = () => {
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true);

//     const script = document.createElement('script');
//     script.src = '/js/main.25421593.js';
//     script.async = true;
//     document.body.appendChild(script);

//     return () => {
//       document.body.removeChild(script);
//     };
//   }, []);

//   if (!isClient) return null;

//   return (
//     <>
//       <Head>
//         <link rel="stylesheet" href="/css/main.e2d17f3a.css" />
//       </Head>

//       <Script src="/js/main.25421593.js" strategy="afterInteractive" />

//       <div id="music-player-container">
//         hello
//       </div>
//     </>
//   );
// };


// export const LegacyHeroPlayer = () => {
//   const [isScriptLoaded, setIsScriptLoaded] = useState(false);

//   useEffect(() => {
//     const existingScript = document.getElementById("legacy-player-script");
//     if (existingScript) {
//       existingScript.remove();
//     }


//     const s = document.createElement("script");
//     s.src = "/static/js/main.25421593.js";
//     s.defer = true;
//     s.id = "legacy-player-script";
    
//     s.onload = () => {
//       setIsScriptLoaded(true);
//     };

//     s.onerror = () => {
//       console.error("Failed to load legacy player script");
//     };

//     document.body.appendChild(s);

//     // Cleanup function
//     return () => {
//       const script = document.getElementById("legacy-player-script");
//       if (script) {
//         script.remove();
//       }
//     };
//   }, []);

//   return (
//     <div id=" legacy-hero-player ">
//       <div id="root" className="bg-[#000000cb] text-[#fff]" />
//     </div>
//   );
// };

// export const LegacyHeroPlayer = () => {
//   const [isScriptLoaded, setIsScriptLoaded] = useState(false);

//   useEffect(() => {
//     const existingScript = document.getElementById("legacy-player-script");
//     if (existingScript) {
//       existingScript.remove();
//     }


//     const s = document.createElement("script");
//     s.src = "/static/js/main.25421593.js";
//     s.defer = true;
//     s.id = "legacy-player-script";
    
//     s.onload = () => {
//       setIsScriptLoaded(true);
//     };

//     s.onerror = () => {
//       console.error("Failed to load legacy player script");
//     };

//     document.body.appendChild(s);

//     // Cleanup function
//     return () => {
//       const script = document.getElementById("legacy-player-script");
//       if (script) {
//         script.remove();
//       }
//     };
//   }, []);

//   return (
//     <div id=" legacy-hero-player ">
//       <div id="root" className="bg-[#000000cb] text-[#fff]" />
//     </div>
//   );
// };