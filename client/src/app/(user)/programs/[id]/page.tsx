"use client"
import Breadcrum from '@/components/Breadcrum'
import React, { FC, use, useMemo } from 'react'
import bg2 from "@/assets/previous-show.jpg";
import Ads from '@/components/Ads';
import { useData } from '@/context/Context';
import Image from 'next/image';


const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/contact" },
    { videoSrc: "/vid2.mp4", link: "/contact" },
    { videoSrc: "/vid3.mp4", link: "/contact" },
];

interface Iprops {
    params: {
        id: string
    }
}

const page: FC<Iprops> = ({ params }) => {
    const { id } = params
    const { getDetails } = useData();

    const details = useMemo(() => getDetails(id), [getDetails, id]);



    return (
        <div>
            <Breadcrum mainTitle="Program Details" subTitle="Programs" />

            <div
                className="relative z-20 min-h-screen bg-no-repeat bg-cover"
                style={{ backgroundImage: `url(${bg2.src})` }}
            >
                <div className="absolute inset-0 bg-black/60 z-[-1]" />


                <div className=" bg-[#071126]">
                    <div className=" max-w-[1500px] mx-auto px-3 py-20  text-white">
                        <h2 className="text-cyan-400 text-xl md:text-2xl font-bold text-center mb-4">
                            Show details
                        </h2>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-center mb-10">
                            " {details?.showName} "
                        </h1>
                        <div className="flex flex-col md:flex-row gap-20">
                            <div className="flex-1">
                                <div className="flex gap-5">
                                    <Image
                                        alt="Gregory Franklin"
                                        loading="lazy"
                                        width={100}
                                        height={100}
                                        decoding="async"
                                        data-nimg={1}
                                        className=""
                                        src={details?.artistImg || bg2}
                                        style={{ color: "transparent" }}
                                    />
                                    <div className="">
                                        <h3 className="text-2xl pt-2 font-semibold">{details?.artistName}</h3>
                                        <p className="text-gray-300 pt-4">Studio Engineer</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-gray-200">
                                    {details?.description}
                                </p>
                            </div>
                            <div className="flex-1">
                                <table className="w-full text-left ">
                                    <thead className="bg-[#222A3A] py-3">
                                        <tr className=" border-b py-2 ">
                                            <th className="px-4 py-2 ">Day</th>
                                            <th className="px-4 py-2 ">Starts from</th>
                                            <th className="px-4 py-2 ">Ends at</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            details?.schedule?.map((sch, index) => (
                                                <tr className="bg-gray-800 border-b ">
                                                    <td className="px-4 py-2 ">{sch.day}</td>
                                                    <td className="px-4 py-2 ">{sch.startTime}</td>
                                                    <td className="px-4 py-2 ">{sch.endTime}</td>
                                                </tr>
                                            ))
                                        }

                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Ads items={videoAds} />
        </div>
    )
}

export default page