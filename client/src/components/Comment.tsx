"use client";

import { useState } from "react";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";
import { GoCommentDiscussion } from "react-icons/go";
import FeedbackForm from "./CommentForm";
import { CommentType } from "@/app/(user)/albums/[albumId]/page";

const formatDate = (isoString: string) => {
  const date = new Date(isoString);

  const day = date.getDate().toString().padStart(2, "0");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

const Comment = ({
  artist,
  albumId,
  comments,
  userId,
  fetchComments
}: {
  artist?: string;
  albumId?: string;
  userId?:string
  comments: CommentType[];
  fetchComments: () => Promise<void>;
}) => {
  const [showForm, setShowForm] = useState(false);

  const averageRating =
    comments.length > 0
      ? comments.reduce((acc, c) => acc + c.rating, 0) / comments.length
      : 0;

  return (
    <div className="bg-[#171D2B] pt-10">
      <div className="max-w-[1500px] px-3 mx-auto">
        <div className="w-full lg:w-[70%]">
          <div>
            <hr />
            <div className="flex py-4 justify-between items-center">
              <div className="flex items-center text-second font-medium text-lg gap-3">
                <GoCommentDiscussion size={25} />
                <p>{comments.length} Comment(s)</p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => {
                  if (i <= Math.floor(averageRating)) {
                    return <FaStar key={i} size={20} className="text-yellow-400" />;
                  } else if (
                    i === Math.floor(averageRating) + 1 &&
                    averageRating % 1 >= 0.25 &&
                    averageRating % 1 < 0.75
                  ) {
                    return <FaStarHalfAlt key={i} size={20} className="text-yellow-400" />;
                  } else if (
                    i === Math.floor(averageRating) + 1 &&
                    averageRating % 1 >= 0.75
                  ) {
                    
                    return <FaStar key={i} size={20} className="text-yellow-400" />;
                  } else {
                    return <FaRegStar key={i} size={20} className="text-gray-600" />;
                  }
                })}
              </div>
            </div>
            <hr />
          </div>

          <h2 className="text-white font-semibold py-8 text-3xl">Comments :</h2>
          <div className="space-y-8">
            {comments?.map((comment, idx) => (
              <div key={idx} className="bg-[#0B1834] p-5 flex justify-between">
                <div className="flex items-start gap-10 w-[70%]">
                  <div className="bg-second rounded-full p-4 text-black font-bold text-lg w-12 h-12 flex items-center justify-center">
                    <p>
                      {comment.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-white font-semibold">{comment.name}</h2>
                    <p className="text-gray-300">{comment.message}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  <p>{formatDate(comment.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>

          {!showForm && (
            <div className="flex justify-end lg:mr-10 py-10">
              <button
                onClick={() => setShowForm(true)}
                className="w-1/3 bg-second text-black py-3 hover:bg-opacity-90 relative hover:bg-transparent overflow-hidden font-bold text-lg p-3 group"
              >
                <span className="relative z-10">Leave Your Comment</span>
                <span className="absolute inset-0 bg-second scale-x-0 origin-center transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <FeedbackForm
          setShow={setShowForm}
          artist={artist}
          userId={userId}
          albumId={albumId}
          fetchComments={fetchComments}
        />
      )}
    </div>
  );
};

export default Comment;
