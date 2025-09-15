/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import bg1 from "@/assets/sponsor.jpg";
import { FaStar, FaMinusCircle } from "react-icons/fa";
import { toast } from "sonner";
import { ButtonLoading } from "@/utils/Loading";

type InputField = {
  name: keyof typeof formDataInit;
  placeholder: string;
  type: string;
};

const chunk = <T,>(array: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );

const formDataInit = {
  name: "",
  email: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
  message: "",
};

const FeedbackForm = ({
  setShow,
  artist,
  albumId,
  fetchComments,
  userId,
}: {
  setShow: (show: boolean) => void;
  artist?: string;
  userId?: string;
  albumId?: string;
  fetchComments: () => Promise<void>;
}) => {
  const [formData, setFormData] = useState({ ...formDataInit });
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const inputFields: InputField[] = [
    { name: "name", placeholder: "Full Name*", type: "text" },
    { name: "email", placeholder: "Your email*", type: "email" },
    { name: "city", placeholder: "Your city*", type: "text" },
    { name: "state", placeholder: "Your state*", type: "text" },
    { name: "zipCode", placeholder: "Your zip*", type: "text" },
    { name: "country", placeholder: "Your country*", type: "text" },
  ];

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Full Name is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = "Invalid email format.";
    }
    if (!formData.city.trim()) newErrors.city = "City is required.";
    if (!formData.state.trim()) newErrors.state = "State is required.";
    if (!formData.country.trim()) newErrors.country = "Country is required.";
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "ZIP code is required.";
    } else if (!/^\d{4,10}$/.test(formData.zipCode)) {
      newErrors.zipCode = "ZIP code must be numeric.";
    }
    if (!formData.message.trim()) newErrors.message = "Message is required.";
    if (rating === 0) newErrors.rating = "Rating is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    setLoading(true);
    try {
      const payload: any = {
        ...formData,
        rating,
        userId: artist || userId,
      };

      if (albumId) {
        payload.albumId = albumId;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/comment/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Failed to save comment.", {
          style: {
            background: "red",
            border: "none",
            color: "white",
          },
        });
        return;
      }
      fetchComments();

      toast.success("Comment submitted successfully!", {
        style: {
          background: "green",
          border: "none",
          color: "white",
        },
      });

      setFormData({ ...formDataInit });
      setRating(0);
      setHover(0);
      setLoading(false);
      setShow(false);
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Something went wrong.", {
        style: {
          background: "red",
          border: "none",
          color: "white",
        },
      });
    }
  };

  return (
    <div
      className="relative py-20 bg-cover bg-no-repeat mt-20"
      style={{ backgroundImage: `url(${bg1.src})` }}
    >
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="relative z-10 max-w-[1500px] mx-auto px-3">
        <h2 className="text-2xl md:text-4xl font-extrabold text-white text-center pb-10">
          Write Your Comment
        </h2>

        <form onSubmit={handleSubmit} className="space-y-10">
          {chunk(inputFields, 2).map((row, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-10">
              {row.map(({ name, placeholder, type }) => (
                <div key={name} className="w-full">
                  <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={formData[name]}
                    onChange={handleChange}
                    className={`w-full text-[1.1rem] py-3 px-4 outline-none bg-[#222F46] text-white placeholder:text-white/60 ${
                      errors[name] ? "border border-red-500" : ""
                    }`}
                  />
                  {errors[name] && (
                    <p className="text-red-400 text-sm pt-1">{errors[name]}</p>
                  )}
                </div>
              ))}
            </div>
          ))}

          <div>
            <textarea
              name="message"
              placeholder="Type your message*"
              value={formData.message}
              onChange={handleChange}
              className={`w-full min-h-[150px] text-[1.1rem] py-3 px-4 outline-none bg-[#222F46] text-white placeholder:text-white/60 ${
                errors.message ? "border border-red-500" : ""
              }`}
            />
            {errors.message && (
              <p className="text-red-400 text-sm pt-1">{errors.message}</p>
            )}
          </div>

          <div className="text-white bg-[#222F46] p-10 rounded">
            <p className="pb-2 text-center text-lg font-semibold">
              We appreciate your feedback
            </p>

            <div className="flex justify-center items-center gap-4">
              <FaMinusCircle
                size={24}
                className="text-white hover:text-red-400 cursor-pointer"
                title="Clear Rating"
                onClick={() => {
                  setRating(0);
                  setHover(0);
                }}
              />

              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  size={30}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => {
                    setRating(star);
                    setErrors((prev) => ({ ...prev, rating: "" }));
                  }}
                  className={`cursor-pointer transition-colors duration-200 ${
                    star <= (hover || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-white"
                  }`}
                />
              ))}

              <span
                className={`text-sm text-center font-semibold px-3 py-.5 rounded min-w-[70px]
                ${
                  (hover || rating) === 1
                    ? "bg-red-500 text-white"
                    : (hover || rating) === 2
                    ? "bg-yellow-400 text-black"
                    : (hover || rating) === 3
                    ? "bg-sky-400 text-black"
                    : (hover || rating) === 4
                    ? "bg-blue-500 text-white"
                    : (hover || rating) === 5
                    ? "bg-green-500 text-white"
                    : "bg-gray-500 text-white"
                }`}
              >
                {(hover || rating) > 0
                  ? `${hover || rating} Star${(hover || rating) > 1 ? "s" : ""}`
                  : "Not Rated"}
              </span>
            </div>

            {errors.rating && (
              <p className="text-red-400 text-sm text-center pt-2">
                {errors.rating}
              </p>
            )}
          </div>

          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-400 relative hover:bg-cyan-300 w-[10rem] h-[2.70rem] text-black text-lg font-semibold transition-colors"
            >
              {loading ? <ButtonLoading /> : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
