import Ads from "@/components/Ads";
import Breadcrum from "@/components/Breadcrum";
import React from "react";
import Team1 from "@/assets/Team1.png";
import Team2 from "@/assets/Team2.jpeg";
import Team3 from "@/assets/Team3.jpg";
import Team4 from "@/assets/Team4.png";
import Team5 from "@/assets/kenny.png";
import Team6 from "@/assets/greg.jpg";
import Team7 from "@/assets/adia.png";
import Team8 from "@/assets/PLA.jpg";
import Image from "next/image";
import Link from "next/link";




const page = () => {


  const engineers = [
    {
      id: "Pastor-Larry",
      img: Team8,
      name: "Pastor Larry Austin",
      bio: "Pastor Larry Austin, widely known as PLA, is a devoted servant of Christ who walks boldly in his calling as both a local pastor and an international urban missionary. He answered the call to ministry on March 21, 1995, while pursuing a career in professional football. Since that pivotal moment, he has faithfully preached the Gospel and ministered through Christian rap. PLA serves as a pastor at Elevate Gospel Outreach in West Oakland, California every Sunday at 1PM on the corner of 14th & Mandela Parkway. PLA also serves the Body of Christ as an International Mission Motivator under the banner of In The Huddle with PLA, a movement harnesses the power of music to reach the lost and equip churches to fulfill the mission of Jesus.PLA shares his life with his high school sweetheart, Michelle, and together they have three daughters: Amani, Brandy, and Faith. They are also proud grandparents to twin girls, Madisyn and Lexington. Surrounded by strong women, PLA often reflects on how their love continually teaches him the depth of Christ’s love for His Church the Bride of Christ.",
      location: "United States",
      email: "pastor.larry@hgcradio.com",
    },
    {
      id: "Kenny-Andrews",
      img: Team5,
      name: "Kenny Andrews",
      bio: "Kenny Andrews inspires his fans with his smooth traditional and contemporary melodies of God's love and glory and his passion for Christ. Through New Creation Records, Kenny Andrews spreads his inspirational message while touring in music venues and churches throughout the country. Most notable are his numerous Spotlights in Gospel USA Magazine, debuting his singles: Real Special Love, He Reigns, and So Amazing; the New Creature album; and his So Amazing video. From Spokane, Washington, Kenny Andrews was born July 3, 1962 to Reverend Dr. Andrews and First Lady Doris Andrews, the latter a member of the Golden Echoes quartet. With the influence of his father, Kenny began singing at the early age of four. Kenny has always conveyed his emotions and his commitment to God through his music. In 2005, Kenny was the grand prize winner of Washington State KHQ-Northern Quest Casino Gimme the Mike. In 2007, after a career singing pop music, Andrews rededicated his singing to God and, with manager Judy Smith and Chester Andrews of Mutek Productions, organized New Creation Records for this purpose",
      location: "United States",
      email: "kenny.andrews@hgcradio.com",
    },
    {
      id: "Apostle-Gary-Wyatt",
      img: Team3,
      name: "Apostle Gary L. Wyatt",
      bio: "Heaven's Harmony invites you to a celestial experience of worship and inspiration. Delight in a curated selection of uplifting gospel music, moving testimonies, and spiritual insights that resonate with divine harmony. Join us as we celebrate faith and foster a deep connection with God through a harmonious blend of praise and worship.",
      location: "United States",
      email: "gary.wyatt@hgcradio.com",
    },
    {
      id: "Pastor-Ben-Cha-Me",
      img: Team1,
      name: "Pastor Ben Cha Me",
      bio: "Jesus Christ alone can save the World but Jesus cannot save the World alone! Being a former missionary, p. Ben firmly believes that Lost people matters to God and so should we. And I believe that it is a great SIN when you've found water in the middle of the desert and not share it. P. Ben received his seminary degree from Talbot Theological Seminary and Th.M from Fuller. and he serves as the Mission/outreach pastor at Christian Layman Church in Oakland. He is married to one wife Ruth; son Joshua and daughter Rebekah! ..",
      location: "United States",
      email: "pastor.ben@hgcradio.com",
    },
    {
      id: "Gregory-Franklin",
      img: Team6,
      name: "Gregory Franklin",
      bio: "Everything in life starts with a seed, and it was many decades ago when God first gave G. Franklin a vision to believe in and pray for. The burden of reaching the lost and sharing the hope of Jesus Christ began to sit upon his soul and take root. Seeing that the world was in desperate need of the Truth, he envisioned God using his life to equip other Christians and create a worship-driven culture and lifestyle. Armed with confidence that he could do all things through Christ who strengthened him (Philippians 4:13), he laid out on paper the blueprint and initial steps he needed to take to realize the daunting task before him.In the years since, fervent prayer and a sense of purpose had enabled G. Franklin to finally see the vision begin to unfurl in living reality with his team of builders. With untiring perseverance, he communicated the goal to inspire and motivate others and thus small pieces came together to form the big picture. Consequently, Hallelujah Gospel Globally was born.  “If it seems slow in coming, wait patiently, for it will surely take place. It will not be delayed.” (Habakkuk 2:3)Just like strong bodies, strong teams are comprised of interdependent members fulfilling precise tasks. It is no accident that you are holding this book in your hand right now. When you selected it to read, you also opened a special doorway to that dream and what it presents. You have become a significant part of it.Now is the time for the vision to come to pass. Today marks the commencement of G. Franklin's tangible pledge to impact lives for eternity, to see Christ remain preeminent, and to become a good steward of God's resources he has been entrusted with. From the shores of the United States to the ends of the earth, “let everything that has breath praise the Lord.” (Psalm 150:6   ",
      location: "United States",
      email: "greg@hgcradio.com",
    },
    {
      id: "Dr-Edwards",
      img: Team4,
      name: "Dr Edwards",
      bio: "Dr. Edwards is the Pastoral Leader, and Chief Executive Officer for Save The Youth Incorporated, a non-profit ministry where he provides oversight for education, youth programs, and parental counseling. Minister Edwards is part of the pastoral team at churches in the state of Alabama where he is an Associate Pastor and/or Pulpit Conductor for Revivals & Special Programs.Dr. Edwards has many patents/inventions; numerous journal papers; and was coauthor of two books on Nanotechnology.",
      location: "United States",
      email: "edwards@hgcradio.com",
    },
    {
      id: "Pastor-Harris-and-Voices",
      img: Team2,
      name: "Pastor J'on Harris and Voices",
      bio: "J'on Harris and Voices is a dynamic ensemble of multi-cultural youth from all over the greater Sacramento area. Formed in the spring of 2001 in a small school called Hiram Johnson High School, Voices transformed from being a regular high school choir to a community choir whose music and ministry range from the east to the west. What started as a little performance at a black history program, the group had no idea that God was building them up for a greater calling. After their performance, the high school principal asked if Mr. Harris could help teach the choir class, because the regular choir teacher had become ill and could not finish out the school year. J'on Harris gladly accepted the adventure and began teaching the class the only music he knew - gospel. Toward the end of the school year, the students had developed a love and passion for music and a relationship with God. Friday rehearsals during that summer further united the group. They began singing at different events and eventually became J'on Harris and Voices. Their journey also saw them form a non-profit called EMBRACE where they regularly collaborate with different high schools in the Sacramento area and form after-school choirs all over the city. Through this platform, many of the youth have been saved and built a relationship with God. Over the years, J'on Harris and voices has recorded 3 full lengths CDs. Two of them, Changed and Another level, were played on radio stations from Sacramento to Louisiana. Voices has also recorded over 6 singles and sold over 35,000 CDs all over the country. In 2003, this group embarked on their first Taking Back Our Streets Tour where they traveled for 21 days across the country singing at different churches, events, street corners, and concerts. Voices has sung for gospel artists such as John P. Kee, Shirley Caesar and Kirk Franklin. They have been featured on Good Morning Sacramento KTXL, Channel 10, FOX 40 and in The Sacramento Bee. Today, Voices represents a vast cultural diversity spanning 4 continents, 8 languages and 17 countries worldwide. This group plans to share the Gospel for many years to come both here and abroad and will stop at nothing to fulfill God's purpose",
      location: "United States",
      email: "jon.harris@hgcradio.com",
    },
    {
      id: "Adia-Adia",
      img: Team7,
      name: "Adia Adia",
      bio: "Adia is a song by Canadian singer Sarah McLachlan that originally appeared on her 1997 album Surfacing. It was co-written by McLachlan and her longtime producer, Pierre Marchand. On VH1 Storytellers, McLachlan also said about the song, I'm not quite sure how to explain this one but, uh, I guess more than anything it's about my problems in dealing with feeling responsible for everyone else.[1] The song starts with no musical introduction. The lyrics begin Adia, I do believe I've failed you. Adia, I know I've let you down. The chorus says that We are all born innocent. Believe me Adia, we are still innocent. At times the music is simple and soft, with little more than a piano accompanying McLachlan. The song does not explain the exact relationship between the singer and Adia, whether they are friends, relatives or lovers. The video shows McLachlan singing directly to the camera in various public places, including a busy intersection, an office lobby, a supermarket aisle and in front of a store selling wedding dresses, where McLachlan kneels to grasp the hand of a child facing away from the camera.",
      location: "United States",
      email: "adia.adia@hgcradio.com",
    },
   
  ];


  const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/contact" },
    { videoSrc: "/vid2.mp4", link: "/contact" },
    { videoSrc: "/vid3.mp4", link: "/contact" },
  ];

  return (
    <div>
      <Breadcrum mainTitle="Studio Engineers" subTitle="Radio Broadcasters" />

      <div className="bg-[#0B1834] py-10">
        <div className="text-center space-y-2 py-8">
          <h3 className="text-xl font-extrabold text-[#66FCF1]">
            Radio Broadcasters
          </h3>
          <h2 className="text-2xl font-extrabold text-[#D9D9D9]">
            Hallelujah Gospel Studio Engineers
          </h2>
        </div>
        <div className="max-w-[1500px]  py-5 mx-auto px-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-10">
          {engineers.map((item, idx) => (
            <Link
              href={`/studio-engineers/${item.id}`}
              key={idx}
              className="group"
            >
              <div className=" px-10 bg-white relative   overflow-hidden group ">
                <Image
                  src={item.img}
                  alt="Team Image"
                  className=" group-hover:scale-110 h-[355px] object-cover transition-all duration-300 ease-in-out "
                />
              </div>
              <div className=" w-full  bg-[#28344C] text-white font-bold text-2xl text-center py-4 ">
                {item.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Ads items={videoAds} />
    </div>
  );
};

export default page;
