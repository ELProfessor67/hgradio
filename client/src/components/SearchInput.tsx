"use client";
import React, { useState, KeyboardEvent } from "react";
import { FaSearch } from "react-icons/fa";

const SearchInput = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSearch = () => {
    if (searchTerm.trim() === "") return;
    console.log("Searching for:", searchTerm);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div>
      <div className="flex items-center  overflow-hidden shadow-sm">
        <input
          type="text"
          placeholder="Search for artist, song, or album"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 bg-[#222E48] text-lg text-white focus:outline-none"
        />
        <button
          onClick={handleSearch}
          className="h-full p-4 px-8 bg-[#66FCF1] flex items-center justify-center"
        >
          <FaSearch className="text-black text-xl" size={20} />
        </button>
      </div>
    </div>
  );
};

export default SearchInput;
