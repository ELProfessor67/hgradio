/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useData } from "@/context/Context";
import { FetchLoading } from "@/utils/Loading";
import { useDebounce } from "use-debounce";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FiSearch } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  comment: string;
  createdAt?: string;
}

const LIMIT = 10;

const Page = () => {
  const { userData } = useData();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState("");
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }/api/contact?search=${encodeURIComponent(
          debouncedSearchQuery
        )}&page=${page}&limit=${LIMIT}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to fetch contacts");

      setContacts(data.data);
      setTotalPages(data.totalPages || 1);
      setError("");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [debouncedSearchQuery, page]);

  const handleDelete = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact/${selectedContactId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Deleted successfully",{
                style: {
                  background: "green",
                  border : "none",
                  color : "white"
                },
              });
      setSelectedContactId("");
      setShowDeleteModal(false);
      fetchContacts();
    } catch (err: unknown) {console.log(err);
      toast.error("Failed to delete",{
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
      <h2 className="text-2xl font-semibold mb-4">Contact Messages</h2>

      <div className="mb-4 relative w-full md:w-[40%]">
        <input
          type="text"
          placeholder="Search by email..."
          className="w-full pl-4 pr-10 py-2  bg-[#25233bb4] outline-none"
          value={searchQuery}
          onChange={(e) => {
            setPage(1);
            setSearchQuery(e.target.value);
          }}
        />
        <div className="absolute right-3 top-2.5 text-gray-500">
          <FiSearch />
        </div>
      </div>

      {
        error && <p className=" text-red-500 text-sm my-2 ">{error}</p>
      }

      {loading ? (
        <div className="min-h-[200px] relative">
          <FetchLoading />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto  text-white font-semibold bg-[#25233bb4]">
            <table className="min-w-full table-auto text-left text-sm">
              <thead className="bg-[#25233bb4] text-base transition border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Comment</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {contacts?.map((contact) => (
                  <tr key={contact._id} className="border-t transition-all">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {contact.firstName} {contact.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact?.comment?.length > 20 ? (
                        <>
                          {contact.comment.slice(0, 20)}...
                          <button
                            className="ml-2 text-blue-400 "
                            onClick={() => {
                              setSelectedComment(contact.comment);
                              setShowCommentModal(true);
                            }}
                          >
                            See more
                          </button>
                        </>
                      ) : (
                        contact.comment
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedContactId(contact._id);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-500 text-xl hover:text-red-700"
                        title="Delete"
                      >
                        <MdDeleteOutline />
                      </button>
                    </td>
                  </tr>
                ))}
                {!contacts?.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-6 text-gray-500 italic"
                    >
                      No contact messages found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-6 flex-wrap gap-2 text-white font-semibold">
            {/* Prev Button */}
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-gray-700 disabled:opacity-50"
            >
              Prev
            </button>

            {(() => {
              const maxVisiblePages = 5;
              let startPage = Math.max(
                1,
                page - Math.floor(maxVisiblePages / 2)
              );
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

            {/* Next Button */}
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
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50">
          <div className="bg-[#25233b] text-white p-6 rounded max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Full Comment</h3>
            <p className="whitespace-pre-wrap">{selectedComment}</p>
            <button
              className="mt-4 px-4 py-2 bg-second  text-black rounded "
              onClick={() => setShowCommentModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && selectedContactId && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={() => {
            setShowDeleteModal(false);
            setSelectedContactId("");
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#25233b] text-white p-6  max-w-sm w-full text-center"
          >
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="text-sm text-white mb-6">
              Are you sure you want to delete this contact message?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedContactId("");
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
};

export default Page;
