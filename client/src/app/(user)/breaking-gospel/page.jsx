"use client";

import { useState, useEffect, useCallback } from "react";
import Breadcrum from "@/components/Breadcrum";
import Ads from "@/components/Ads";
import Image from "next/image";

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
    date: "June 2026",
    title: "Christian Music Experiencing Major Growth Worldwide",
    excerpt:
      "Industry reports show Christian and gospel music continuing to reach new audiences around the world. Artists such as Brandon Lake, Forrest Frank, and Elevation Worship are attracting millions of listeners through streaming platforms and social media.",
    fullText:
      "🚨 BREAKING GOSPEL NEWS #1\n\n🎶 CHRISTIAN MUSIC EXPERIENCING MAJOR GROWTH WORLDWIDE\n\nIndustry reports show Christian and gospel music continuing to reach new audiences around the world. Artists such as Brandon Lake, Forrest Frank, and Elevation Worship are attracting millions of listeners through streaming platforms and social media.\n\nMusic industry analysts report that faith-based music is crossing into mainstream charts while maintaining its message of hope, worship, and encouragement. Many young people are discovering Christian music for the first time and sharing it with friends and family.\n\nHGC Radio says: The message of Jesus Christ is still reaching hearts through music, worship, and testimony.\n\n\"Let everything that hath breath praise the Lord.\"\n— Psalm 150:6",
    img: News1,
  },
  {
    id: "bg-002",
    category: "Missions",
    date: "June 2026",
    title: "Missionary Momentum Reaches New Heights",
    excerpt:
      "The International Mission Board announced that 63 new missionaries were commissioned during the Southern Baptist Convention annual meeting in Orlando, Florida. IMB leaders reported a dramatic increase in missionary candidates.",
    fullText:
      "🚨 HGC RADIO BREAKING GOSPEL NEWS UPDATE\nJune 2026\n\n📰 HEADLINE #1\nMISSIONARY MOMENTUM REACHES NEW HEIGHTS\n\nThe International Mission Board announced that 63 new missionaries were commissioned during the Southern Baptist Convention annual meeting in Orlando, Florida. IMB leaders reported a dramatic increase in missionary candidates and described the missionary pipeline as growing rapidly as more believers answer the call to take the Gospel to the nations.\n\nScripture:\n\"Go ye therefore, and teach all nations...\"\n— Matthew 28:19",
    img: News2,
  },
  {
    id: "bg-003",
    category: "Events",
    date: "June 2026",
    title: "Revival Festival Draws Believers to Southern California",
    excerpt:
      "Thousands gathered in Anaheim, California, for So Cal Revival Fest 2026, a Christian worship and revival event focused on unity, worship, evangelism, and community outreach.",
    fullText:
      "📰 HEADLINE #2\nREVIVAL FESTIVAL DRAWS BELIEVERS TO SOUTHERN CALIFORNIA\n\nThousands gathered in Anaheim, California, for So Cal Revival Fest 2026, a Christian worship and revival event focused on unity, worship, evangelism, and community outreach. Churches, worship leaders, and families came together seeking spiritual renewal and encouragement.\n\nScripture:\n\"Wilt thou not revive us again: that thy people may rejoice in thee?\"\n— Psalm 85:6",
    img: News3,
  },
  {
    id: "bg-004",
    category: "Youth",
    date: "June 2026",
    title: "Youth Revival Movement Continues to Grow",
    excerpt:
      "Youth Revival 2026 is preparing to bring young believers together in Florida for worship, discipleship, prayer, and teaching. Organizers say the event is designed to encourage the next generation to pursue Christ boldly.",
    fullText:
      "📰 HEADLINE #3\nYOUTH REVIVAL MOVEMENT CONTINUES TO GROW\n\nYouth Revival 2026 is preparing to bring young believers together in Florida for worship, discipleship, prayer, and teaching. Organizers say the event is designed to encourage the next generation to pursue Christ boldly and impact their communities.\n\nScripture:\n\"Let no man despise thy youth...\"\n— 1 Timothy 4:12",
    img: News4,
  },
  {
    id: "bg-005",
    category: "Gospel Music",
    date: "June 2026",
    title: "Gospel Music Celebrates Major Momentum",
    excerpt:
      "The gospel music world continues to thrive as Kirk Franklin, CeCe Winans, Tasha Cobbs Leonard, Lecrae, and others receive recognition across major music platforms and awards programs.",
    fullText:
      "📰 HEADLINE #4\nGOSPEL MUSIC CELEBRATES MAJOR MOMENTUM\n\nThe gospel music world continues to thrive as Kirk Franklin, CeCe Winans, Tasha Cobbs Leonard, Lecrae, and others receive recognition across major music platforms and awards programs. Industry observers note continued growth in gospel music audiences worldwide.\n\nScripture:\n\"Sing unto the Lord a new song.\"\n— Psalm 96:1",
    img: News5,
  },
  {
    id: "bg-006",
    category: "New Releases",
    date: "June 2026",
    title: "CeCe Winans Releases New Hymn Project",
    excerpt:
      "Gospel music icon CeCe Winans has released a new worship project celebrating timeless Christian hymns. The album is receiving strong support from churches and gospel listeners who appreciate music rooted in biblical truth and worship.",
    fullText:
      "📰 HEADLINE #5\nCECE WINANS RELEASES NEW HYMN PROJECT\n\nGospel music icon CeCe Winans has released a new worship project celebrating timeless Christian hymns. The album is receiving strong support from churches and gospel listeners who appreciate music rooted in biblical truth and worship.\n\nScripture:\n\"Speaking to yourselves in psalms and hymns and spiritual songs.\"\n— Ephesians 5:19",
    img: News6,
  },
  {
    id: "bg-007",
    category: "Testimonies",
    date: "June 2026",
    title: "Testimonies of Hope Continue to Inspire Believers",
    excerpt:
      "Churches and ministries across America continue reporting lives being transformed through prayer, worship, discipleship, and community outreach. Pastors are sharing testimonies of people returning to church and families being restored.",
    fullText:
      "🚨 BREAKING GOSPEL NEWS #3\n\n🙏 TESTIMONIES OF HOPE CONTINUE TO INSPIRE BELIEVERS\n\nChurches and ministries across America continue reporting lives being transformed through prayer, worship, discipleship, and community outreach. Pastors are sharing testimonies of people returning to church, families being restored, and individuals finding hope through Jesus Christ.\n\nMany congregations report increased interest in prayer gatherings, Bible studies, worship nights, and outreach ministries designed to help people facing difficult circumstances.\n\nBelievers are being reminded that God is still working in lives every day through faith, prayer, and obedience.\n\n\"Jesus Christ the same yesterday, and today, and forever.\"\n— Hebrews 13:8",
    img: News1,
  },
  {
    id: "bg-008",
    category: "Ministry",
    date: "June 2026",
    title: "Independent Gospel Artists Continue to Rise",
    excerpt:
      "Independent gospel artists are proving that ministry and music can reach the nations without major record labels. Recent chart success by independent worship leaders demonstrates the growing influence of grassroots Christian music.",
    fullText:
      "🚨 BREAKING GOSPEL NEWS #2\n\n🎤 INDEPENDENT GOSPEL ARTISTS CONTINUE TO RISE\n\nIndependent gospel artists are proving that ministry and music can reach the nations without major record labels. Recent chart success by independent worship leaders and gospel ministries demonstrates the growing influence of grassroots Christian music.\n\nChurches, ministries, and independent artists are using online platforms to spread the Gospel, release worship music, and encourage believers worldwide.\n\nThis growth is creating new opportunities for ministries, Christian radio stations, and worship leaders to connect with audiences across the globe.\n\n\"Go ye into all the world, and preach the gospel to every creature.\"\n— Mark 16:15",
    img: News2,
  },
  {
    id: "bg-009",
    category: "Worship",
    date: "June 2026",
    title: "Worship Music Continues to Produce New Songs of Faith",
    excerpt:
      "New worship projects and albums are being released by Christian artists across the nation, bringing fresh songs of praise to churches and listeners worldwide. Recent releases focus on themes of peace, courage, trust in God, healing, and surrender.",
    fullText:
      "🚨 BREAKING GOSPEL NEWS #4\n\n🎵 WORSHIP MUSIC CONTINUES TO PRODUCE NEW SONGS OF FAITH\n\nNew worship projects and albums are being released by Christian artists across the nation, bringing fresh songs of praise to churches and listeners worldwide.\n\nRecent releases have focused on themes of peace, courage, trust in God, healing, and surrender. Worship leaders say these songs are helping believers strengthen their faith during uncertain times.\n\nAs churches gather for worship each week, these songs are becoming anthems of praise and reminders of God's faithfulness.\n\n\"Sing unto the Lord a new song; sing unto the Lord, all the earth.\"\n— Psalm 96:1",
    img: News3,
  },
];

