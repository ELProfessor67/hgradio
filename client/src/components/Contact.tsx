/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { ButtonLoading } from "@/utils/Loading";
import { useState } from "react";
import { toast } from "sonner";

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  comment: string;
  agree: boolean;
}

const ContactForm = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    comment: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    const isCheckbox = type === "checkbox";
    const newValue = isCheckbox
      ? (e.target as HTMLInputElement).checked
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // Basic email validation regex
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
setLoading(true)
    // Validation checks with toast errors
    if (!formData.firstName.trim()) {
      toast.error("First name is required.",{
                style: {
                  background: "red",
                  border : "none",
                  color : "white"
                },
              });
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last name is required.",{
                style: {
                  background: "red",
                  border : "none",
                  color : "white"
                },
              });
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required.",{
                style: {
                  background: "red",
                  border : "none",
                  color : "white"
                },
              });
      return;
    }
    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address.",{
                style: {
                  background: "red",
                  border : "none",
                  color : "white"
                },
              });
      return;
    }
    if (!formData.comment.trim()) {
      toast.error("Comment is required.",{
                style: {
                  background: "red",
                  border : "none",
                  color : "white"
                },
              });
      return;
    }
    if (!formData.agree) {
      toast.error("You must agree to the Privacy Terms.",{
                style: {
                  background: "red",
                  border : "none",
                  color : "white"
                },
              });
      return;
    }

    const { agree, ...payload } = formData;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Something went wrong",{
                style: {
                  background: "red",
                  border : "none",
                  color : "white"
                },
              });
        return;
      }

      toast.success("Message sent successfully!",{
                style: {
                  background: "green",
                  border : "none",
                  color : "white"
                },
              });

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        comment: "",
        agree: false,
      });
    } catch (err) {
      toast.error("Failed to send message",{
                style: {
                  background: "red",
                  border : "none",
                  color : "white"
                },
              });
    }finally{
      setLoading(false)
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          name="firstName"
          placeholder="Your First Name"
          value={formData.firstName}
          onChange={handleChange}
          className="text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full"
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Your Last Name"
          value={formData.lastName}
          onChange={handleChange}
          className="text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full"
          required
        />
      </div>

      <input
        type="email"
        name="email"
        placeholder="Your Email"
        value={formData.email}
        onChange={handleChange}
        className="text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full"
        required
      />

      <textarea
        rows={5}
        name="comment"
        placeholder="Write a comment"
        value={formData.comment}
        onChange={handleChange}
        className="text-[1.1rem] py-3 px-4 outline-none bg-[#d9d9d9]/10 w-full"
        required
      />

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          name="agree"
          checked={formData.agree}
          onChange={handleChange}
          className="form-checkbox h-5 w-5 text-blue-600"
          required
        />
        <span>I have read and agree to the Privacy Terms.</span>
      </label>

      <div className="flex justify-center pt-[1rem]">
        <button
          type="submit"
          disabled={loading}
          className="bg-second relative w-[10rem] h-[2.70rem] text-[#000] font-semibold"
        >
         {loading ? <ButtonLoading /> : " Submit"}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
