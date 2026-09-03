"use client";
import Breadcrum from "@/components/Breadcrum";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import HAbout3 from "@/assets/HAbout3.png";
import HAbout1 from "@/assets/HAbout1.png";
import About1 from "@/assets/About1.jpg";
import About2 from "@/assets/About2.jpg";
import About3 from "@/assets/About3.jpg";
import { Accordian } from "@/utils/Util";
import Review1 from "@/assets/Review1.jpg";
import HAbout4 from "@/assets/HAbout4.png";
import Ads from "@/components/Ads";
import { useState } from "react";


const page = () => {

  const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/sign-guestbook" },
    { videoSrc: "/vid2.mp4", link: "/sign-guestbook" },
    { videoSrc: "/vid3.mp4", link: "/sign-guestbook" },

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
  const [date, setDate] = useState<string>("");
  const [devotion, setDevotion] = useState<any>([]);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const ensureMinDevotions = (
    items: any[] | undefined,
    minCount: number,
    fallbackItems: any[]
  ) => {
    const base = Array.isArray(items) ? items : [];
    if (base.length >= minCount) return base;

    const source = fallbackItems.length ? fallbackItems : base;
    if (!source.length) return base;

    const out = [...base];
    let i = 0;
    while (out.length < minCount) {
      out.push(source[i % source.length]);
      i += 1;
    }
    return out;
  };

  const extraDevotions = [
    {
      type: "section",
      text: "Meditation",
    },
    {
      type: "paragraph",
      text: "Take a quiet moment to reflect. God is present with you right now—invite Him into your thoughts, plans, and decisions today.",
    },
    {
      type: "subtitle",
      text: "Question for Today",
    },
    {
      type: "paragraph",
      text: "What is one worry you can place in God’s hands today, and what step of faith can you take in response?",
    },
    {
      type: "section",
      text: "Prayer",
    },
    {
      type: "prayer",
      text: "Lord, thank You for being near. Help me trust You more today, obey Your voice, and walk in peace. Amen.",
    },
  ];

  const devotions = {
    1: [
      {
        type: "title",
        text: "Philippians 4:1-9 (NIV)",
      },
      {
        type: "verse",
        text: "Therefore, my brothers and sisters, you whom I love and long for, my joy and crown, stand firm in the Lord in this way, dear friends!"
      },
      {
        type: "verse",
        text: "I plead with Euodia and I plead with Syntyche to be of the same mind in the Lord."
      },
      {
        type: "verse",
        text: "Rejoice in the Lord always. I will say it again: Rejoice!"
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "subtitle",
        text: "Stand Firm in the Lord (Verse 1)",
      },
      {
        type: "paragraph",
        text: "Paul begins by encouraging us to stand firm in our faith. In a world full of challenges and distractions, it's essential to remain steadfast in our relationship with Christ."
      },
      {
        type: "subtitle",
        text: "Overcoming Anxiety (Verses 6-7)",
      },
      {
        type: "paragraph",
        text: "Paul instructs us not to be anxious but to present our requests to God with thanksgiving."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Heavenly Father, thank You for Your word that encourages and strengthens us..."
      }
    ],

    2:[
      {
        type: "title",
        text: "Philippians 4:1-9 (NIV)",
      },
      {
        type: "verse",
        text: "Therefore, my brothers and sisters, you whom I love and long for, my joy and crown, stand firm in the Lord in this way, dear friends!"
      },
      {
        type: "verse",
        text: "I plead with Euodia and I plead with Syntyche to be of the same mind in the Lord."
      },
      {
        type: "verse",
        text: "Rejoice in the Lord always. I will say it again: Rejoice!"
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "subtitle",
        text: "Stand Firm in the Lord (Verse 1)",
      },
      {
        type: "paragraph",
        text: "Paul begins by encouraging us to stand firm in our faith. In a world full of challenges and distractions, it's essential to remain steadfast in our relationship with Christ."
      },
      {
        type: "subtitle",
        text: "Overcoming Anxiety (Verses 6-7)",
      },
      {
        type: "paragraph",
        text: "Paul instructs us not to be anxious but to present our requests to God with thanksgiving."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Heavenly Father, thank You for Your word that encourages and strengthens us..."
      }
    ],
    3: [
      {
        type: "title",
        text: "Proverbs 3:5-6 (NIV)",
      },
      {
        type: "verse",
        text: "Trust in the Lord with all your heart and lean not on your own understanding;"
      },
      {
        type: "verse",
        text: "in all your ways submit to him, and he will make your paths straight."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "These verses remind us to fully trust God rather than relying on our limited understanding. When we surrender our plans to Him, He faithfully guides our steps and leads us on the right path."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, help me to trust You completely and not depend on my own understanding. Guide my paths according to Your will. Amen."
      },
      ...extraDevotions,
    ],
    4: [
      {
        type: "title",
        text: "Matthew 11:28-30 (NIV)",
      },
      {
        type: "verse",
        text: "Come to me, all you who are weary and burdened, and I will give you rest."
      },
      {
        type: "verse",
        text: "Take my yoke upon you and learn from me, for I am gentle and humble in heart."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "Jesus invites us to bring our burdens to Him. True rest is found not in escaping problems, but in walking closely with Christ and learning from His gentle and humble heart."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Jesus, I bring my burdens to You today. Teach me to walk in Your peace and find rest in Your presence. Amen."
      },
      ...extraDevotions,
    ],
    5: [
      {
        type: "title",
        text: "Isaiah 41:10 (NIV)",
      },
      {
        type: "verse",
        text: "So do not fear, for I am with you; do not be dismayed, for I am your God."
      },
      {
        type: "verse",
        text: "I will strengthen you and help you; I will uphold you with my righteous right hand."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "God assures us of His constant presence and strength. Even in moments of fear and uncertainty, He holds us firmly and gives us the courage to move forward."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Father God, thank You for being with me always. Strengthen me when I feel weak and help me trust in Your unfailing support. Amen."
      },
      ...extraDevotions,
    ],
    6: [
      {
        type: "title",
        text: "Psalm 46:1 (NIV)",
      },
      {
        type: "verse",
        text: "God is our refuge and strength, an ever-present help in trouble."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "This verse reminds us that God is not distant during our struggles. He is our safe place and our source of strength in every season of life."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, thank You for being my refuge and strength. Help me to run to You in every situation. Amen."
      },
      ...extraDevotions,
    ],
    7: [
      {
        type: "title",
        text: "Romans 12:12 (NIV)",
      },
      {
        type: "verse",
        text: "Be joyful in hope, patient in affliction, faithful in prayer."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "Paul encourages us to maintain joy, patience, and prayerfulness even during difficult times. These spiritual habits keep our faith strong and our hearts aligned with God."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "God, help me remain joyful in hope, patient in challenges, and faithful in prayer. Amen."
      },
      ...extraDevotions,
    ],
    8: [
      {
        type: "title",
        text: "Lamentations 3:22-23 (NIV)",
      },
      {
        type: "verse",
        text: "Because of the Lord’s great love we are not consumed, for his compassions never fail."
      },
      {
        type: "verse",
        text: "They are new every morning; great is your faithfulness."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "Each new day is a fresh reminder of God’s mercy and faithfulness. No matter yesterday’s struggles, today brings new grace from the Lord."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, thank You for Your new mercies every morning. Help me to trust Your faithfulness today. Amen."
      },
      ...extraDevotions,
    ],
    9: [
      {
        type: "title",
        text: "Joshua 1:9 (NIV)",
      },
      {
        type: "verse",
        text: "Be strong and courageous. Do not be afraid; do not be discouraged,"
      },
      {
        type: "verse",
        text: "for the Lord your God will be with you wherever you go."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "God calls us to walk forward in strength and courage, knowing that His presence goes with us wherever life leads."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, give me courage to face today’s challenges, trusting that You are always with me. Amen."
      },
      ...extraDevotions,
    ],
    10: [
      {
        type: "title",
        text: "Colossians 3:23 (NIV)",
      },
      {
        type: "verse",
        text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters."
      },
      {
        type: "section",
        text: "This verse reminds us that every task, big or small, is an opportunity to honor God. When we work with sincerity and excellence, we glorify Him."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Father, help me do everything with a willing and faithful heart, as service to You. Amen."
      },
      ...extraDevotions,
    ],
    11: [
      {
        type: "title",
        text: "Psalm 119:105 (NIV)",
      },
      {
        type: "verse",
        text: "Your word is a lamp for my feet, a light on my path."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "God’s Word provides guidance and clarity when the path ahead feels uncertain. By staying rooted in Scripture, we walk confidently in His light."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, guide my steps through Your Word and lead me in the path of truth. Amen."
      },
      ...extraDevotions,
    ],
    12: [
      {
        type: "title",
        text: "1 Peter 5:7 (NIV)",
      },
      {
        type: "verse",
        text: "Cast all your anxiety on him because he cares for you."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "God invites us to bring every worry to Him. He deeply cares for us and desires to carry the burdens that weigh us down."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Father, I give You my worries and fears today. Thank You for caring for me. Amen."
      },
      ...extraDevotions,
    ],
    13: [
      {
        type: "title",
        text: "John 15:5 (NIV)",
      },
      {
        type: "verse",
        text: "I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "Jesus reminds us that true spiritual growth comes from remaining connected to Him. Apart from Christ, we can do nothing of lasting value."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Jesus, help me remain connected to You and bear fruit that honors You. Amen."
      },
      ...extraDevotions,
    ],
    14: [
      {
        type: "title",
        text: "Hebrews 11:1 (NIV)",
      },
      {
        type: "verse",
        text: "Now faith is confidence in what we hope for and assurance about what we do not see."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "Faith calls us to trust God even when we cannot see the outcome. It is confidence rooted in God’s promises, not in our circumstances."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, strengthen my faith and help me trust You even when the path is unclear. Amen."
      },
      ...extraDevotions,
    ],
    15: [
      {
        type: "title",
        text: "Micah 6:8 (NIV)",
      },
      {
        type: "verse",
        text: "What does the Lord require of you? To act justly and to love mercy and to walk humbly with your God."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "God calls us to live lives marked by justice, mercy, and humility. These values reflect His character and shape our daily actions."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "God, help me act justly, love mercy, and walk humbly with You every day. Amen."
      },
      ...extraDevotions,
    ],
    16: [
      {
        type: "title",
        text: "2 Corinthians 12:9 (NIV)",
      },
      {
        type: "verse",
        text: "My grace is sufficient for you, for my power is made perfect in weakness."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "God’s grace meets us in our weakness. When we rely on Him instead of our own strength, His power works most clearly in our lives."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, thank You for Your sufficient grace. Help me rely on Your strength in my weakness. Amen."
      },
      ...extraDevotions,
    ],
    17: [
      {
        type: "title",
        text: "Psalm 37:5 (NIV)",
      },
      {
        type: "verse",
        text: "Commit your way to the Lord; trust in him and he will do this."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "When we commit our plans and decisions to God, we learn to trust His timing and direction. God works faithfully on behalf of those who rely on Him."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, I commit my plans and my future into Your hands. Help me trust You completely. Amen."
      },
      ...extraDevotions,
    ],
    18: [
      {
        type: "title",
        text: "Galatians 5:22-23 (NIV)",
      },
      {
        type: "verse",
        text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "A life led by the Holy Spirit produces godly character. As we grow closer to God, these fruits naturally become evident in our daily lives."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Holy Spirit, grow Your fruit in my life and shape my character to reflect Christ. Amen."
      },
      ...extraDevotions,
    ],
    19: [
      {
        type: "title",
        text: "Matthew 6:33 (NIV)",
      },
      {
        type: "verse",
        text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "Jesus teaches us to prioritize God above everything else. When we place Him first, He takes care of our needs according to His perfect will."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Father, help me seek Your kingdom first in all areas of my life. Amen."
      },
      ...extraDevotions,
    ],
    20: [
      {
        type: "title",
        text: "Ephesians 2:10 (NIV)",
      },
      {
        type: "verse",
        text: "For we are God’s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "You are intentionally created by God with purpose. Every good work you do is part of His divine plan for your life."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, thank You for creating me with purpose. Help me walk in the good works You have prepared for me. Amen."
      },
      ...extraDevotions,
    ],
    21: [
      {
        type: "title",
        text: "James 1:5 (NIV)",
      },
      {
        type: "verse",
        text: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "God promises wisdom to those who seek it. When faced with decisions, we can confidently ask Him for guidance and clarity."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "God, grant me Your wisdom today and help me make decisions that honor You. Amen."
      },
      ...extraDevotions,
    ],
    22: [
      {
        type: "title",
        text: "Romans 15:13 (NIV)",
      },
      {
        type: "verse",
        text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "God is the source of true hope. When we trust Him, our hearts are filled with joy and peace that overflow to those around us."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, fill me with Your hope, joy, and peace today. Let Your Spirit overflow in my life. Amen."
      },
      ...extraDevotions,
    ],
    23: [
      {
        type: "title",
        text: "Philippians 1:6 (NIV)",
      },
      {
        type: "verse",
        text: "Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "God begins good work in each of us and faithfully continues it. We can trust Him to complete the work of transformation in our lives."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Father, thank You for starting good work in me. Help me trust You to complete it fully. Amen."
      },
      ...extraDevotions,
    ],
    24: [
      {
        type: "title",
        text: "Isaiah 40:31 (NIV)",
      },
      {
        type: "verse",
        text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "God strengthens those who wait and trust in Him. In seasons of fatigue or struggle, His power lifts us to rise above our challenges."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, renew my strength today. Help me trust You and soar above every challenge. Amen."
      },
      ...extraDevotions,
    ],
    25: [
      {
        type: "title",
        text: "1 Thessalonians 5:16-18 (NIV)",
      },
      {
        type: "verse",
        text: "Rejoice always, pray continually, give thanks in all circumstances; for this is God’s will for you in Christ Jesus."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "Paul reminds us to maintain joy, gratitude, and constant prayer. These practices align our hearts with God’s will and sustain us through every season."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "God, help me rejoice always, remain prayerful, and give thanks in every situation. Amen."
      },
      ...extraDevotions,
    ],
    26: [
      {
        type: "title",
        text: "Proverbs 16:3 (NIV)",
      },
      {
        type: "verse",
        text: "Commit to the Lord whatever you do, and he will establish your plans."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "When we dedicate our actions and decisions to God, He ensures that our plans succeed according to His purpose."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, help me commit everything I do to You, trusting that You will guide and establish my plans. Amen."
      },
      ...extraDevotions,
    ],
    27: [
      {
        type: "title",
        text: "Psalm 34:8 (NIV)",
      },
      {
        type: "verse",
        text: "Taste and see that the Lord is good; blessed is the one who takes refuge in him."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "God invites us to experience His goodness personally. Trusting Him brings blessings and protection into our lives."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, help me experience Your goodness and find refuge in You every day. Amen."
      },
      ...extraDevotions,
    ],
    28: [
      {
        type: "title",
        text: "Hebrews 13:5 (NIV)",
      },
      {
        type: "verse",
        text: "Keep your lives free from the love of money and be content with what you have, because God has said, 'Never will I leave you; never will I forsake you.'"
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "True contentment comes from trusting God’s presence and provision, not in accumulating wealth. He is always with us."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "God, help me to find contentment in You and trust that You will never leave me. Amen."
      },
      ...extraDevotions,
    ],
    29: [
      {
        type: "title",
        text: "Matthew 5:14-16 (NIV)",
      },
      {
        type: "verse",
        text: "You are the light of the world. A town built on a hill cannot be hidden."
      },
      {
        type: "verse",
        text: "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "Jesus calls us to live visibly for Him. Our actions and character can inspire others and bring glory to God."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, help me shine Your light through my words and actions, bringing glory to Your name. Amen."
      },
      ...extraDevotions,
    ],
    30: [
      {
        type: "title",
        text: "John 14:27 (NIV)",
      },
      {
        type: "verse",
        text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "Jesus offers a peace unlike anything the world can provide. When we rely on Him, our hearts can remain calm and fearless, even in trials."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Lord, fill me with Your peace and help me remain untroubled and unafraid today. Amen."
      },
      ...extraDevotions,
    ],
    31: [
      {
        type: "title",
        text: "Romans 8:28 (NIV)",
      },
      {
        type: "verse",
        text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose."
      },
      {
        type: "section",
        text: "Reflection",
      },
      {
        type: "paragraph",
        text: "God orchestrates everything in the lives of those who love Him for their ultimate good. Even difficulties are woven into His perfect plan."
      },
      {
        type: "section",
        text: "Prayer",
      },
      {
        type: "prayer",
        text: "Father, help me trust that You are working all things together for my good. Amen."
      },
      ...extraDevotions,
    ],
  };

  useEffect(() => {
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    setDate(`${day} ${monthNames[month]} ${year}`);
    const fallback = devotions[1] ?? [];
    const todays = devotions[day as keyof typeof devotions] ?? fallback;
    setDevotion(ensureMinDevotions(todays, 10, fallback));
  }, [])
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
          {date}
        </div>
        <h2 className="text-[3rem] font-bold mb-6 text-[#fff] ">
          Daily Devotions
        </h2>

        
      </div>

      <div className=" max-w-[1000px] mx-auto px-3 text-[#fff] md:text-xl min-h-[30rem] ">
       {devotion.map((item: any, index: number) => (
        <div key={index}>
          {item.type === "title" && <h3 className="text-[1.5rem] font-bold mb-2 text-[#fff] ">{item.text}</h3>}
          {item.type === "subtitle" && <h4 className="text-[1.2rem] font-semibold mb-2 text-second ">{item.text}</h4>}
          {item.type === "verse" && <p className="text-[1.2rem] font-semibold mb-2 text-[#fff] ">{item.text}</p>}
          {item.type === "section" && <h4 className="text-[1.2rem] font-semibold mb-2 text-[#fff] ">{item.text}</h4>}
          {item.type === "paragraph" && <p className="text-[1.2rem] mb-2 text-[#fff] ">{item.text}</p>}
          {item.type === "prayer" && <p className="text-[1.2rem] font-semibold mb-2 text-[#fff] ">{item.text}</p>}
        </div>
       ))}
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
          <div className=" text-[2rem] lg:text-[3rem] font-bold leading-tight ">
            <span className="text-green-400">Vision:</span> Reaching Over 2.6 Billion People One Faith, One Future.
          </div>
          <p className=" text-lg my-[2rem] lg:my-[3rem] text-gray-200 ">
            Let the soul-stirring melodies of gospel music uplift you on our
            Hallelujah Radio station. Tune in for divine inspiration today.
          </p>
          <div className=" grid grid-cols-3 gap-3 ">
            <div className="  font-semibold leading-tight ">
              <div className=" text-[2rem] text-second ">Be one of <br />2B+</div>
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
  const [expanded, setExpanded] = useState(false);
  return (
    <div className=" relative py-[3rem] bg-[#1f2226] ">
      <div className=" max-w-[1300px] mx-auto px-3 ">
        <div className=" max-w-[1300px] mx-auto px-3 flex py-[1rem] md:flex-row flex-col md:gap-0 gap-5  ">
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

                {expanded && <>

                  <p className=" my-2">
                    Whatever the day brings, we are here to keep you company.
                    It is our prayer that you will come with an expectant heart and let the Lord minister to you.
                    And remember to invite your family and friends, so that they,
                    too, will experience the anointing and feel the jubilance in their spirit.
                  </p>
                </>}
              </div>
              {!expanded && <>
                <div className="">
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="  px-8 py-3 bg-second font-semibold text-[#000] "
                  >
                    See More
                  </button>
                </div>
              </>}
            </div>
          </div>
        </div>

        {expanded && <>
          <p className=" my-2 text-white text-lg">
            It's all about praising God together! This is also a venue to get your ministries heard throughout the region and across the globe, so be sure to contact us to know more about our program schedule and how we can work together.
          </p>
          <p className=" my-2 text-white text-lg">
            It is no coincidence that you have found us online, and we hope that you also find Choice Radio a place of refuge, faith, love, healing, and deliverance.
          </p>
          <blockquote className="mt-4 bg-[#1b2846] p-3 text-white text-lg rounded-md py-4 flex items-center">
            <span className="h-[2rem] w-[2px] bg-second rounded-full inline-block mr-2"></span>
            He Put A New Song In My Mouth, A Hymn Of Praise To Our God. (- Psalm 40:3)
          </blockquote>
        </>}
      </div>
    </div>
  );
};
