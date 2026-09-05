import { Testimonial } from "../models/testimonial.model.js";
import { notifyAdmin } from "./notify.js";



export const TESTIMONY_PREFIX = /^\[TESTIMONY\]/;


export const parseTestimonyComment = (comment = "") => {
  const lines = String(comment).split("\n");
  const fromLine = lines.find((l) => l.trim().toLowerCase().startsWith("from:"));
  const location = fromLine ? fromLine.replace(/^\s*from:\s*/i, "").trim() : "";
  const body = lines
    .filter((l) => !/^\s*\[[^\]]+\]\s*$/.test(l) && l !== fromLine)
    .join("\n")
    .trim();
  return { location, body };
};


export const createPendingTestimony = async ({
  name,
  email = "",
  location = "",
  message,
}) => {
  const testimonial = await Testimonial.create({
    name,
    designation: location,
    message,
    email,
    img: "",
    source: "app",
    approved: false,
  });

  await notifyAdmin({
    type: "testimonial_submitted",
    title: "New testimony submitted",
    message: `${name} shared a testimony`,
    refId: testimonial._id,
    refModel: "Testimonial",
    actorName: name,
    actorEmail: email,
    requiresAction: true,
  });

  return testimonial;
};
