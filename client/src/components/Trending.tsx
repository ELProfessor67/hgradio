'use client';
import React from 'react';
import Image, { StaticImageData } from 'next/image';

import Trending1 from '@/assets/Trending1.jpg';
import Trending2 from '@/assets/Trending2.png';
import Trending3 from '@/assets/Trending3.jpg';
import Trending4 from '@/assets/Trending4.jpg';
import Trending5 from '@/assets/Trending5.jpg';
import Trending6 from '@/assets/Trending6.jpg';
import Trending7 from '@/assets/Trending7.png';
import Link from 'next/link';

// Define the type for each trending item
type TrendingItem = {
  img: StaticImageData;
  title: string;
  description: string;
};

const items: TrendingItem[] = [
  {
    img: Trending3,
    title: 'Top Global Ranking',
    description: 'Single / CD Downloads',
  },
  {
    img: Trending4,
    title: 'Epic Unveiling Albums',
    description: 'New Released Projects',
  },
  {
    img: Trending5,
    title: 'Chart Topping Songs',
    description: 'Most Listened To Music',
  },
  {
    img: Trending6,
    title: 'Breaking Gospel',
    description: 'Music News',
  },
];

const Trending: React.FC = () => {
  return (
    <div className="relative bg-cover bg-top bg-no-repeat flex items-center overflow-hidden py-[2rem] "
      style={{
        backgroundImage: `url(${Trending1.src})`,
      }}>
      <div className=' absolute left-5 top-10 z-10 '>
        <Image src={Trending2} alt='Plus icon' className=' w-[10rem] object-contain ' />
      </div>
      <div className=' absolute right-0 top-0 z-10 '>
        <Image src={Trending7} alt='Plus icon' className='  object-contain ' />
      </div>
      <div className="absolute inset-0 bg-black/80 z-0" />
      <div className=' relative z-10 max-w-[1500px] mx-auto px-3 space-y-[5rem] '>
        <div className=' text-center leading-tight  '>
          <div className=" text-[1.7rem] lg:text-[2rem] font-semibold text-second mb-2 ">Trending</div>
          <h2 className=" text-[2.5rem] lg:text-[3rem] font-bold mb-6 text-[#fff] ">Our Top Charts</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 z-50">
          {items.map((item, idx) => (
            <Card key={idx} item={item} idx={idx + 1} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Trending;

// Props type for the Card component
interface CardProps {
  item: TrendingItem;
  idx: number;
}

const Card: React.FC<CardProps> = ({ item, idx }) => {
  return (

    <Link href={"/albums"}>
      <div key={idx} className=" overflow-hidden group cursor-pointer ">
        <div className=' overflow-hidden  '>
          <Image src={item.img} alt={item.title} className="w-full h-[16rem] object-cover  group-hover:scale-110 transition-all duration-300 ease-in-out " />
        </div>
        <div className="p-3 text-[#fff] ">
          <div className="text-lg font-semibold group-hover:text-second transition-colors duration-300 ease-in-out ">{idx}. {item.title}</div>
          <div className="text-sm text-[#e0e0e0] ">{item.description}</div>
        </div>
      </div>
    </Link>
  );
};
