"use client";

import Ads from "@/components/Ads";
import Breadcrum from "@/components/Breadcrum";
import Image from "next/image";
import Link from "next/link";
import bg2 from "@/assets/previous-show.jpg";
// import Team1 from "@/assets/Team1.png";
// import Team2 from "@/assets/Team2.jpeg";
// import Team3 from "@/assets/Team3.jpg";
// import Team4 from "@/assets/Team4.png";
import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";
import { FetchLoading } from "@/utils/Loading";

const videoAds = [
  { videoSrc: "/vid1.mp4", link: "/contact" },
  { videoSrc: "/vid2.mp4", link: "/contact" },
  { videoSrc: "/vid3.mp4", link: "/contact" },
];

// const teamItems = [
//   { img: Team1, name: "Pastor Ben Cha Me" },
//   { img: Team2, name: "Pastor J'on Harris and Voices" },
//   { img: Team3, name: "Apostle Gary L. Wyatt" },
//   { img: Team4, name: "Dr Edwards" },
// ];

interface SongType {
  name: string;
  duration: number;
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
  artist: ArtistType;
  releaseYear: number;
  price: number;
  description: string;
  coverImg: string;
  songs: SongType[];
  createdAt?: string;
  updatedAt?: string;
  artistDetails?: {
    name: string;
    profileImg: string;
  };
} 

interface FilterState {
  page: number;
  limit: number;
  totalPages: number;
  searchTerm: string;
}

const Page = () => {
  const [albums, setAlbums] = useState<AlbumType[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // All pagination & search params in one state object
  const [filter, setFilter] = useState<FilterState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    searchTerm: "",
  });

  const fetchAlbums = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.append("page", filter.page.toString());
      params.append("limit", filter.limit.toString());
      if (filter.searchTerm.trim()) {
        params.append("search", filter.searchTerm.trim());
      }

      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }/api/public/album?${params.toString()}`
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to fetch albums");
        setAlbums([]);
        setFilter((prev) => ({ ...prev, totalPages: 1 }));
      } else {
        setAlbums(data.albums || []);
        setFilter((prev) => ({ ...prev, totalPages: data.totalPages || 1 }));
        setError("");
      }
    } catch (err) {
      console.error("Fetch albums error:", err);
      setError("Failed to fetch albums.");
      setAlbums([]);
      setFilter((prev) => ({ ...prev, totalPages: 1 }));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAlbums();
  }, [filter.page, filter.searchTerm]); // fetch on page or search change

  // const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setFilter((prev) => ({
  //     ...prev,
  //     page: 1,
  //     searchTerm: e.target.value,
  //   }));
  // };

  // const handlePrevPage = () => {
  //   setFilter((prev) => ({
  //     ...prev,
  //     page: Math.max(prev.page - 1, 1),
  //   }));
  // };

  // const handleNextPage = () => {
  //   setFilter((prev) => ({
  //     ...prev,
  //     page: Math.min(prev.page + 1, prev.totalPages),
  //   }));
  // };

  return (
    <div>
      <Breadcrum mainTitle="Blast Buy Albums" subTitle="Albums" />

      <div
        className="relative z-20 min-h-screen bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${bg2.src})` }}
      >
        <div className="absolute inset-0 bg-black/60 z-[-1]" />

        <div className="max-w-[1500px] mx-auto py-5 px-3">
          <div className="relative z-10 py-3">
            <h3 className="text-2xl md:text-4xl font-bold text-[#66FCF1]">
              Search For Artist Song
            </h3>
          </div>

          <div>
            <div className="flex items-center  overflow-hidden shadow-sm">
              <input
                type="text"
                placeholder="Search for artist, song, or album"
                value={filter.searchTerm}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    searchTerm: e.target.value,
                  })
                }
                onKeyDown={fetchAlbums}
                className="w-full px-4 py-3 bg-[#222E48] text-lg text-white focus:outline-none"
              />
              <button
                onClick={fetchAlbums}
                className="h-full p-4 px-8 bg-[#66FCF1] flex items-center justify-center"
              >
                <FaSearch className="text-gray-800 text-xl" size={19} />
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 my-4">{error}</p>}
          {loading && (
            <div className=" relative h-[20rem] ">
              <FetchLoading />
            </div>
          )}

          {!loading && !error && albums.length === 0 && (
            <p className=" my-5 ">No albums found.</p>
          )}

          <div className=" mt-[4rem] grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 xl:grid-cols-4 gap-3 ">
            {albums.map((album, idx) => (
              <Link
                href={`/albums/${album._id}`}
                key={idx}
                className=" group cursor-pointer "
              >
                <div className=" w-full h-[17rem] relative overflow-hidden ">
                  <Image
                    src={album.coverImg}
                    alt="Cover img"
                    fill
                    className=" group-hover:scale-110 transition-all duration-300 ease-in-out "
                  />
                </div>
                <div className=" bg-[#0b1834] p-3 text-[#fff] ">
                  <div className="  text-[1.6rem] line-clamp-1 font-semibold  ">
                    “ {album.title} ”
                  </div>
                  <div className=" mt-3 flex items-center gap-3 ">
                    <div className=" w-[3.5rem] h-[3.5rem] rounded-full bg-second/70 relative ">
                      {album.artist?.profileImg && (
                        <img
                          src={album.artist?.profileImg}
                          loading="lazy"
                          alt="Profile Image"
                          className=" rounded-full object-cover "
                        />
                      )}
                    </div>
                    <div className=" text-xl font-medium ">{album.artist?.name}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filter.totalPages > 1 && (
            <Pagination filter={filter} setFilter={setFilter} />
          )}

          {/* Pagination Controls */}
          {/* <div className="flex justify-center items-center gap-4 mt-6 text-[#fff] ">
              <button
                onClick={handlePrevPage}
                disabled={filter.page === 1}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Prev
              </button>

              <span>
                Page {filter.page} of {filter.totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={filter.page === filter.totalPages}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div> */}
        </div>
      </div>

      <Ads items={videoAds} />
    </div>
  );
};

