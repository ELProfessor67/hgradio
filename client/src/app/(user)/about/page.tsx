import Breadcrum from "@/components/Breadcrum";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import HAbout3 from "@/assets/HAbout3.png";
import HAbout1 from "@/assets/HAbout1.png";
import About1 from "@/assets/About1.jpg";
import About2 from "@/assets/About2.jpg";
import About3 from "@/assets/About3.jpg";
import { Accordian } from "@/utils/Util";
import Review1 from "@/assets/Review1.jpg";
import HAbout4 from "@/assets/HAbout4.png";
import Ads from "@/components/Ads";



const page = () => {

  const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/contact" },
    { videoSrc: "/vid2.mp4", link: "/contact" },
    { videoSrc: "/vid3.mp4", link: "/contact" },

  ];

  return (
    <div>
      <Breadcrum mainTitle="About Us" subTitle="Our Introduction" />
      <AboutUs />
      <Websites />
      <Stats />
      <Daily />
      <Ads items={videoAds} />
    </div>
  );
};

export default page;

const Daily = () => {
  return (
    <div className=" bg-[#000000e0] py-[5rem] relative ">

      <div className=" absolute right-0 bottom-0 ">
        <Image
          src={HAbout4}
          alt="Home about 1"
          className=" w-[5rem] object-contain "
        />
      </div>

      <div className=" text-center leading-tight mb-[5rem] ">
        <div className="text-[2rem] font-semibold text-second mb-2 ">
          05 Aug 2025
        </div>
        <h2 className="text-[3rem] font-bold mb-6 text-[#fff] ">
          Daily Devotions
        </h2>
      </div>

      <div className=" max-w-[1400px] mx-auto px-3 text-[#fff] md:text-xl min-h-[30rem] ">
        <h3 className=" text-[1.5rem] font-semibold ">Philippians 4:1-9 (NIV)</h3>
        <div className=" mt-2 text-gray-300 space-y-1 ">
          <p>
            1. Therefore, my brothers and sisters, you whom I love and long for, my
            joy and crown, stand firm in the Lord in this way, dear friends!
          </p>
          <p>
            2. I plead with Euodia and I plead with Syntyche to be of the same mind in
            the Lord.
          </p>
          <p>
            3. Yes, and I ask you, my true companion, help these women since they have
            contended at my side in the cause of the gospel, along with Clement and
            the rest of my co-workers, whose names are in the book of life.
          </p>
          <p>4. Rejoice in the Lord always. I will say it again: Rejoice!</p>
          <p>5. Let your gentleness be evident to all. The Lord is near.</p>
          <p>
            6. Do not be anxious about anything, but in every situation, by prayer and
            petition, with thanksgiving, present your requests to God.
          </p>
          <p>
            7. And the peace of God, which transcends all understanding, will guard
            your hearts and your minds in Christ Jesus.
          </p>
          <p>
            8. Finally, brothers and sisters, whatever is true, whatever is noble,
            whatever is right, whatever is pure, whatever is lovely, whatever is
            admirable—if anything is excellent or praiseworthy—think about such
            things.
          </p>
          <p>
            9. Whatever you have learned or received or heard from me, or seen in
            me—put it into practice. And the God of peace will be with you.
          </p>
          <p className=" text-[1.3rem] font-semibold ">Reflection:</p>
          <p className=" text-[1.3rem] font-semibold ">
            Stand Firm in the Lord (Verse 1):
          </p>
          <p>
            Paul begins by encouraging us to stand firm in our faith. In a world full
            of challenges and distractions, it's essential to remain steadfast in our
            relationship with Christ. Remember, our strength comes from the Lord.{" "}
          </p>
          <p className=" text-[1.3rem] font-semibold ">
            Unity and Reconciliation (Verses 2-3):
          </p>
          <p>
            Paul addresses a conflict between two women, Euodia and Syntyche, urging
            them to reconcile. This teaches us the importance of unity within the
            church. We are called to resolve our differences and work together for the
            sake of the gospel.{" "}
          </p>
          <p className=" text-[1.3rem] font-semibold ">
            Joy and Gentleness (Verses 4-5):
          </p>
          <p>
            We are reminded to rejoice always and to let our gentleness be evident to
            all. Joy in the Lord is not dependent on our circumstances but on our
            relationship with Him. Our gentleness is a testimony of God's love in us.{" "}
          </p>
          <p className=" text-[1.3rem] font-semibold ">
            Overcoming Anxiety (Verses 6-7):
          </p>
          <p>
            Paul instructs us not to be anxious but to present our requests to God
            with thanksgiving. In doing so, we receive the peace of God that
            transcends all understanding. This peace guards our hearts and minds,
            keeping us centered in Christ.{" "}
          </p>
          <p className=" text-[1.3rem] font-semibold ">
            Focus on the Positive (Verse 8):
          </p>
          <p>
            We are encouraged to focus our thoughts on what is true, noble, right,
            pure, lovely, and admirable. In a world filled with negativity, focusing
            on the positive helps us maintain a godly perspective.{" "}
          </p>
          <p className=" text-[1.3rem] font-semibold ">
            Practice What You've Learned (Verse 9):
          </p>
          <p>
            Paul urges us to put into practice what we have learned from his teachings
            and example. Living out our faith daily brings the peace of God into our
            lives and influences those around us.{" "}
          </p>
          <p className=" text-[1.3rem] font-semibold ">Prayer:</p>
          <p>
            Heavenly Father, thank You for Your word that encourages and strengthens
            us. Help us to stand firm in our faith, seeking unity and reconciliation
            in our relationships. Fill our hearts with Your joy and gentleness. Teach
            us to present our anxieties to You and to focus on the good things in
            life. May we practice what we have learned and experience Your peace in
            our daily walk. In Jesus' name, Amen.{" "}
          </p>
        </div>
      </div>


    </div>
  )
}

