"use client";

import Breadcrum from "@/components/Breadcrum";
import { useData } from "@/context/Context";
import { FetchLoading, PageLoading } from "@/utils/Loading";
import { uploadFile, uploadVideo } from "@/utils/imageUpload";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface SongType {
  _id: string;
  name: string;
  duration: number;
  url: string;
}

interface AlbumType {
  _id: string;
  title: string;
  releaseYear: number;
  price: number;
  description: string;
  coverImg: string;
  salesCount?: number;
  totalRevenue?: number;
  songs: SongType[];
}

const Page = ({ params }: { params: { userId: string; albumId: string } }) => {
  const { userData } = useData();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [songSaving, setSongSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [songUploading, setSongUploading] = useState(false);
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);

  const [album, setAlbum] = useState<AlbumType | null>(null);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [coverImg, setCoverImg] = useState("");

  const [newSongName, setNewSongName] = useState("");
  const [newSongDuration, setNewSongDuration] = useState("");
  const [newSongUrl, setNewSongUrl] = useState("");

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    try {
      const url = await uploadFile(file);
      if (!url) {
        toast.error("Cover upload failed");
        return;
      }
      setCoverImg(url);
      toast.success("Cover uploaded", {
        style: { background: "green", border: "none", color: "white" },
      });
    } catch (e) {
      console.error("Cover upload error:", e);
      toast.error("Cover upload failed");
    } finally {
      setCoverUploading(false);
    }
  };

  const uploadSongFile = async (file: File) => {
    setSongUploading(true);
    try {
      const url = await uploadVideo(file);
      if (!url) {
        toast.error("Song upload failed");
        return;
      }
      setNewSongUrl(url);
      toast.success("Song uploaded", {
        style: { background: "green", border: "none", color: "white" },
      });
    } catch (e) {
      console.error("Song upload error:", e);
      toast.error("Song upload failed");
    } finally {
      setSongUploading(false);
    }
  };

  const totals = useMemo(() => {
    if (!album) return { sales: 0, revenue: 0 };
    return {
      sales: Number(album.salesCount || 0),
      revenue: Number(album.totalRevenue || 0),
    };
  }, [album]);

  const hydrateForm = (a: AlbumType) => {
    setTitle(a.title || "");
    setReleaseYear(String(a.releaseYear ?? ""));
    setPrice(String(a.price ?? ""));
    setDescription(a.description || "");
    setCoverImg(a.coverImg || "");
  };

  const fetchAlbum = async () => {
    if (!userData?.token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/albums/${params.albumId}/owner`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${userData.token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Failed to fetch album");
        return;
      }

      setAlbum(data?.album || null);
      setError("");
      if (data?.album) hydrateForm(data.album);
    } catch (e) {
      console.error("Fetch owned album error:", e);
      setError("Failed to fetch album");
    } finally {
      setLoading(false);
    }
  };

  const saveAlbum = async () => {
    if (!userData?.token) return;
    if (!album?._id) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/albums/${album._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
          body: JSON.stringify({
            title,
            releaseYear,
            price,
            description,
            coverImg,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to update album");
        return;
      }
      toast.success("Album updated", {
        style: { background: "green", border: "none", color: "white" },
      });
      setAlbum(data?.album || album);
    } catch (e) {
      console.error("Update album error:", e);
      toast.error("Failed to update album");
    } finally {
      setSaving(false);
    }
  };

  const addSong = async () => {
    if (!userData?.token) return;
    if (!album?._id) return;

    const duration = Number(newSongDuration);
    if (!newSongName || !newSongUrl || !Number.isFinite(duration) || duration <= 0) {
      toast.error("Enter song name, upload song file, and valid duration.");
      return;
    }

    setSongSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/albums/${album._id}/songs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userData.token}`,
          },
          body: JSON.stringify({
            name: newSongName,
            url: newSongUrl,
            duration,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to add song");
        return;
      }
      toast.success("Song added", {
        style: { background: "green", border: "none", color: "white" },
      });
      setNewSongName("");
      setNewSongDuration("");
      setNewSongUrl("");
      setAlbum(data?.album || album);
    } catch (e) {
      console.error("Add song error:", e);
      toast.error("Failed to add song");
    } finally {
      setSongSaving(false);
    }
  };

  const deleteSong = async (songId: string) => {
    if (!userData?.token) return;
    if (!album?._id) return;
    setDeletingSongId(songId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/albums/${album._id}/songs/${songId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${userData.token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "Failed to delete song");
        return;
      }
      toast.success("Song deleted", {
        style: { background: "green", border: "none", color: "white" },
      });
      setAlbum(data?.album || album);
    } catch (e) {
      console.error("Delete song error:", e);
      toast.error("Failed to delete song");
    } finally {
      setDeletingSongId(null);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    if (!userData?.token) return;
    fetchAlbum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.token, params.albumId]);

  if (!hasMounted) return <PageLoading />;

  if (!userData?.token) {
    return (
      <div className=" min-h-[100vh] ">
        <Breadcrum mainTitle="Manage Album" subTitle="Login required" />
        <div className=" max-w-[1200px] mx-auto px-3 py-8 text-white ">
          <div className=" bg-[#0b1834]/80 border border-white/10 p-4 ">
            <div className=" text-sm text-gray-200 ">
              Please login to manage your album.
            </div>
            <button
              onClick={() => router.push("/login")}
              className=" mt-3 bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out px-4 py-2 "
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" min-h-[100vh] ">
      <Breadcrum mainTitle="Manage Album" subTitle="Sales, revenue and editing" />

      <div className=" max-w-[1500px] mx-auto py-5 px-3 text-white ">
        <div className=" flex items-center justify-between gap-3 ">
          <Link
            href={`/dashboard/${params.userId}`}
            className=" text-sm underline underline-offset-4 "
          >
            Back to Dashboard
          </Link>
        </div>

        {error && <p className=" text-sm text-red-500 my-2 ">{error}</p>}

        {loading && (
          <div className=" h-[16rem] relative ">
            <FetchLoading />
          </div>
        )}

        {album && !loading && (
          <div className=" mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 ">
            <div className=" lg:col-span-1 bg-[#0b1834]/80 border border-white/10 p-4 ">
              <div className=" w-full h-[18rem] relative overflow-hidden border border-white/10 object-contain ">
                <Image
                  src={album.coverImg}
                  alt="Album cover"
                  fill
                  className=" object-contain "
                />
              </div>

              <div className=" mt-3 text-[1.4rem] font-semibold ">
                {album.title}
              </div>
              <div className=" mt-1 text-sm text-gray-200 ">
                {album.releaseYear} • ${Number(album.price || 0).toFixed(2)}
              </div>

              <div className=" mt-4 grid grid-cols-2 gap-2 ">
                <div className=" bg-black/30 border border-white/10 p-3 ">
                  <div className=" text-xs text-gray-200 ">Total Sales</div>
                  <div className=" text-[1.3rem] font-semibold ">
                    {totals.sales}
                  </div>
                </div>
                <div className=" bg-black/30 border border-white/10 p-3 ">
                  <div className=" text-xs text-gray-200 ">Total Revenue</div>
                  <div className=" text-[1.3rem] font-semibold ">
                    ${totals.revenue.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className=" mt-4 text-sm text-gray-200 whitespace-pre-line ">
                {album.description}
              </div>
            </div>

            <div className=" lg:col-span-2 space-y-4 ">
              <div className=" bg-[#0b1834]/80 border border-white/10 p-4 ">
                <div className=" text-[1.2rem] font-semibold ">
                  Edit Album Details
                </div>

                <div className=" mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 ">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className=" w-full px-3 py-2 bg-transparent border border-white/20 outline-none text-white "
                  />
                  <input
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    placeholder="Release year"
                    className=" w-full px-3 py-2 bg-transparent border border-white/20 outline-none text-white "
                  />
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Price"
                    className=" w-full px-3 py-2 bg-transparent border border-white/20 outline-none text-white "
                  />
                </div>
                <div className=" mt-3 border border-white/10 bg-black/20 p-3 ">
                  <div className=" text-sm font-medium ">Cover Image</div>
                  <div className=" mt-2 flex flex-col md:flex-row md:items-center gap-3 ">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadCover(f);
                      }}
                      className=" w-full text-sm "
                    />
                    <div className=" text-xs text-gray-200 ">
                      {coverUploading
                        ? "Uploading..."
                        : coverImg
                          ? "Uploaded"
                          : "No cover uploaded yet"}
                    </div>
                  </div>
                  {coverImg && (
                    <div className=" mt-2 text-xs text-gray-200 break-all ">
                      {coverImg}
                    </div>
                  )}
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className=" mt-3 w-full px-3 py-2 bg-transparent border border-white/20 outline-none text-white min-h-[8rem] "
                />

                <button
                  onClick={saveAlbum}
                  disabled={saving}
                  className=" mt-3 bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out px-4 py-2 disabled:opacity-60 "
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              <div className=" bg-[#0b1834]/80 border border-white/10 p-4 ">
                <div className=" flex items-center justify-between gap-3 ">
                  <div className=" text-[1.2rem] font-semibold ">Songs</div>
                  <div className=" text-sm text-gray-200 ">
                    Total: {album.songs?.length || 0}
                  </div>
                </div>

                <div className=" mt-3 space-y-2 ">
                  {(album.songs || []).map((s, idx) => (
                    <div
                      key={s._id || idx}
                      className=" flex flex-col md:flex-row md:items-center justify-between gap-3 border border-white/10 bg-black/20 p-3 "
                    >
                      <div className=" min-w-0 ">
                        <div className=" font-medium line-clamp-1 ">
                          {idx + 1}. {s.name}
                        </div>
                        <div className=" text-xs text-gray-200 break-all ">
                          {s.url}
                        </div>
                        <div className=" text-xs text-gray-200 ">
                          Duration: {Number(s.duration || 0)}s
                        </div>
                      </div>

                      <button
                        onClick={() => deleteSong(s._id)}
                        disabled={deletingSongId === s._id}
                        className=" bg-red-600 hover:bg-red-700 transition-all duration-300 ease-in-out px-3 py-2 text-sm disabled:opacity-60 "
                      >
                        {deletingSongId === s._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  ))}
                </div>

                <div className=" mt-4 border-t border-white/10 pt-4 ">
                  <div className=" text-[1.1rem] font-semibold ">
                    Add New Song
                  </div>
                  <div className=" mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 ">
                    <input
                      value={newSongName}
                      onChange={(e) => setNewSongName(e.target.value)}
                      placeholder="Song name"
                      className=" w-full px-3 py-2 bg-transparent border border-white/20 outline-none text-white "
                    />
                    <input
                      value={newSongDuration}
                      onChange={(e) => setNewSongDuration(e.target.value)}
                      placeholder="Duration (seconds)"
                      className=" w-full px-3 py-2 bg-transparent border border-white/20 outline-none text-white "
                    />
                    <div className=" border border-white/20 px-3 py-2 ">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadSongFile(f);
                        }}
                        className=" w-full text-sm "
                      />
                      <div className=" mt-1 text-xs text-gray-200 ">
                        {songUploading
                          ? "Uploading..."
                          : newSongUrl
                            ? "Uploaded"
                            : "Choose audio file"}
                      </div>
                    </div>
                  </div>
                  {newSongUrl && (
                    <div className=" mt-2 text-xs text-gray-200 break-all ">
                      Uploaded URL: {newSongUrl}
                    </div>
                  )}

                  <button
                    onClick={addSong}
                    disabled={songSaving || songUploading || !newSongUrl}
                    className=" mt-3 bg-second text-[#000] hover:bg-second/90 transition-all duration-300 ease-in-out px-4 py-2 disabled:opacity-60 "
                  >
                    {songSaving ? "Adding..." : "Add Song"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;