export default Page;

const Pagination = ({
  filter,
  setFilter,
}: {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
}) => {
  const { page, totalPages } = filter;

  // Calculate the page numbers to show, max 3, centered on current page
  const getPageNumbers = () => {
    let start = Math.max(page - 1, 1);
    const end = Math.min(start + 2, totalPages);

    // Adjust start if less than 3 pages available at the end
    if (end - start < 2) {
      start = Math.max(end - 2, 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const goToPage = (pageNum: number) => {
    setFilter((prev) => ({ ...prev, page: pageNum }));
  };

  const handlePrev = () => {
    if (page > 1) goToPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) goToPage(page + 1);
  };

  return (
    <div className="flex justify-center items-center gap-3 mt-6 text-[#fff] select-none">
      {/* Left arrow */}
      <button
        onClick={handlePrev}
        disabled={page === 1}
        className="p-2 rounded hover:bg-gray-700 disabled:opacity-50"
        aria-label="Previous page"
      >
        <FaChevronLeft />
      </button>

      {/* Page numbers */}
      {pageNumbers.map((num) => (
        <button
          key={num}
          onClick={() => goToPage(num)}
          className={`px-3 py-1 rounded ${
            num === page
              ? "bg-second font-bold text-white"
              : "hover:bg-gray-700"
          }`}
          aria-current={num === page ? "page" : undefined}
        >
          {num}
        </button>
      ))}

      {/* Right arrow */}
      <button
        onClick={handleNext}
        disabled={page === totalPages}
        className="p-2 rounded hover:bg-gray-700 disabled:opacity-50"
        aria-label="Next page"
      >
        <FaChevronRight />
      </button>
    </div>
  );
};
