import React from 'react'

const page = () => {
    return (
        <div className=" text-[#fff] ">
            <div className=" mb-[2rem]  ">
                <h3 className=" text-[1.5rem] font-medium *: ">All Users</h3>
            </div>
            <div>
                <div className="overflow-x-auto table-scrollbar ">
                    <table className=" w-full mx-auto my-6">
                        <thead>
                            <tr className="bg-[#071126] px-3 text-[#fff] border-none ">
                                <th className="py-3 px-3 text-left whitespace-nowrap border-b flex items-center gap-2">
                                    <input id="" className=" scale-125 " type="checkbox" name="" />
                                    Img &amp; Name
                                </th>
                                <th className="py-3 px-3 text-center whitespace-nowrap border-b">
                                    Email
                                </th>
                                <th className="py-3 px-3 text-center whitespace-nowrap border-b">
                                    City
                                </th>
                                <th className="py-3 px-3 text-center whitespace-nowrap border-b">
                                    Country
                                </th>
                                <th className="py-3 px-3 text-center whitespace-nowrap border-b">
                                    Description
                                </th>
                                <th className="py-3 pl-3 pr-10 text-end whitespace-nowrap border-b">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="hover:bg-[#071126]/80 cursor-pointer transition duration-300 border-b border-[#5f554a] ">
                                <td className="pt-3 pb-2 px-2 whitespace-nowrap text-left flex items-center gap-2 ">
                                    <input id="" className=" scale-125 " type="checkbox" name="" />
                                    <div className=" relative w-[3rem] h-[3rem] bg-second/50 rounded-full " />
                                    Md Shahed
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    r2scoder@gmail.com
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    chittagong
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    bangladesh
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center ">N/A</td>
                                <td className=" py-3 ">
                                    <div className=" flex justify-end items-center pr-8 gap-1 ">
                                        <div className=" p-3 rounded-full bg-[#D6BFA7]/10 hover:bg-second hover:text-[#000] transition-colors duration-300 ease-in-out ">
                                            <svg
                                                stroke="currentColor"
                                                fill="currentColor"
                                                strokeWidth={0}
                                                viewBox="0 0 512 512"
                                                className=" text-[1.4rem] cursor-pointer "
                                                height="1em"
                                                width="1em"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M376 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeMiterlimit={10}
                                                    strokeWidth={32}
                                                    d="M288 304c-87 0-175.3 48-191.64 138.6-2 10.92 4.21 21.4 15.65 21.4H464c11.44 0 17.62-10.48 15.65-21.4C463.3 352 375 304 288 304z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M144 232H32"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr className="hover:bg-[#071126]/80 cursor-pointer transition duration-300 border-b border-[#5f554a] ">
                                <td className="pt-3 pb-2 px-2 whitespace-nowrap text-left flex items-center gap-2 ">
                                    <input id="" className=" scale-125 " type="checkbox" name="" />
                                    <div className=" relative w-[3rem] h-[3rem] bg-second/50 rounded-full " />
                                    Greg Franklin
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    tony_9162001@yahoo.com
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    San Ramon
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    United States
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center ">N/A</td>
                                <td className=" py-3 ">
                                    <div className=" flex justify-end items-center pr-8 gap-1 ">
                                        <div className=" p-3 rounded-full bg-[#D6BFA7]/10 hover:bg-second hover:text-[#000] transition-colors duration-300 ease-in-out ">
                                            <svg
                                                stroke="currentColor"
                                                fill="currentColor"
                                                strokeWidth={0}
                                                viewBox="0 0 512 512"
                                                className=" text-[1.4rem] cursor-pointer "
                                                height="1em"
                                                width="1em"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M376 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeMiterlimit={10}
                                                    strokeWidth={32}
                                                    d="M288 304c-87 0-175.3 48-191.64 138.6-2 10.92 4.21 21.4 15.65 21.4H464c11.44 0 17.62-10.48 15.65-21.4C463.3 352 375 304 288 304z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M144 232H32"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr className="hover:bg-[#071126]/80 cursor-pointer transition duration-300 border-b border-[#5f554a] ">
                                <td className="pt-3 pb-2 px-2 whitespace-nowrap text-left flex items-center gap-2 ">
                                    <input id="" className=" scale-125 " type="checkbox" name="" />
                                    <div className=" relative w-[3rem] h-[3rem] bg-second/50 rounded-full ">
                                        <img
                                            alt="Category Icon"
                                            loading="lazy"
                                            decoding="async"
                                            data-nimg="fill"
                                            className=" object-cover rounded-full "
                                            sizes="100vw"
                                            srcSet="/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755455365%2FSIDESONE%2Flcruawfh491knq74d8ct.webp&w=640&q=75 640w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755455365%2FSIDESONE%2Flcruawfh491knq74d8ct.webp&w=750&q=75 750w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755455365%2FSIDESONE%2Flcruawfh491knq74d8ct.webp&w=828&q=75 828w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755455365%2FSIDESONE%2Flcruawfh491knq74d8ct.webp&w=1080&q=75 1080w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755455365%2FSIDESONE%2Flcruawfh491knq74d8ct.webp&w=1200&q=75 1200w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755455365%2FSIDESONE%2Flcruawfh491knq74d8ct.webp&w=1920&q=75 1920w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755455365%2FSIDESONE%2Flcruawfh491knq74d8ct.webp&w=2048&q=75 2048w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755455365%2FSIDESONE%2Flcruawfh491knq74d8ct.webp&w=3840&q=75 3840w"
                                            src="/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755455365%2FSIDESONE%2Flcruawfh491knq74d8ct.webp&w=3840&q=75"
                                            style={{
                                                position: "absolute",
                                                height: "100%",
                                                width: "100%",
                                                inset: 0,
                                                color: "transparent"
                                            }}
                                        />
                                    </div>
                                    Pastor Larry Austin
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    l.austin@hallelujahgospel.com
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    New York
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    United States
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center ">
                                    Pastor Larry Austin,...
                                    <button className="ml-2 text-blue-400">See more</button>
                                </td>
                                <td className=" py-3 ">
                                    <div className=" flex justify-end items-center pr-8 gap-1 ">
                                        <div className=" p-3 rounded-full bg-[#D6BFA7]/10 hover:bg-second hover:text-[#000] transition-colors duration-300 ease-in-out ">
                                            <svg
                                                stroke="currentColor"
                                                fill="currentColor"
                                                strokeWidth={0}
                                                viewBox="0 0 512 512"
                                                className=" text-[1.4rem] cursor-pointer "
                                                height="1em"
                                                width="1em"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M376 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeMiterlimit={10}
                                                    strokeWidth={32}
                                                    d="M288 304c-87 0-175.3 48-191.64 138.6-2 10.92 4.21 21.4 15.65 21.4H464c11.44 0 17.62-10.48 15.65-21.4C463.3 352 375 304 288 304z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M144 232H32"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr className="hover:bg-[#071126]/80 cursor-pointer transition duration-300 border-b border-[#5f554a] ">
                                <td className="pt-3 pb-2 px-2 whitespace-nowrap text-left flex items-center gap-2 ">
                                    <input id="" className=" scale-125 " type="checkbox" name="" />
                                    <div className=" relative w-[3rem] h-[3rem] bg-second/50 rounded-full ">
                                        <img
                                            alt="Category Icon"
                                            loading="lazy"
                                            decoding="async"
                                            data-nimg="fill"
                                            className=" object-cover rounded-full "
                                            sizes="100vw"
                                            srcSet="/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436735%2FSIDESONE%2Fbnzh5i1dndoy0oeehcgz.png&w=640&q=75 640w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436735%2FSIDESONE%2Fbnzh5i1dndoy0oeehcgz.png&w=750&q=75 750w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436735%2FSIDESONE%2Fbnzh5i1dndoy0oeehcgz.png&w=828&q=75 828w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436735%2FSIDESONE%2Fbnzh5i1dndoy0oeehcgz.png&w=1080&q=75 1080w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436735%2FSIDESONE%2Fbnzh5i1dndoy0oeehcgz.png&w=1200&q=75 1200w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436735%2FSIDESONE%2Fbnzh5i1dndoy0oeehcgz.png&w=1920&q=75 1920w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436735%2FSIDESONE%2Fbnzh5i1dndoy0oeehcgz.png&w=2048&q=75 2048w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436735%2FSIDESONE%2Fbnzh5i1dndoy0oeehcgz.png&w=3840&q=75 3840w"
                                            src="/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436735%2FSIDESONE%2Fbnzh5i1dndoy0oeehcgz.png&w=3840&q=75"
                                            style={{
                                                position: "absolute",
                                                height: "100%",
                                                width: "100%",
                                                inset: 0,
                                                color: "transparent"
                                            }}
                                        />
                                    </div>
                                    Kenny Andrews
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    k.andrews@hallelujahgospel.com
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    New York
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    United States
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center ">
                                    Kenny Andrews inspir...
                                    <button className="ml-2 text-blue-400">See more</button>
                                </td>
                                <td className=" py-3 ">
                                    <div className=" flex justify-end items-center pr-8 gap-1 ">
                                        <div className=" p-3 rounded-full bg-[#D6BFA7]/10 hover:bg-second hover:text-[#000] transition-colors duration-300 ease-in-out ">
                                            <svg
                                                stroke="currentColor"
                                                fill="currentColor"
                                                strokeWidth={0}
                                                viewBox="0 0 512 512"
                                                className=" text-[1.4rem] cursor-pointer "
                                                height="1em"
                                                width="1em"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M376 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeMiterlimit={10}
                                                    strokeWidth={32}
                                                    d="M288 304c-87 0-175.3 48-191.64 138.6-2 10.92 4.21 21.4 15.65 21.4H464c11.44 0 17.62-10.48 15.65-21.4C463.3 352 375 304 288 304z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M144 232H32"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr className="hover:bg-[#071126]/80 cursor-pointer transition duration-300 border-b border-[#5f554a] ">
                                <td className="pt-3 pb-2 px-2 whitespace-nowrap text-left flex items-center gap-2 ">
                                    <input id="" className=" scale-125 " type="checkbox" name="" />
                                    <div className=" relative w-[3rem] h-[3rem] bg-second/50 rounded-full ">
                                        <img
                                            alt="Category Icon"
                                            loading="lazy"
                                            decoding="async"
                                            data-nimg="fill"
                                            className=" object-cover rounded-full "
                                            sizes="100vw"
                                            srcSet="/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436555%2FSIDESONE%2Fbfsfdbx2slnaplpbboxw.png&w=640&q=75 640w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436555%2FSIDESONE%2Fbfsfdbx2slnaplpbboxw.png&w=750&q=75 750w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436555%2FSIDESONE%2Fbfsfdbx2slnaplpbboxw.png&w=828&q=75 828w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436555%2FSIDESONE%2Fbfsfdbx2slnaplpbboxw.png&w=1080&q=75 1080w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436555%2FSIDESONE%2Fbfsfdbx2slnaplpbboxw.png&w=1200&q=75 1200w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436555%2FSIDESONE%2Fbfsfdbx2slnaplpbboxw.png&w=1920&q=75 1920w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436555%2FSIDESONE%2Fbfsfdbx2slnaplpbboxw.png&w=2048&q=75 2048w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436555%2FSIDESONE%2Fbfsfdbx2slnaplpbboxw.png&w=3840&q=75 3840w"
                                            src="/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755436555%2FSIDESONE%2Fbfsfdbx2slnaplpbboxw.png&w=3840&q=75"
                                            style={{
                                                position: "absolute",
                                                height: "100%",
                                                width: "100%",
                                                inset: 0,
                                                color: "transparent"
                                            }}
                                        />
                                    </div>
                                    Apostle Gary L. Wyatt
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    g.wyatt@hallelujahgospel.com
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    New York
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    United States
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center ">
                                    Heaven's Harmony inv...
                                    <button className="ml-2 text-blue-400">See more</button>
                                </td>
                                <td className=" py-3 ">
                                    <div className=" flex justify-end items-center pr-8 gap-1 ">
                                        <div className=" p-3 rounded-full bg-[#D6BFA7]/10 hover:bg-second hover:text-[#000] transition-colors duration-300 ease-in-out ">
                                            <svg
                                                stroke="currentColor"
                                                fill="currentColor"
                                                strokeWidth={0}
                                                viewBox="0 0 512 512"
                                                className=" text-[1.4rem] cursor-pointer "
                                                height="1em"
                                                width="1em"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M376 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeMiterlimit={10}
                                                    strokeWidth={32}
                                                    d="M288 304c-87 0-175.3 48-191.64 138.6-2 10.92 4.21 21.4 15.65 21.4H464c11.44 0 17.62-10.48 15.65-21.4C463.3 352 375 304 288 304z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M144 232H32"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr className="hover:bg-[#071126]/80 cursor-pointer transition duration-300 border-b border-[#5f554a] ">
                                <td className="pt-3 pb-2 px-2 whitespace-nowrap text-left flex items-center gap-2 ">
                                    <input id="" className=" scale-125 " type="checkbox" name="" />
                                    <div className=" relative w-[3rem] h-[3rem] bg-second/50 rounded-full ">
                                        <img
                                            alt="Category Icon"
                                            loading="lazy"
                                            decoding="async"
                                            data-nimg="fill"
                                            className=" object-cover rounded-full "
                                            sizes="100vw"
                                            srcSet="/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435662%2FSIDESONE%2Fnz8kzw7rfxdhx4afn3h4.png&w=640&q=75 640w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435662%2FSIDESONE%2Fnz8kzw7rfxdhx4afn3h4.png&w=750&q=75 750w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435662%2FSIDESONE%2Fnz8kzw7rfxdhx4afn3h4.png&w=828&q=75 828w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435662%2FSIDESONE%2Fnz8kzw7rfxdhx4afn3h4.png&w=1080&q=75 1080w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435662%2FSIDESONE%2Fnz8kzw7rfxdhx4afn3h4.png&w=1200&q=75 1200w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435662%2FSIDESONE%2Fnz8kzw7rfxdhx4afn3h4.png&w=1920&q=75 1920w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435662%2FSIDESONE%2Fnz8kzw7rfxdhx4afn3h4.png&w=2048&q=75 2048w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435662%2FSIDESONE%2Fnz8kzw7rfxdhx4afn3h4.png&w=3840&q=75 3840w"
                                            src="/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435662%2FSIDESONE%2Fnz8kzw7rfxdhx4afn3h4.png&w=3840&q=75"
                                            style={{
                                                position: "absolute",
                                                height: "100%",
                                                width: "100%",
                                                inset: 0,
                                                color: "transparent"
                                            }}
                                        />
                                    </div>
                                    Pastor Ben Cha Me
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    p.ben@hallelujahgospel.com
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    New York
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    United States
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center ">
                                    "Jesus Christ alone ...
                                    <button className="ml-2 text-blue-400">See more</button>
                                </td>
                                <td className=" py-3 ">
                                    <div className=" flex justify-end items-center pr-8 gap-1 ">
                                        <div className=" p-3 rounded-full bg-[#D6BFA7]/10 hover:bg-second hover:text-[#000] transition-colors duration-300 ease-in-out ">
                                            <svg
                                                stroke="currentColor"
                                                fill="currentColor"
                                                strokeWidth={0}
                                                viewBox="0 0 512 512"
                                                className=" text-[1.4rem] cursor-pointer "
                                                height="1em"
                                                width="1em"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M376 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeMiterlimit={10}
                                                    strokeWidth={32}
                                                    d="M288 304c-87 0-175.3 48-191.64 138.6-2 10.92 4.21 21.4 15.65 21.4H464c11.44 0 17.62-10.48 15.65-21.4C463.3 352 375 304 288 304z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M144 232H32"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr className="hover:bg-[#071126]/80 cursor-pointer transition duration-300 border-b border-[#5f554a] ">
                                <td className="pt-3 pb-2 px-2 whitespace-nowrap text-left flex items-center gap-2 ">
                                    <input id="" className=" scale-125 " type="checkbox" name="" />
                                    <div className=" relative w-[3rem] h-[3rem] bg-second/50 rounded-full ">
                                        <img
                                            alt="Category Icon"
                                            loading="lazy"
                                            decoding="async"
                                            data-nimg="fill"
                                            className=" object-cover rounded-full "
                                            sizes="100vw"
                                            srcSet="/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435455%2FSIDESONE%2Frs4ddno4rihgx7px9ycu.png&w=640&q=75 640w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435455%2FSIDESONE%2Frs4ddno4rihgx7px9ycu.png&w=750&q=75 750w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435455%2FSIDESONE%2Frs4ddno4rihgx7px9ycu.png&w=828&q=75 828w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435455%2FSIDESONE%2Frs4ddno4rihgx7px9ycu.png&w=1080&q=75 1080w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435455%2FSIDESONE%2Frs4ddno4rihgx7px9ycu.png&w=1200&q=75 1200w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435455%2FSIDESONE%2Frs4ddno4rihgx7px9ycu.png&w=1920&q=75 1920w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435455%2FSIDESONE%2Frs4ddno4rihgx7px9ycu.png&w=2048&q=75 2048w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435455%2FSIDESONE%2Frs4ddno4rihgx7px9ycu.png&w=3840&q=75 3840w"
                                            src="/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435455%2FSIDESONE%2Frs4ddno4rihgx7px9ycu.png&w=3840&q=75"
                                            style={{
                                                position: "absolute",
                                                height: "100%",
                                                width: "100%",
                                                inset: 0,
                                                color: "transparent"
                                            }}
                                        />
                                    </div>
                                    Gregory Franklin
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    g.franklin@hallelujahgospel.com
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    New York
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    United States
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center ">
                                    Everything in life s...
                                    <button className="ml-2 text-blue-400">See more</button>
                                </td>
                                <td className=" py-3 ">
                                    <div className=" flex justify-end items-center pr-8 gap-1 ">
                                        <div className=" p-3 rounded-full bg-[#D6BFA7]/10 hover:bg-second hover:text-[#000] transition-colors duration-300 ease-in-out ">
                                            <svg
                                                stroke="currentColor"
                                                fill="currentColor"
                                                strokeWidth={0}
                                                viewBox="0 0 512 512"
                                                className=" text-[1.4rem] cursor-pointer "
                                                height="1em"
                                                width="1em"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M376 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeMiterlimit={10}
                                                    strokeWidth={32}
                                                    d="M288 304c-87 0-175.3 48-191.64 138.6-2 10.92 4.21 21.4 15.65 21.4H464c11.44 0 17.62-10.48 15.65-21.4C463.3 352 375 304 288 304z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M144 232H32"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr className="hover:bg-[#071126]/80 cursor-pointer transition duration-300 border-b border-[#5f554a] ">
                                <td className="pt-3 pb-2 px-2 whitespace-nowrap text-left flex items-center gap-2 ">
                                    <input id="" className=" scale-125 " type="checkbox" name="" />
                                    <div className=" relative w-[3rem] h-[3rem] bg-second/50 rounded-full ">
                                        <img
                                            alt="Category Icon"
                                            loading="lazy"
                                            decoding="async"
                                            data-nimg="fill"
                                            className=" object-cover rounded-full "
                                            sizes="100vw"
                                            srcSet="/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435280%2FSIDESONE%2Fryfn0okhylaucteniaec.png&w=640&q=75 640w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435280%2FSIDESONE%2Fryfn0okhylaucteniaec.png&w=750&q=75 750w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435280%2FSIDESONE%2Fryfn0okhylaucteniaec.png&w=828&q=75 828w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435280%2FSIDESONE%2Fryfn0okhylaucteniaec.png&w=1080&q=75 1080w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435280%2FSIDESONE%2Fryfn0okhylaucteniaec.png&w=1200&q=75 1200w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435280%2FSIDESONE%2Fryfn0okhylaucteniaec.png&w=1920&q=75 1920w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435280%2FSIDESONE%2Fryfn0okhylaucteniaec.png&w=2048&q=75 2048w, /_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435280%2FSIDESONE%2Fryfn0okhylaucteniaec.png&w=3840&q=75 3840w"
                                            src="/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fddlwhkn3b%2Fimage%2Fupload%2Fv1755435280%2FSIDESONE%2Fryfn0okhylaucteniaec.png&w=3840&q=75"
                                            style={{
                                                position: "absolute",
                                                height: "100%",
                                                width: "100%",
                                                inset: 0,
                                                color: "transparent"
                                            }}
                                        />
                                    </div>
                                    Dr Edwards
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    d.edwards@hallelujahgospel.com
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    New York
                                </td>
                                <td className="py-3 px-2 whitespace-nowrap text-center">
                                    United States
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center ">
                                    Dr. Edwards is the P...
                                    <button className="ml-2 text-blue-400">See more</button>
                                </td>
                                <td className=" py-3 ">
                                    <div className=" flex justify-end items-center pr-8 gap-1 ">
                                        <div className=" p-3 rounded-full bg-[#D6BFA7]/10 hover:bg-second hover:text-[#000] transition-colors duration-300 ease-in-out ">
                                            <svg
                                                stroke="currentColor"
                                                fill="currentColor"
                                                strokeWidth={0}
                                                viewBox="0 0 512 512"
                                                className=" text-[1.4rem] cursor-pointer "
                                                height="1em"
                                                width="1em"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M376 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeMiterlimit={10}
                                                    strokeWidth={32}
                                                    d="M288 304c-87 0-175.3 48-191.64 138.6-2 10.92 4.21 21.4 15.65 21.4H464c11.44 0 17.62-10.48 15.65-21.4C463.3 352 375 304 288 304z"
                                                />
                                                <path
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={32}
                                                    d="M144 232H32"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="flex justify-center items-center mt-6 space-x-2 text-[#fff] ">
                <button
                    className="p-1 rounded-full text-[1.7rem] hover:bg-main text-main hover:text-[#fff] disabled:opacity-50 cursor-pointer "
                    disabled={false}
                >
                    <svg
                        stroke="currentColor"
                        fill="currentColor"
                        strokeWidth={0}
                        viewBox="0 0 512 512"
                        height="1em"
                        width="1em"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M217.9 256L345 129c9.4-9.4 9.4-24.6 0-33.9-9.4-9.4-24.6-9.3-34 0L167 239c-9.1 9.1-9.3 23.7-.7 33.1L310.9 417c4.7 4.7 10.9 7 17 7s12.3-2.3 17-7c9.4-9.4 9.4-24.6 0-33.9L217.9 256z" />
                    </svg>
                </button>
                <button className="px-3 py-1 border rounded-full hover:bg-main hover:text-[#fff] bg-main text-[#fff] border-gray-600 ">
                    1
                </button>
                <button
                    className="p-1 rounded-full text-[1.7rem] hover:bg-main text-main hover:text-[#fff] disabled:opacity-50 cursor-pointer "
                    disabled={false}
                >
                    <svg
                        stroke="currentColor"
                        fill="currentColor"
                        strokeWidth={0}
                        viewBox="0 0 512 512"
                        height="1em"
                        width="1em"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M294.1 256L167 129c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.3 34 0L345 239c9.1 9.1 9.3 23.7.7 33.1L201.1 417c-4.7 4.7-10.9 7-17 7s-12.3-2.3-17-7c-9.4-9.4-9.4-24.6 0-33.9l127-127.1z" />
                    </svg>
                </button>
            </div>
        </div>

    )
}

export default page