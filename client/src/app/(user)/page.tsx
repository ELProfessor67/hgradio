"use client";

import AboutUs, { Stats } from "@/components/AboutUs";
import Hero from "@/components/Hero";
import Review from "@/components/Review";
import Schedule from "@/components/Schedule";
import Team from "@/components/Team";
import Trending from "@/components/Trending";
import { HomeAds } from "@/utils/Util";

export default function Home() {
  return (
    <div>
      <Hero />
      <AboutUs />
      <Trending />
      <Schedule />
      <Stats />
      <Team />
      <Review />
      <HomeAds />
    </div>
  );
}
