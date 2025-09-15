import Ads from "@/components/Ads";
import Breadcrum from "@/components/Breadcrum";
import LoginForm from "@/components/LoginForm";
const videoAds = [
  { videoSrc: "/vid1.mp4", link: "/contact" },
  { videoSrc: "/vid2.mp4", link: "/contact" },
  { videoSrc: "/vid3.mp4", link: "/contact" },
];
const page = () => {
  return (
    <div>
      <Breadcrum mainTitle="Login Account" subTitle="Login to your account" />
      <LoginForm />
      <Ads items={videoAds} />
    </div>
  );
};

export default page;
 