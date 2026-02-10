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
import { useData } from "@/context/Context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const videoAds = [
  { videoSrc: "/vid1.mp4", link: "/contact" },
  { videoSrc: "/vid2.mp4", link: "/contact" },
  { videoSrc: "/vid3.mp4", link: "/contact" },
];

interface SongType {
  _id: string;
  name: string;
  duration: string;
  url: string;
  views?: number;
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
  const { userData } = useData();
  const router = useRouter();
  const [comments, setComments] = useState<CommentType[] | []>([]);
  const [album, setAlbum] = useState<AlbumType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellSongName, setUpsellSongName] = useState<string>("");
  const currentlyPlayingAudioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    const checkPurchase = async () => {
      if (!albumId) return;
      if (!userData?.token) {
        setIsPurchased(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/albums/${albumId}/purchase-status`,
          {
            headers: {
              Authorization: `Bearer ${userData.token}`,
            },
          }
        );
        const data = await res.json();
        if (res.ok) setIsPurchased(Boolean(data?.purchased));
        else setIsPurchased(false);
      } catch {
        setIsPurchased(false);
      }
    };

    checkPurchase();
  }, [albumId, userData?.token]);

  useEffect(() => {
    if (isPurchased) setShowUpsell(false);
  }, [isPurchased]);
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

  const handleBuyAlbum = () => {
    if (!userData?._id || !userData?.token) {
      toast.error("Please login to purchase this album.", {
        style: { background: "red", border: "none", color: "white" },
      });
      router.push("/login");
      return;
    }

    router.push(`/payment?albumId=${albumId}`);
  };

  const handlePreviewEnded = (songName?: string) => {
    if (isPurchased) return;
    setUpsellSongName(songName || "");
    setShowUpsell(true);
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

  if (error) {
    return <div>{error}</div>
  }

  if (loading) {
    return <PageLoading />
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
                  onClick={handleBuyAlbum}
                  className=" w-[13rem] bg-[#ff9743] py-2 text-[#fff] flex items-center justify-center gap-2 hover:bg-[#e8863a] transition-colors"
                >
                  <LuShoppingCart />
                  <span>{isPurchased ? "Purchased" : "Buy Album Now"}</span>
                </button>
                <Link
                  href={`/donate`}
                  className=" w-[13rem] bg-[#139ff2] py-2 text-[#fff] flex items-center justify-center gap-2 "
                >
                  <FaGift />
                  <span>Share Love Gift</span>
                </Link>
                <Link
                  href={`/albums/sell-album`}
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
                  <div>
                    {isPurchased
                      ? formatDuration(Number(song.duration))
                      : formatDuration(60)}
                  </div>
                </div>

                <SongPlayerRow
                  songUrl={song.url}
                  songId={song._id}
                  albumId={albumId}
                  isPurchased={isPurchased}
                  onPreviewEnded={() => handlePreviewEnded(song.name)}
                  currentlyPlayingAudioRef={currentlyPlayingAudioRef}
                />
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

      {/* Upsell popup when preview ends */}
      {showUpsell && !isPurchased && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-lg bg-[#0B1834] p-6 text-white shadow-xl border border-white/10">
            <h3 className="text-xl font-semibold mb-2">
              Listen to the full song
            </h3>
            <p className="text-gray-300">
              {upsellSongName
                ? `Preview ended for "${upsellSongName}".`
                : "Preview ended."}{" "}
              To listen to the full song, please buy this album.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setShowUpsell(false)}
                className="px-4 py-2 rounded bg-white/10 hover:bg-white/15 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpsell(false);
                  handleBuyAlbum();
                }}
                className="px-4 py-2 rounded bg-second text-black font-semibold hover:bg-second/90 transition-colors"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;

interface SongPlayerRowProps {
  songUrl: string;
  songId: string;
  albumId: string;
  isPurchased: boolean;
  onPreviewEnded?: () => void;
  currentlyPlayingAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

const SongPlayerRow: React.FC<SongPlayerRowProps> = ({
  songUrl,
  songId,
  albumId,
  isPurchased,
  onPreviewEnded,
  currentlyPlayingAudioRef,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // percentage
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const maxPlayTimeRef = useRef(0);
  const previewPromptedRef = useRef(false);
  const viewIncrementedRef = useRef(false);

  // Function to increment song view
  const incrementSongView = async () => {
    if (viewIncrementedRef.current) return; // Only increment once per component mount

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/album/${albumId}/song/${songId}/view`,
        { method: 'POST' }
      );
      viewIncrementedRef.current = true;
    } catch (error) {
      console.error('Failed to increment view:', error);
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;

    const d = audioRef.current.duration;
    if (isPurchased && Number.isFinite(d) && d > 0) {
      maxPlayTimeRef.current = d;
      previewPromptedRef.current = false;
      return;
    }

    if (!isPurchased) {
      maxPlayTimeRef.current = 60;
      if (audioRef.current.currentTime > 60) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setProgress(0);
      }
    }
  }, [isPurchased]);

  const handlePlayPause = () => {
    if (!audioRef.current) {
      // Stop any currently playing audio from other SongPlayerRow instances
      if (currentlyPlayingAudioRef.current && currentlyPlayingAudioRef.current !== audioRef.current) {
        currentlyPlayingAudioRef.current.pause();
        currentlyPlayingAudioRef.current.currentTime = 0;
      }

      const audio = new Audio(songUrl);
      audioRef.current = audio;
      previewPromptedRef.current = false;

      audio.addEventListener("loadedmetadata", () => {
        maxPlayTimeRef.current = isPurchased ? audio.duration : 60; // 60s preview unless purchased
      });

      audio.addEventListener("timeupdate", () => {
        if (!audio.duration) return;
        if (maxPlayTimeRef.current === 0) return;

        if (audio.currentTime >= maxPlayTimeRef.current) {
          audio.pause();
          audio.currentTime = 0;
          setIsPlaying(false);
          setProgress(0);
          if (!isPurchased && !previewPromptedRef.current) {
            previewPromptedRef.current = true;
            onPreviewEnded?.();
          }
          return;
        }

        setProgress((audio.currentTime / maxPlayTimeRef.current) * 100);
      });

      audio.addEventListener("play", () => {
        setIsPlaying(true);
        incrementSongView(); // Increment view when song starts playing
      });
      audio.addEventListener("pause", () => setIsPlaying(false));
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
      });

      // Set this audio as the currently playing one
      currentlyPlayingAudioRef.current = audio;
    } else {
      // If clicking play on a different song while another is playing
      if (currentlyPlayingAudioRef.current && currentlyPlayingAudioRef.current !== audioRef.current) {
        currentlyPlayingAudioRef.current.pause();
        currentlyPlayingAudioRef.current.currentTime = 0;
      }

      // Set this audio as the currently playing one
      currentlyPlayingAudioRef.current = audioRef.current;
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
