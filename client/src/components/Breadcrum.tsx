import BreadcrumImg from "@/assets/inner-page-banner.jpg";

const Breadcrum = ({
  mainTitle,
  subTitle,
}: {
  mainTitle: string;
  subTitle: string;
}) => {
  return (
    <section
      className="relative w-full h-[260px] lg:h-[470px] flex items-center justify-center bg-cover bg-center text-white overflow-hidden"
      style={{
        backgroundImage: `url(${BreadcrumImg.src})`,
      }}
    >


      <div className="absolute -left-[15rem] -bottom-[10rem] md:-bottom-[6rem] w-[30rem] h-[30rem] z-10">
  {/* Layer 1 */}
  <div className="absolute inset-0 rounded-full bg-white/30 opacity-30 animate-pulseSlow"></div>
  {/* Layer 2 */}
  <div className="absolute inset-16 rounded-full bg-white/30 opacity-20 animate-pulseSlow animation-delay-500"></div>
  {/* Layer 3 */}
  <div className="absolute inset-32 rounded-full bg-white/30 opacity-10 animate-pulseSlow animation-delay-1000"></div>
  {/* Layer 4 */}
  <div className="absolute inset-44 rounded-full bg-white/30 opacity-5 animate-pulseSlow animation-delay-[1500ms]"></div>
</div>




      <div className="absolute inset-0 bg-gray-900/50 z-[1]" />

      {/* <div className="absolute left-0 bottom-0 w-[500px] h-[500px] -translate-x-[40%] overflow-hidden z-[1]">
        <div className="circle xxlarge shade1" />
        <div className="circle xlarge shade2" />
        <div className="circle large shade3" />
        <div className="circle medium shade4" />
        <div className="circle small shade5" />
      </div> */}

      <div className="relative z-[2] pt-14 text-center">
        <h1 className="text-3xl  md:text-4xl font-extrabold">{mainTitle}</h1>
        <p className="mt-5 text-lg  font-bold">
          Home <span className="mx-1">-</span> {subTitle}
        </p>
      </div>
    </section>
  );
};

export default Breadcrum;
