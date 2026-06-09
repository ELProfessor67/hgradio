"use client";

import { useData } from "@/context/Context";
import { FetchLoading } from "@/utils/Loading";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MdDeleteOutline } from "react-icons/md";

interface Testimonial {
  _id: string;
  name: string;
  designation: string;
  message: string;
  img: string;
}

const Page = () => {
  const { userData } = useData();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [message, setMessage] = useState("");
  const [img, setImg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/testimonials?limit=50`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch");
      setTestimonials(data.testimonials);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch testimonials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

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
              <label className="block mb-1 text-sm text-gray-300">Image URL</label>
              <input type="text" value={img} onChange={e => setImg(e.target.value)} placeholder="https://example.com/avatar.jpg" className="w-full px-3 py-2 bg-[#1b192e] outline-none text-white" />
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
      <h3 className="text-xl font-semibold mb-4 text-second">Existing Testimonials</h3>
      {loading ? (
        <div className="min-h-[200px] relative"><FetchLoading /></div>
      ) : testimonials.length === 0 ? (
        <p className="text-gray-400">No testimonials found.</p>
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
