/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Breadcrum from "@/components/Breadcrum";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { FaCalendarAlt, FaGift, FaMusic, FaUser } from "react-icons/fa";
import { FiDollarSign } from "react-icons/fi";
import { LuPause, LuPlay, LuShoppingCart } from "react-icons/lu";
import bglefttop from "@/assets/left-plus.png";
import bgrighttop from "@/assets/about-circle2.png";
import SongNumber from "@/assets/SongNumber.jpg";
import Comment from "@/components/Comment";
import Ads from "@/components/Ads";
import { PageLoading } from "@/utils/Loading";
import BuyAlbumForm from "@/components/BuyAlbumForm";

 const videoAds = [
    { videoSrc: "/vid1.mp4", link: "/contact" },
    { videoSrc: "/vid2.mp4", link: "/contact" },
    { videoSrc: "/vid3.mp4", link: "/contact" },
  ];

interface SongType {
  name: string;
  duration: string;
  url: string;
}

interface ArtistType {
  _id: string;
  name: string;
  profileImg: string;
}

interface AlbumType {
  _id: string;
  title: string;
  description: string;
  coverImg: string;
  price: number;
  releaseYear: number;
  artist: ArtistType;
  songs: SongType[];
}

interface PageProps {
  params: Promise<{
    albumId: string;
  }>;
}

export type CommentType = {
  name: string;
  email: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  message: string;
  rating: number;
  createdAt: string;
};

