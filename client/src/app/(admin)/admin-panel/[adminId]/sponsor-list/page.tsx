/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { MdDeleteOutline } from "react-icons/md";

interface Sponsor {
  _id: string;
  name: string;
  organization?: string;
  email: string;
  phone?: string;
  sponsorType: "program" | "individual";
  sponsorTarget: string;
  method: "prayer" | "gift" | "other";
  amount?: number;
  otherText?: string;
  comment?: string;
  createdAt?: string;
}

const LIMIT = 10;

export default function SponsorTable() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [selectedComment, setSelectedComment] = useState("");
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedSponsorId, setSelectedSponsorId] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search query (simple implementation)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }/api/sponsor?search=${encodeURIComponent(
          debouncedSearchQuery
        )}&page=${page}&limit=${LIMIT}`
      );

      setSponsors(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to fetch sponsors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, [debouncedSearchQuery, page]);

  const handleDelete = async () => {
    try {
      await axios.delete(`${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }/api/sponsor/${selectedSponsorId}`);
      toast.success("Sponsor deleted successfully",{
                style: {
                  background: "green",
                  border : "none",
                  color : "white"
                },
              });
      setShowDeleteModal(false);
      setSelectedSponsorId("");
      fetchSponsors();
    } catch (err: unknown) {
      console.log(err);
      toast.error("Failed to delete sponsor",{
                style: {
                  background: "red",
                  border : "none",
                  color : "white"
                },
              });
    }
  };

  const handlePrev = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Sponsors</h2>

      <div className="mb-4 relative w-full md:w-[40%]">
        <input
          type="text"
          placeholder="Search by email..."
          className="w-full pl-4 pr-10 py-2  bg-[#25233bb4] outline-none text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center text-white font-semibold">
          Loading sponsors...
        </div>
      ) : error ? (
        <div className="min-h-[200px] flex items-center justify-center text-red-500 font-semibold">
          {error}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto  text-white font-semibold bg-[#25233bb4]">
            <table className="min-w-full table-auto text-left text-sm">
              <thead className="bg-[#25233bb4] text-base border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Organization</th>
                  <th className="px-6 py-3">Sponsor Type</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Comment</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-gray-400 italic">
                      No sponsors found.
                    </td>
                  </tr>
                ) : (
                  sponsors.map((sponsor) => (
                    <tr key={sponsor._id} className="border-t">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {sponsor.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{sponsor.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sponsor.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sponsor.organization || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"> {sponsor.sponsorType.charAt(0).toUpperCase() + sponsor.sponsorType.slice(1)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{sponsor.sponsorTarget.charAt(0).toUpperCase() + sponsor.sponsorType.slice(1)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full  ${
                            sponsor.method === "gift"
                              ? "bg-green-200 text-green-800"
                              : sponsor.method === "prayer"
                              ? "bg-blue-200 text-blue-800"
                              : "bg-yellow-200 text-yellow-800"
                          }`}
                        >
                          {sponsor.method.charAt(0).toUpperCase() + sponsor.sponsorType.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sponsor.amount ? `$${sponsor.amount}` : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap max-w-xs">
                        {sponsor.comment && sponsor.comment.length > 20 ? (
                          <>
                            {sponsor.comment.slice(0, 20)}...
                            <button
                              className="ml-2 text-blue-400"
                              onClick={() => {
                                setSelectedComment(sponsor.comment || "");
                                setShowCommentModal(true);
                              }}
                            >
                              See more
                            </button>
                          </>
                        ) : (
                          sponsor.comment || "None"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedSponsorId(sponsor._id);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-500 text-xl hover:text-red-700"
                          title="Delete"
                        >
                          <MdDeleteOutline />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-6 flex-wrap gap-2 text-white font-semibold">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50"
            >
              Prev
            </button>

            {(() => {
              const maxVisiblePages = 5;
              let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
              let endPage = startPage + maxVisiblePages - 1;
              if (endPage > totalPages) {
                endPage = totalPages;
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }
              return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                const pageNumber = startPage + i;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`px-3 py-1 rounded ${
                      page === pageNumber
                        ? "bg-second text-gray-600"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              });
            })()}

            <button
              onClick={handleNext}
              disabled={page === totalPages}
              className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#25233b] text-white p-6 rounded max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Full Comment</h3>
            <p className="whitespace-pre-wrap">{selectedComment}</p>
            <button
              className="mt-4 px-4 py-2 bg-second text-black rounded"
              onClick={() => setShowCommentModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSponsorId && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => {
            setShowDeleteModal(false);
            setSelectedSponsorId("");
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#25233b] text-white p-6  max-w-sm w-full text-center"
          >
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="text-sm text-white mb-6">
              Are you sure you want to delete this sponsor?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSponsorId("");
                }}
                className="px-4 py-2 border  text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white "
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
