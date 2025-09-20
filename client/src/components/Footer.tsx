"use client";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FaLocationDot, FaXTwitter } from "react-icons/fa6";
import { IoMdMail } from "react-icons/io";
import { MdArrowForwardIos } from "react-icons/md";
import Footer1 from "@/assets/Footer1.png";
import Footer2 from "@/assets/Footer2.png";
import Footer3 from "@/assets/Footer3.png";
import Footer4 from "@/assets/Footer4.png";
import Footer5 from "@/assets/Footer5.png";
import Image from "next/image";
import { usePathname } from "next/navigation";

export const Footer = () => {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin-panel")) {
    return null;
  }
  return (
    <footer className=" bg-[#071126] pt-[4rem] text-[#fff] ">
      <div className=" max-w-[1500px] mx-auto px-3 flex md:gap-2 gap-8 md:flex-row flex-col justify-between pb-[3rem] ">
        <div>
          <h3 className=" text-[1.3rem] font-semibold mb-[2rem] ">
            Contact Us/Mail To
          </h3>
          <div>
            <div className=" flex gap-2 ">
              <FaLocationDot className=" mt-1 " />
              <div className=" space-y-1 ">
                <p>Hallelujah Gospel Globally</p>
                <p>231 Market Place 195 San Ramon,</p>
                <p>CA, 94583, USA</p>
              </div>
            </div>
          </div>
          <div className=" flex gap-2 mt-2 ">
            <IoMdMail className=" mt-1 " />
            <p>info@hgcradio.com</p>
          </div>
          <div className=" flex items-center md:justify-start justify-center gap-4 mt-[2rem] ">
            <Link href={`#`} target="_blank" className=" text-[1.3rem] ">
              <FaLinkedinIn />
            </Link>
            <Link href={`#`} target="_blank" className=" text-[1.3rem] ">
              <FaFacebookF />
            </Link>
            <Link href={`#`} target="_blank" className=" text-[1.3rem] ">
              <FaInstagram />
            </Link>
            <Link href={`#`} target="_blank" className=" text-[1.3rem] ">
              <FaXTwitter />
            </Link>
          </div>
        </div>

        <div>
          <h3 className=" text-[1.3rem] font-semibold mb-[2rem] ">
            Important Links
          </h3>
          <div className=" space-y-2 ">
            <Link
              href={`/`}
              className=" flex items-center gap-1 hover:text-second font-semibold hover:gap-2 transition-all duration-300 ease-in-out "
            >
              <MdArrowForwardIos />
              <span>Home</span>
            </Link>
            <Link
              href={`/about`}
              className=" flex items-center gap-1 hover:text-second font-semibold hover:gap-2 transition-all duration-300 ease-in-out "
            >
              <MdArrowForwardIos />
              <span>About Us</span>
            </Link>
            <Link
              href={`/privacy-policy`}
              className=" flex items-center gap-1 hover:text-second font-semibold hover:gap-2 transition-all duration-300 ease-in-out "
            >
              <MdArrowForwardIos />
              <span>Privacy Policy</span>
            </Link>
            <Link
              href={`/contact`}
              className=" flex items-center gap-1 hover:text-second font-semibold hover:gap-2 transition-all duration-300 ease-in-out "
            >
              <MdArrowForwardIos />
              <span>Contact Us</span>
            </Link>
          </div>
        </div>

        <div className=" space-y-6 ">
          <div className=" flex items-center justify-center gap-2 ">
            <Image
              src={Footer1}
              alt="Footer img"
              className=" w-[6rem] object-contain "
            />
            <Image
              src={Footer2}
              alt="Footer img"
              className=" w-[6rem] object-contain "
            />
            <Image
              src={Footer3}
              alt="Footer img"
              className=" w-[6rem] object-contain "
            />
          </div>
          <div className=" flex items-center justify-center gap-2 ">
            <Image
              src={Footer4}
              alt="Footer img"
              className=" w-[9rem] object-contain "
            />
            <Image
              src={Footer5}
              alt="Footer img"
              className=" w-[9rem] object-contain "
            />
          </div>
        </div>
      </div>

      <div className=" text-center border-t border-[#302f50] py-[1.5rem] ">
        <p>
          © Copyright 2025 All Rights Reserved By - Hallelujah Gospel Globally
        </p>
      </div>
    </footer>
  );
};
