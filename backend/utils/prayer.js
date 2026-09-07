import { PrayerRequest } from "../models/prayerRequest.model.js";
import { notifyAdmin } from "./notify.js";

/*
  Prayer request helpers.

  The parsing half exists only for app builds already on people's phones: those
  send prayer requests to POST /api/contact as a tagged comment string. The
  contact controller hands them here so they land in the PrayerRequest
  collection like every new submission, rather than sitting in the contact
  inbox where the sharing choice does nothing.
*/

export const PRAYER_PREFIX = /^\[PRAYER REQUEST\]/;

/*
  The line the old app wrote for the sender's choice, e.g.

    VISIBILITY: MAY BE SHARED PUBLICLY (sender gave permission)

  Anything that is not clearly a permission to share is read as private — an
  unparseable line must not publish someone's request.
*/
const PUBLIC_LINE = /^\s*visibility:.*(may be shared|shared publicly|public)/i;
const PHONE_LINE = /^\s*phone:\s*/i;

/** "[PRAYER REQUEST]\nVISIBILITY: …\nPhone: …\n\n<body>" -> its parts */
export const parsePrayerComment = (comment = "") => {
  const lines = String(comment).split("\n");

  const visibility = lines.some((l) => PUBLIC_LINE.test(l)) ? "public" : "private";
  const phoneLine = lines.find((l) => PHONE_LINE.test(l));
  const phone = phoneLine ? phoneLine.replace(PHONE_LINE, "").trim() : "";

  const message = lines
    .filter(
      (l) =>
        // Drop the "[PRAYER REQUEST]" tag line, the visibility line and the
        // phone line; whatever is left is what the sender actually wrote.
        !/^\s*\[[^\]]+\]\s*$/.test(l) &&
        !/^\s*visibility:/i.test(l) &&
        l !== phoneLine
    )
    .join("\n")
    .trim();

  return { visibility, phone, message };
};

/**
 * Store a prayer request and tell the admin about it.
 *
 * Every request is announced, not just the public ones: a private request
 * still needs the prayer team to see it. `requiresAction` is set only for
 * public ones, because those are the ones with a decision waiting — a private
 * request has nothing to approve.
 */
export const createPrayerRequest = async ({
  name,
  email = "",
  phone = "",
  message,
  visibility = "private",
  source = "app",
}) => {
  // Fail closed: only the exact string "public" opts a request into review.
  const wantsPublic = visibility === "public";

  const prayer = await PrayerRequest.create({
    name,
    email,
    phone,
    message,
    visibility: wantsPublic ? "public" : "private",
    approved: false,
    source: source === "web" ? "web" : "app",
  });

  await notifyAdmin({
    type: "prayer_request_submitted",
    title: wantsPublic ? "Prayer request to review" : "New prayer request",
    message: wantsPublic
      ? `${name} asked for prayer and gave permission to share it`
      : `${name} asked for prayer — prayer team only`,
    refId: prayer._id,
    refModel: "PrayerRequest",
    actorName: name,
    actorEmail: email,
    requiresAction: wantsPublic,
  });

  return prayer;
};
