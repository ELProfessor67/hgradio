"use client";

import { PageLoading } from "@/utils/Loading";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { HiMiniBars3BottomRight } from "react-icons/hi2";
import { RxCross2 } from "react-icons/rx";
import Logo from "@/assets/Logo.png";
import { MdArrowForwardIos } from "react-icons/md";

const Header = () => {
  const pathname = usePathname();
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [prevScrollY, setPrevScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [showAlbums, setShowAlbums] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide header when scrolling down (past 50px threshold)
      if (currentScrollY > prevScrollY && currentScrollY > 50) {
        setIsHeaderVisible(false); // Scrolling down → hide
      }
      // Show header when scrolling up
      else if (currentScrollY < prevScrollY) {
        setIsHeaderVisible(true); // Scrolling up → show
      }

      // At the very top (transparent, no background)
      if (currentScrollY <= 5) {
        setIsHeaderVisible(true); // Ensure header is visible
      }

      setPrevScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollY]);

  if (!isClient) return <PageLoading />;

  
  return (
    <header>
      <div
      className={`fixed top-0 left-0 w-full  flex items-center py-[1rem] z-[100] transition-all duration-300 ${
        // Transparent at top, even if scrolling up
        prevScrollY <= 5
          ? "bg-transparent shadow-none"
          : isHeaderVisible
          ? "bg-[#071126] shadow-md translate-y-0" // Scroll up: show bg
          : "-translate-y-full bg-transparent" // Scroll down: hide
      }`}
    >
      <div className=" px-3 max-w-[1500px] mx-auto w-full flex items-center justify-between gap-2 ">
        <Link href={`/`} className=" flex items-center gap-1 font-poppins ">
          <Image src={Logo} alt="Logo" className=" w-[10rem] object-contain " />
        </Link>

        <div className="flex items-center gap-3 lg:gap-5">
          <div className="hidden lg:flex items-center gap-3 text-[#fff]">
            {/* Home */}
            <Link
              href="/"
              className={`${
                pathname === "/" && "text-[#2ee7ff]"
              } font-medium text-[1.1rem] px-2 py-2 hover:text-[#2ee7ff] transition-colors duration-300 ease-in-out`}
            >
              Home
            </Link>

            {/* History */}
            <Link
              href="/history"
              className={`${
                pathname === "/history" && "text-[#2ee7ff]"
              } font-medium text-[1.1rem] px-2 py-2 hover:text-[#2ee7ff] transition-colors duration-300 ease-in-out`}
            >
              History
            </Link>

            {/* Schedule */}
            <Link
              href="/schedule"
              className={`${
                pathname === "/schedule" && "text-[#2ee7ff]"
              } font-medium text-[1.1rem] px-2 py-2 hover:text-[#2ee7ff] transition-colors duration-300 ease-in-out`}
            >
              Schedule
            </Link>

            <Link
              href="/studio-engineers"
              className={`${
                pathname === "/studio-engineers" && "text-[#2ee7ff]"
              } font-medium text-[1.1rem] px-2 py-2 hover:text-[#2ee7ff] transition-colors duration-300 ease-in-out`}
            >
              Studio Engineers
            </Link>

            <div className="relative group">
              {/* Parent menu item */}
              <Link
                href="/albums"
                className={`${
                  pathname === "/albums" && "text-[#2ee7ff]"
                } font-medium text-[1.1rem] px-2 py-2 hover:text-[#2ee7ff] transition-colors duration-300 ease-in-out`}
              >
                Albums
              </Link>

              {/* Submenu that slides in from left */}
              <div
                className="absolute left-0 top-full mt-2 opacity-0 invisible 
               group-hover:opacity-100 group-hover:visible 
               transition-all duration-300 ease-in-out z-50 "
              >
                <div
                  className="bg-[#0e214b] text-white  shadow-lg min-w-[200px]
                 transform -translate-x-5 group-hover:translate-x-0 
                 transition-all duration-300 ease-in-out"
                >
                  <Link
                    href="/albums"
                    className="block px-4 py-3 text-[1.1rem] hover:bg-[#090e1b] hover:text-second transition-all duration-300 ease-in-out "
                  >
                    Albums
                  </Link>
                  <Link
                    href="/albums/sell-album"
                    className="block px-4  py-3 text-[1.1rem] hover:bg-[#090e1b] hover:text-second transition-all duration-300 ease-in-out "
                  >
                    Sell Album
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative group">
              {/* Parent menu item */}
              <Link
                href="/about"
                className={`${
                  pathname === "/about" && "text-[#2ee7ff]"
                } font-medium text-[1.1rem] px-2 py-2 hover:text-[#2ee7ff] transition-colors duration-300 ease-in-out`}
              >
                About Us
              </Link>

              {/* Submenu that slides in from left */}
              <div
                className="absolute left-0 top-full mt-2 opacity-0 invisible 
               group-hover:opacity-100 group-hover:visible 
               transition-all duration-300 ease-in-out z-50 "
              >
                <div
                  className="bg-[#0e214b] text-white shadow-lg min-w-[200px]
                 transform -translate-x-5 group-hover:translate-x-0 
                 transition-all duration-300 ease-in-out"
                >
                  <Link
                    href="/about"
                    className="block px-4  py-3 text-[1.1rem] hover:bg-[#090e1b] hover:text-second transition-all duration-300 ease-in-out "
                  >
                    About Us
                  </Link>
                  <Link
                    href="/sign-guestbook"
                    className="block px-4  py-3 text-[1.1rem] hover:bg-[#090e1b] hover:text-second transition-all duration-300 ease-in-out "
                  >
                    Guest Book
                  </Link>
                </div>
              </div>
            </div>
            <Link
              href="/contact"
              className={`${
                pathname === "/contact" && "text-[#2ee7ff]"
              } font-medium text-[1.1rem] px-2 py-2 hover:text-[#2ee7ff] transition-colors duration-300 ease-in-out`}
            >
              Contact Us
            </Link>
          </div>
        </div>

        <div className=" flex items-center gap-4 ">
          <Link
            href={`/sponsor`}
            className=" lg:block hidden text-[1.1rem] px-7 py-2  bg-white text-[#000] "
          >
            Sponsor
          </Link>
          <div
            onClick={() => setIsOpenSidebar(true)}
            className=" lg:hidden flex text-[1.5rem] text-[#fff] "
          >
            <HiMiniBars3BottomRight />
          </div>
        </div>
      </div>

    </div>
      <div
        className={`fixed top-0 left-0 h-full w-full bg-[#071126] z-[110] transform transition-transform duration-300 ease-in-out p-[1rem]
    ${isOpenSidebar ? "translate-x-0" : "-translate-x-full"} lg:hidden`}
      >
        <div className=" flex items-center justify-between mb-[3rem] ">
          <Link href={`/`} className=" flex items-center gap-1 font-poppins ">
            <Image
              src={Logo}
              alt="Logo"
              className=" w-[10rem] object-contain "
            />
          </Link>
          <div
            onClick={() => setIsOpenSidebar(false)}
            className=" text-[1.6rem] text-[#fff] "
          >
            <RxCross2 />
          </div>
        </div>
        <div className="flex flex-col gap-4 text-xl text-[#fff] ">
          <Link href="/" onClick={() => setIsOpenSidebar(false)} className="py-2 border-b ">
            Home
          </Link>
          <Link href="/history" onClick={() => setIsOpenSidebar(false)} className="py-2 border-b ">
            History
          </Link>
          <Link href="/schedule" onClick={() => setIsOpenSidebar(false)} className="py-2 border-b ">
            Schedule
          </Link>
          <Link href="/studio-engineers" onClick={() => setIsOpenSidebar(false)} className="py-2 border-b ">
            Studio Engineers
          </Link>
          {/* Albums with Toggle */}
          <div className="border-b">
            <button
              onClick={() => setShowAlbums(!showAlbums)}
              className="w-full py-2 flex items-center justify-between pr-2 text-left text-xl text-white"
            >
              <span>Albums</span>
              <MdArrowForwardIos
                className={`transform transition-transform duration-300 ${
                  showAlbums ? "rotate-90" : ""
                }`}
              />
            </button>

            {/* Submenu */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showAlbums ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col pl-3 gap-2 pt-1 pb-3 text-gray-300 text-[1.2rem] ">
                <Link href="/albums" onClick={() => setIsOpenSidebar(false)} className=" py-2 ">
                  Albums
                </Link>
                <Link href="/albums/sell" onClick={() => setIsOpenSidebar(false)} className=" py-2 ">
                  Sell Album
                </Link>
              </div>
            </div>
          </div>

          {/* About dropdown */}
          <div className="border-b">
            <button
              onClick={() => setShowAbout(!showAbout)}
              className="w-full py-2 flex items-center justify-between pr-2"
            >
              <span>About Us</span>
              <MdArrowForwardIos
                className={`transition-transform duration-300 ${
                  showAbout ? "rotate-90" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showAbout ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col pl-3 text-[1.2rem] gap-2 pt-1 pb-3 text-white">
                <Link href="/about" className=" py-2 " onClick={() => setIsOpenSidebar(false)}>
                  About Us
                </Link>
                <Link
                  href="/sign-guestbook"  className=" py-2 "
                  onClick={() => setIsOpenSidebar(false)}
                >
                  Guest Book
                </Link>
              </div>
            </div>
          </div>

          {/* <Link href="#" className="py-2 border-b ">
            About Us
          </Link> */}
          <Link href="/contact" onClick={() => setIsOpenSidebar(false)} className="py-2 border-b ">
            Contact Us
          </Link>
          <Link
            href={`/sponsor`} onClick={() => setIsOpenSidebar(false)}
            className="  text-[1.1rem] px-7 py-2  text-center bg-white text-[#000] "
          >
            Sponsor
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
