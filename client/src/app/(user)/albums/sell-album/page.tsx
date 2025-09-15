import Ads from "@/components/Ads";
import Breadcrum from "@/components/Breadcrum";
import PageWithCreateAccount from "@/components/CreateAccount";

const videoAds = [
  { videoSrc: "/vid1.mp4", link: "/contact" },
  { videoSrc: "/vid2.mp4", link: "/contact" },
  { videoSrc: "/vid3.mp4", link: "/contact" },
];
const page = () => {
  return (
    <div>
      <Breadcrum mainTitle="Album Distribution" subTitle="Sell Albums" />
     
      <PageWithCreateAccount/>

      <Ads items={videoAds} />
    </div>
  );
};

export default page;