const Page: React.FC<PageProps> = ({ params }) => {
  const { albumId } = React.use(params);
  const [comments, setComments] = useState<CommentType[] | []>([]);
  const [album, setAlbum] = useState<AlbumType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuyForm, setShowBuyForm] = useState(false);

  const fetchAlbum = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/album/${albumId}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch album");
      }

      setAlbum(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/comment/${albumId}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch comments");
      }

      setComments(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (albumId) {
      fetchAlbum();
      fetchComments();
    }
  }, [albumId]);
  const formatDuration = (duration: number) => {
    const totalSeconds = Math.floor(duration); // remove decimals
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
    } else {
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }
  };

  const handleBuyAlbum = (userData: any) => {
    // Navigate to payment page with user data
    const queryParams = new URLSearchParams({
      albumTitle: album?.title || "",
      albumPrice: album?.price?.toString() || "0",
      userData: encodeURIComponent(JSON.stringify(userData)),
    });
    
    window.location.href = `/payment?${queryParams.toString()}`;
  };

  // const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  // const [progress, setProgress] = useState(0);
  // const audioRef = useRef<HTMLAudioElement | null>(null);

  // const handlePlay = (songUrl: string, index: number) => {
  //   if (currentSongIndex === index && audioRef.current) {
  //     if (audioRef.current.paused) {
  //       audioRef.current.play();
  //     } else {
  //       audioRef.current.pause();
  //     }
  //     return;
  //   }

  //   if (audioRef.current) {
  //     audioRef.current.pause();
  //   }

  //   const audio = new Audio(songUrl);
  //   audioRef.current = audio;
  //   setCurrentSongIndex(index);
  //   setProgress(0);

  //   audio.addEventListener("timeupdate", () => {
  //     if (audio.duration) {
  //       setProgress((audio.currentTime / audio.duration) * 100);
  //     }
  //   });

  //   audio.play();
  // };

  // console.log(album);

  if(error){
    return<div>{error}</div>
  }

  if(loading){
    return<PageLoading />
  }

  return (
    <div>
      <Breadcrum mainTitle="View Album" subTitle={`Albums - ${album?.title}`} />

      <div className=" bg-[#071022] py-[5rem] ">
        <div className=" max-w-[1300px] mx-auto px-3 flex lg:flex-row flex-col gap-5 xl:gap-10 ">
          <div className=" relative w-auto lg:w-[40%] h-[25rem] ">
            {album?.coverImg ? (
              <Image
                src={album.coverImg}
                fill
                alt="Album Cover Image"
                className=" object-contain "
              />
            ) : null}
          </div>

          <div className=" w-full lg:w-[60%] text-[#fff] space-y-[1rem] ">
            <div className=" bg-[#0b1834] p-[1.5rem] flex items-center justify-between sm:flex-row flex-col gap-5 ">
              <div>
                <h3 className=" text-[1.7rem] font-medium leading-tight ">
                  Born to Worship
                </h3>
                <div className=" mt-[2rem] space-y-2 text-[1.2rem] ">
                  <div className=" flex items-center gap-3  ">
                    <FaUser className=" text-second " />
                    <div className=" text-gray-300 ">Artist: {album?.artist.name}</div>
                  </div>
                  <div className=" flex items-center gap-3 ">
                    <FaCalendarAlt className=" text-second " />
                    <div className=" text-gray-300 ">
                      Release Year : {album?.releaseYear}
                    </div>
                  </div>
                  <div className=" flex items-center gap-3 ">
                    <FiDollarSign className=" text-second " />
                    <div className=" text-gray-300 ">
                      Price : {album?.price}
                    </div>
                  </div>
                </div>
              </div>

              <div className=" space-y-2 text-[1.1rem] ">
                <button
                  onClick={() => setShowBuyForm(true)}
                  className=" w-[13rem] bg-[#ff9743] py-2 text-[#fff] flex items-center justify-center gap-2 hover:bg-[#e8863a] transition-colors"
                >
                  <LuShoppingCart />
                  <span>Buy Album Now</span>
                </button>
                <Link
                  href={`#`}
                  className=" w-[13rem] bg-[#139ff2] py-2 text-[#fff] flex items-center justify-center gap-2 "
                >
                  <FaGift />
                  <span>Share Love Gift</span>
                </Link>
                <Link
                  href={`#`}
                  className=" w-[13rem] bg-[#28c76f] py-2 text-[#fff] flex items-center justify-center gap-2 "
                >
                  <FaMusic />
                  <span>Sell Album</span>
                </Link>
              </div>
            </div>

            <div className=" bg-[#0b1834] p-[1.5rem] space-y-[1rem] ">
              <h3 className=" text-[1.7rem] font-medium leading-tight ">
                Details
              </h3>
              <p>{album?.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative bg-[#0c1c3d] z-20 text-white min-h-screen py-10 overflow-hidden">
        <Image
          src={bglefttop}
          alt="corner"
          className="absolute top-8 left-8  "
        />
        <Image
          src={bgrighttop}
          alt="corner"
          className="absolute -top-[10%] -right-[25%] md:-top-[15%] md:-right-[18%] lg:-top-[28%] lg:-right-[14%] w-[200px] md:w-[300px] lg:w-[577px] z-[-1]"
          style={{ animation: "spin 10s linear infinite" }}
        />

        <div className=" text-center ">
          <h2 className=" text-[2rem] font-semibold text-[#fff] ">
            Music in this album
          </h2>
          <h3 className=" text-[1.4rem] font-semibold text-second ">
            Purchase full length album for your enjoyment.
          </h3>
        </div>

        <div className=" max-w-[1300px] mx-auto px-3 mt-[8rem] space-y-4 ">
          {album?.songs.map((song, idx) => (
            <div key={idx} className=" flex items-center gap-8  ">
              <div className=" w-[4.5rem] h-[4.5rem] relative sm:flex hidden ">
                <div className=" absolute top-0 left-0 w-full h-full bg-[#000]/30 z-30 flex items-center justify-center text-second text-[1.4rem] font-medium ">
                  {idx + 1}
                </div>
                <Image
                  src={SongNumber}
                  alt="Song index Img"
                  fill
                  className=" object-cover "
                />
              </div>

              <div className=" space-y-2 w-full ">
                <div className=" flex items-center justify-between gap-3 w-full ">
                  <div className=" flex items-center gap-2 md:gap-5 ">
                    <div className=" text-[1.2rem] line-clamp-1 ">
                      &quot;{song.name}&quot;
                    </div>
                    <div className=" px-4 py-[2px] text-sm text-second bg-second/10 rounded-full ">
                      Sample
                    </div>
                  </div>
                  <div>{formatDuration(Number(song.duration) / 2)}</div>
                </div>

                <SongPlayerRow songUrl={song.url} index={idx} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {album && (
        <Comment
          comments={comments}
          artist={album.artist._id}
          albumId={album._id}
          fetchComments={fetchComments}
        />
      )}
      <Ads items={videoAds} />
      
      {/* Buy Album Form Modal */}
      {album && (
        <BuyAlbumForm
          isOpen={showBuyForm}
          onClose={() => setShowBuyForm(false)}
          albumTitle={album.title}
          albumPrice={album.price}
          onSubmit={handleBuyAlbum}
        />
      )}
    </div>
  );
};

export default Page;

interface SongPlayerRowProps {
  songUrl: string;
  index: number;
}

const SongPlayerRow: React.FC<SongPlayerRowProps> = ({ songUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // percentage
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const maxPlayTimeRef = useRef(0);

  const handlePlayPause = () => {
    if (!audioRef.current) {
      const audio = new Audio(songUrl);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        // maxPlayTimeRef.current = audio.duration * 0.5;
        maxPlayTimeRef.current = 45; // 45 seconds
      });

      audio.addEventListener("timeupdate", () => {
        if (!audio.duration) return;
        if (maxPlayTimeRef.current === 0) return;

        if (audio.currentTime >= maxPlayTimeRef.current) {
          audio.pause();
          audio.currentTime = 0;
          setIsPlaying(false);
          setProgress(0);
          return;
        }

        setProgress((audio.currentTime / maxPlayTimeRef.current) * 100);
      });

      audio.addEventListener("play", () => setIsPlaying(true));
      audio.addEventListener("pause", () => setIsPlaying(false));
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
      });
    }

    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || maxPlayTimeRef.current === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    audioRef.current.currentTime = percent * maxPlayTimeRef.current;
    setProgress(percent * 100);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-14 pl-6">
      <div
        onClick={handlePlayPause}
        className="p-1 text-[1.2rem] cursor-pointer rounded-full border-2"
      >
        {isPlaying ? <LuPause /> : <LuPlay />}
      </div>

      <div
        className="w-full h-[6px] bg-second/30 overflow-hidden cursor-pointer"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-second transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