const Stats = () => {
  return (
    <div
      className="relative bg-cover bg-center bg-no-repeat overflow-hidden py-[7rem] "
      style={{
        backgroundImage: `url(${Review1.src})`,
      }}
    >
      <div className="absolute inset-0 bg-black/50 z-0" />

      <div className=" relative z-20 max-w-[1300px] mx-auto px-3 flex items-center lg:flex-row flex-col gap-10 text-[#fff]  ">
        <div className=" flex-1 ">
          <Image src={About3} alt="Review image 3 " className="  " />
        </div>
        <div className=" flex-1 pl-[0rem] ">
          <h3 className=" text-second text-[2rem] font-semibold ">
            Music Shows
          </h3>
          <div className=" text-[3rem] lg:text-[4rem] font-bold leading-tight ">
            Best Online Gospel Radio Station
          </div>
          <p className=" text-lg my-[2rem] lg:my-[3rem] text-gray-200 ">
            Let the soul-stirring melodies of gospel music uplift you on our
            Hallelujah Radio station. Tune in for divine inspiration today.
          </p>
          <div className=" grid grid-cols-3 gap-3 ">
            <div className="  font-semibold leading-tight ">
              <div className=" text-[3rem] text-second ">10k+</div>
              <div className=" text-[2rem] ">Listeners</div>
            </div>
            <div className="  font-semibold leading-tight ">
              <div className=" text-[3rem] text-second ">20+</div>
              <div className=" text-[2rem] ">Shows</div>
            </div>
            <div className="  font-semibold leading-tight ">
              <div className=" text-[3rem] text-second ">5+</div>
              <div className=" text-[2rem] ">RJs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Websites = () => {
  return (
    <div className=" bg-[#000000e0] relative py-[5rem] ">
      <div className="  absolute top-5 left-5 ">
        <Image
          src={HAbout1}
          alt="Home about 1"
          className=" w-[20rem] object-contain "
        />
      </div>

      <div className=" text-center leading-tight mb-[5rem] px-3 ">
        <div className="text-[2rem] font-semibold text-second mb-2 ">
          Our websites
        </div>
        <h2 className=" text-[2.5rem] lg:text-[3rem] font-bold mb-6 text-[#fff] ">
          Hallelujah Gospel Platforms
        </h2>
      </div>

      <div className=" max-w-[1300px] mx-auto px-3 flex items-center lg:flex-row flex-col lg:gap-4 gap-7 xl:gap-10 ">
        <div className=" w-full lg:w-[40%] flex lg:justify-start justify-center ">
          <Image src={About2} alt="About image 2" />
        </div>
        <div className=" w-full lg:w-[60%] ">
          <Accordian />
        </div>
      </div>
    </div>
  );
};

const AboutUs = () => {
  return (
    <div className=" relative py-[3rem] bg-[#1f2226] ">
      <div className="     ">
        <div className=" max-w-[1500px] mx-auto px-3 flex py-[1rem] md:flex-row flex-col md:gap-0 gap-5  ">
          <div className="flex-1 relative flex sm:justify-start justify-center overflow-hidden ">
            <div className=" sm:flex hidden absolute bottom-0 right-0 -z-0 h-full items-center">
              <Image
                src={HAbout3}
                alt="rotation image"
                className="w-[40rem] object-contain slow-spin"
              />
            </div>
            <Image
              src={About1}
              alt="cd image"
              className="relative  z-50"
            />
          </div>

          <div className=" text-[#fff] flex-1 flex items-center md:pl-[2rem] lg:pl-[5rem] ">
            <div>
              <h3 className=" text-second text-[2rem] font-semibold ">
                About Us
              </h3>
              <div className=" text-[2rem] font-semibold ">
                Welcome! We Are So Glad You Are Here!
              </div>
              <div className=" text-lg my-[2rem] ">
                <p className=" font-semibold ">
                  If you are searching for hope, you have come to the right
                  place.
                </p>
                <p>
                  At Choice Radio, we see ourselves as a platform with a strong
                  mandate to empower people to worship God like never before. We
                  endeavor to make your every encounter with Choice Radio
                  uplifting and encouraging, so please enjoy the station and
                  allow us to be a blessing to you.
                </p>
              </div>
              <div className="  ">
                <Link
                  href={`#`}
                  className="  px-8 py-3 bg-second font-semibold text-[#000] "
                >
                  See More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
