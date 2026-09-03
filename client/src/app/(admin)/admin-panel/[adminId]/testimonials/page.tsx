/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useData } from "@/context/Context";
import { FetchLoading } from "@/utils/Loading";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MdDeleteOutline } from "react-icons/md";
import { uploadFile } from "@/utils/imageUpload";

interface Testimonial {
  _id: string;
  name: string;
  designation: string;
  message: string;
  img: string;
  approved?: boolean;
  source?: "admin" | "guestbook";
  email?: string;
  createdAt?: string;
}

/** A [TESTIMONY] entry sitting in the Contact collection. */
interface SubmittedTestimony {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  comment: string;
  createdAt?: string;
}

const Page = () => {
  const { userData } = useData();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [submitted, setSubmitted] = useState<SubmittedTestimony[]>([]);
  // Unapproved testimonial records plus testimonies still sitting in Contact
  const awaitingCount = pendingCount + submitted.length;
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [view, setView] = useState<"all" | "pending">("all");
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [message, setMessage] = useState("");
  const [img, setImg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* Upload to Cloudinary so the homepage can render it — next/image only loads
     hosts allowlisted in next.config.ts, and res.cloudinary.com is the one. */
  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (!url) throw new Error("Upload failed");
      setImg(url);
      toast.success("Image uploaded", { style: { background: "green", color: "white" } });
    } catch (err: any) {
      toast.error(err.message || "Image upload failed", { style: { background: "red", color: "white" } });
    } finally {
      setUploading(false);
    }
  };

  /* The admin list must come from the admin endpoint — the public one hides
     entries awaiting approval, which are exactly the ones needing attention. */
  /*
    Testimonies submitted from the mobile app land in Contact, tagged with a
    "[TESTIMONY]" prefix on the first line — there is no separate collection for
    them. Pulled in here so they are reviewable alongside real testimonials, and
    can be published to the site with one click.
  */
  const fetchSubmitted = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact?type=testimony&limit=50`
      );
      const data = await res.json();
      if (res.ok) setSubmitted(data.data || []);
    } catch { /* section just stays empty */ }
  }, []);

  /* "[TESTIMONY]\nFrom: Bay area USA\n\n<body>" -> its parts */
  const parseSubmitted = (comment: string) => {
    const lines = (comment || "").split("\n");
    const fromLine = lines.find(l => l.trim().toLowerCase().startsWith("from:"));
    const location = fromLine ? fromLine.replace(/^\s*from:\s*/i, "").trim() : "";
    const body = lines
      .filter(l => !/^\s*\[[^\]]+\]\s*$/.test(l) && l !== fromLine)
      .join("\n")
      .trim();
    return { location, body };
  };

  /*
    Approving a submitted testimony copies it into the Testimonial collection and
    removes the original contact row — otherwise it would sit in this queue for
    ever, since a Contact record has no "handled" flag to set. Nothing is lost:
    the name, location, message and sender email all carry across.
    Both calls reuse endpoints that already existed.
  */
  const publishSubmitted = async (c: SubmittedTestimony) => {
    const { location, body } = parseSubmitted(c.comment);
    setPublishingId(c._id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/testimonials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userData?.token}`,
        },
        body: JSON.stringify({
          name: `${c.firstName} ${c.lastName}`.trim(),
          designation: location,
          message: body,
          email: c.email,
          source: "app",
          img: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Clear it from the queue. If this fails the testimonial is still published,
      // so say so rather than implying the whole thing failed.
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact/${c._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${userData?.token}` },
        });
      } catch {
        toast.error("Published, but the original message could not be cleared", {
          style: { background: "red", color: "white" },
        });
      }

      setSubmitted(prev => prev.filter(x => x._id !== c._id));
      toast.success("Approved — it is now on the website", { style: { background: "green", color: "white" } });
      fetchTestimonials();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve", { style: { background: "red", color: "white" } });
    } finally {
      setPublishingId(null);
    }
  };

  const fetchTestimonials = useCallback(async () => {
    if (!userData?.token) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/testimonials?limit=50&view=${view}`,
        { headers: { Authorization: `Bearer ${userData.token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch");
      setTestimonials(data.testimonials || []);
      setPendingCount(data.pendingCount ?? 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch testimonials");
    } finally {
      setLoading(false);
    }
  }, [userData?.token, view]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  useEffect(() => {
    fetchSubmitted();
  }, [fetchSubmitted]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/testimonials/${id}/approve`,
        { method: "PATCH", headers: { Authorization: `Bearer ${userData?.token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Testimonial approved — it is now live", { style: { background: "green", color: "white" } });
      fetchTestimonials();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve", { style: { background: "red", color: "white" } });
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) {
      toast.error("Name and Message are required");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/testimonials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userData?.token}`,
        },
        body: JSON.stringify({ name, designation, message, img }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Testimonial added successfully", { style: { background: "green", color: "white" } });
      setName("");
      setDesignation("");
      setMessage("");
      setImg("");
      fetchTestimonials();
    } catch (err: any) {
      toast.error(err.message || "Failed to add testimonial", { style: { background: "red", color: "white" } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/testimonials/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userData?.token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Deleted successfully", { style: { background: "green", color: "white" } });
      fetchTestimonials();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete", { style: { background: "red", color: "white" } });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Manage Testimonials</h2>

      {/* Add Form */}
      <div className="bg-[#25233bb4] p-6 mb-8 text-white">
        <h3 className="text-xl font-semibold mb-4 text-second">Add New Testimonial</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm text-gray-300">Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 bg-[#1b192e] outline-none text-white" />
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-300">Designation</label>
              <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} className="w-full px-3 py-2 bg-[#1b192e] outline-none text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm text-gray-300">Photo</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer bg-[#1b192e] border border-white/10 px-4 py-2 text-sm hover:bg-[#232042] transition whitespace-nowrap">
                  {uploading ? "Uploading…" : "Choose image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleImagePick}
                  />
                </label>
                {img && (
                  <>
                    {/* plain img, not next/image — this is a preview of a URL that
                        may not be on an allowed host until it has been uploaded */}
                    <img src={img} alt="Preview" className="w-12 h-12 rounded-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImg("")}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
              <input
                type="text"
                value={img}
                onChange={e => setImg(e.target.value)}
                placeholder="…or paste an image URL"
                className="w-full mt-2 px-3 py-2 bg-[#1b192e] outline-none text-white text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Uploading is recommended. A pasted URL only displays on the homepage if its
                domain is allowed in next.config.ts — currently just res.cloudinary.com.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm text-gray-300">Message *</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} className="w-full px-3 py-2 bg-[#1b192e] outline-none text-white"></textarea>
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="bg-second text-black px-6 py-2 font-semibold disabled:opacity-50 hover:bg-second/80 transition">
            {isSubmitting ? "Adding..." : "Add Testimonial"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="text-xl font-semibold text-second">Existing Testimonials</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setView("all")}
            className={`px-3.5 py-1.5 text-sm font-medium border transition-all ${
              view === "all"
                ? "bg-second/15 border-second/40 text-second"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setView("pending")}
            className={`px-3.5 py-1.5 text-sm font-medium border transition-all ${
              view === "pending"
                ? "bg-amber-500/15 border-amber-400/40 text-amber-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            Awaiting approval{awaitingCount > 0 ? ` (${awaitingCount})` : ""}
          </button>
        </div>
      </div>

      {awaitingCount > 0 && view === "all" && (
        <button
          onClick={() => setView("pending")}
          className="w-full mb-4 flex items-center justify-between px-4 py-3 bg-amber-500/10 border border-amber-400/25 text-amber-300 text-sm font-medium hover:bg-amber-500/15 transition-all"
        >
          <span>
            {awaitingCount} {awaitingCount === 1 ? "testimony is" : "testimonies are"} waiting for your approval
          </span>
          <span>&rarr;</span>
        </button>
      )}
      {/* App testimonies awaiting approval — they live in Contact until approved */}
      {view === "pending" && submitted.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {submitted.map(c => {
            const { location, body } = parseSubmitted(c.comment);
            return (
              <div key={c._id} className="bg-[#25233bb4] p-4 text-white border-l-2 border-amber-400/40">
                <div className="font-semibold">{c.firstName} {c.lastName}</div>
                <div className="text-xs text-gray-400">
                  {location || "—"}
                  {c.createdAt ? ` · ${new Date(c.createdAt).toLocaleDateString()}` : ""}
                </div>
                <p className="text-sm text-gray-300 mt-2 whitespace-pre-line line-clamp-5">{body}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-amber-500/15 border border-amber-400/30 text-amber-300">
                    From the app
                  </span>
                  <button
                    onClick={() => publishSubmitted(c)}
                    disabled={publishingId === c._id}
                    className="text-xs font-semibold px-3 py-1 bg-green-500/15 border border-green-400/30 text-green-300 hover:bg-green-500/25 disabled:opacity-50 transition"
                  >
                    {publishingId === c._id ? "Approving…" : "Approve & publish"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="min-h-[200px] relative"><FetchLoading /></div>
      ) : testimonials.length === 0 ? (
        view === "pending" && submitted.length > 0 ? null : (
          <p className="text-gray-400">
            {view === "pending" ? "Nothing is waiting for approval." : "No testimonials found."}
          </p>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map(t => (
            <div key={t._id} className="bg-[#25233bb4] p-4 text-white relative">
              <div className="flex gap-3 mb-3">
                {t.img ? (
                  <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center font-bold">{t.name[0]}</div>
                )}
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.designation}</div>
                </div>
              </div>
              <p className="text-sm text-gray-300 line-clamp-3">{t.message}</p>

              {t.approved === false && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-amber-500/15 border border-amber-400/30 text-amber-300">
                    Awaiting approval
                  </span>
                  <button
                    onClick={() => handleApprove(t._id)}
                    className="text-xs font-semibold px-3 py-1 bg-green-500/15 border border-green-400/30 text-green-300 hover:bg-green-500/25 transition"
                  >
                    Approve &amp; publish
                  </button>
                </div>
              )}

              {t.source === "guestbook" && t.email && (
                <div className="mt-2 text-[11px] text-gray-500">{t.email}</div>
              )}

              <button onClick={() => handleDelete(t._id)} className="absolute top-4 right-4 text-red-500 hover:text-red-400 text-xl">
                <MdDeleteOutline />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
