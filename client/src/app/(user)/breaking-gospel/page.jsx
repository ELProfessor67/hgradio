import Breadcrum from "@/components/Breadcrum";
import Ads from "@/components/Ads";
import Image from "next/image";
import Link from "next/link";

import bg1 from "@/assets/bg1.jpg";
import plus from "@/assets/el_plus.png";
import dot from "@/assets/right-dot-circle.png";

import News1 from "@/assets/sponsor.jpg";
import News2 from "@/assets/Review1.jpg";
import News3 from "@/assets/Review3.png";
import News4 from "@/assets/About2.jpg";
import News5 from "@/assets/Trending3.jpg";
import News6 from "@/assets/Trending5.jpg";

const videoAds = [
  { videoSrc: "/vid1.mp4", link: "/contact" },
  { videoSrc: "/vid2.mp4", link: "/contact" },
  { videoSrc: "/vid3.mp4", link: "/contact" },
];

const news = [
  {
    id: "bg-001",
    category: "Breaking Gospel",
    date: "Jan 28, 2026",
    title: "Worship Night sparks renewed hope across local communities",
    excerpt:
      "A powerful night of praise and prayer brought families together, strengthening faith and unity across the region.",
    img: News1,
  },
  {
    id: "bg-002",
    category: "Music News",
    date: "Jan 25, 2026",
    title: "Top gospel artists announce new collaborative project",
    excerpt:
      "A brand-new collaboration is set to release soon, featuring inspiring messages and uplifting sounds for every listener.",
    img: News2,
  },
  {
    id: "bg-003",
    category: "Ministry",
    date: "Jan 22, 2026",
    title: "Youth outreach program expands to more cities this season",
    excerpt:
      "The outreach continues to grow, creating safe spaces for worship, mentorship, and community support.",
    img: News3,
  },
  {
    id: "bg-004",
    category: "Events",
    date: "Jan 20, 2026",
    title: "Community prayer gathering scheduled for this weekend",
    excerpt:
      "Join believers for a dedicated time of prayer, encouragement, and fellowship—everyone is welcome.",
    img: News4,
  },
  {
    id: "bg-005",
    category: "Radio",
    date: "Jan 18, 2026",
    title: "Listener testimonies: how gospel radio is changing lives",
    excerpt:
      "From healing to restored joy, listeners share the impact of faith-filled music and messages throughout the day.",
    img: News5,
  },
  {
    id: "bg-006",
    category: "New Releases",
    date: "Jan 15, 2026",
    title: "New worship releases you should add to your playlist",
    excerpt:
      "Fresh songs are arriving with powerful lyrics, rich harmonies, and uplifting themes to keep your faith strong.",
    img: News6,
  },
];

const Page = () => {
  return (
    <div>
      <Breadcrum mainTitle="Breaking Gospel" subTitle="Music News" />

      <div
        className="relative z-20 min-h-screen bg-no-repeat bg-cover"
        style={{
          backgroundImage: `url(${bg1.src})`,
        }}
      >
        <Image src={plus} alt="corner" className="absolute top-20 left-0 z-[-1]" />
        <Image src={dot} alt="corner" className="absolute top-0 right-0 z-[-1]" />
        <div className="absolute inset-0 bg-[#090F1D]/80 z-[-2]" />

        <div className="text-center space-y-2 py-10 relative z-[2]">
          <h3 className="text-xl font-extrabold text-[#66FCF1]">Breaking Gospel</h3>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#D9D9D9]">
            Latest News & Updates
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto px-3">
            This section is currently showing demo news content. You can connect it to a real
            news API anytime.
          </p>
        </div>

        <div className="max-w-[1500px] mx-auto px-3 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
            {news.map((item) => (
              <Link
                href="#"
                key={item.id}
                className="group overflow-hidden border border-white/10 bg-[#0b1834] hover:border-second/40 transition-colors"
              >
                <div className="relative w-full h-[15rem] overflow-hidden">
                  <Image
                    src={item.img}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300 ease-in-out"
                  />
                  <div className="absolute left-3 top-3 bg-black/60 text-white text-xs px-3 py-1 border border-white/10">
                    {item.category}
                  </div>
                </div>

                <div className="p-5 text-white space-y-3">
                  <div className="text-sm text-gray-300">{item.date}</div>
                  <h3 className="text-xl font-semibold leading-snug line-clamp-2 group-hover:text-second transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 line-clamp-3">{item.excerpt}</p>

                  <div className="pt-2 text-sm font-semibold text-second">
                    Read More
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Ads items={videoAds} />
    </div>
  );
};

export default Page;