const Page = () => {
  const [selected, setSelected] = useState(null);

  const closeModal = useCallback(() => setSelected(null), []);

  // Close on Escape key
  useEffect(() => {
    if (!selected) return;
    const handler = (e) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, closeModal]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  return (
    <div>
      <Breadcrum mainTitle="Breaking Gospel" subTitle="Music News" />

      <div
        className="relative z-20 min-h-screen bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${bg1.src})` }}
      >
        <Image src={plus} alt="corner" className="absolute top-20 left-0 z-[-1]" />
        <Image src={dot} alt="corner" className="absolute top-0 right-0 z-[-1]" />
        <div className="absolute inset-0 bg-[#090F1D]/80 z-[-2]" />

        <div className="text-center space-y-2 py-10 relative z-[2]">
          <h3 className="text-xl font-extrabold text-[#66FCF1]">Breaking Gospel</h3>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#D9D9D9]">
            Latest News &amp; Updates
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto px-3">
            Stay informed with the latest gospel and Christian music news, revival reports,
            missionary updates, and testimonies of faith from around the world — June 2026.
          </p>
        </div>

        <div className="max-w-[1500px] mx-auto px-3 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden border border-white/10 bg-[#0b1834] hover:border-second/40 transition-colors cursor-pointer"
                onClick={() => setSelected(item)}
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

                  <button
                    onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                    className="pt-2 text-sm font-semibold text-second hover:text-white transition-colors flex items-center gap-1"
                  >
                    Read More
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Ads items={videoAds} />

      {/* News Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={closeModal}
        >
          <div
            className="relative bg-[#0b1834] border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ borderRadius: "2px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            <div className="relative w-full h-56 overflow-hidden flex-shrink-0">
              <Image
                src={selected.img}
                alt={selected.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1834] via-transparent to-transparent" />
              <div className="absolute left-4 top-4 bg-black/60 text-white text-xs px-3 py-1 border border-white/10">
                {selected.category}
              </div>
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 bg-black/60 hover:bg-red-600 text-white w-8 h-8 flex items-center justify-center border border-white/20 transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 text-white space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>{selected.date}</span>
                <span>•</span>
                <span className="text-[#66FCF1] font-semibold">{selected.category}</span>
              </div>

              <h2 className="text-2xl font-extrabold text-white leading-snug">
                {selected.title}
              </h2>

              <div className="border-t border-white/10" />

              <div className="text-gray-300 leading-relaxed whitespace-pre-line text-[15px]">
                {selected.fullText}
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-gray-500 text-center">
                  🙏 HGC Radio — Breaking Gospel News · June 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;