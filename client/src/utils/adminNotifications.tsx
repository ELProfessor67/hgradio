import React from "react";
import { FaBell, FaCheckCircle, FaFileContract, FaGift, FaTimesCircle, FaUserPlus } from "react-icons/fa";
import { MdOutlineLibraryMusic } from "react-icons/md";

/* Shared notification presentation used by the admin TopBar bell and the
   full Notifications page, so both stay in sync. */

export type NotifType =
  // Inbound — a user submitted something the admin must review
  | "album_submitted"
  | "seller_submitted"
  | "seller_resubmitted"
  // Inbound — money arrived, informational
  | "love_gift_received"
  // Outbound — record of an admin decision
  | "album_approved"
  | "album_rejected"
  | "seller_approved"
  | "seller_rejected"
  | "contract_approved"
  | "contract_rejected"
  | "general";

export interface AdminNotification {
  _id: string;
  type: NotifType;
  title: string;
  message: string;
  isRead: boolean;
  requiresAction?: boolean;
  resolvedAt?: string | null;
  refId?: string | null;
  refModel?: "Album" | "User" | "LoveGift" | "Testimonial" | null;
  actorName?: string;
  actorEmail?: string;
  createdAt: string;
}

type Tone = "pending" | "approved" | "rejected" | "money" | "neutral";

const TONE_STYLES: Record<Tone, { bubble: string; text: string; mark: string }> = {
  pending: { bubble: "bg-amber-500/15 text-amber-300", text: "text-amber-300", mark: "!" },
  approved: { bubble: "bg-green-500/15 text-green-300", text: "text-green-300", mark: "✔" },
  rejected: { bubble: "bg-red-500/15 text-red-300", text: "text-red-300", mark: "✕" },
  money: { bubble: "bg-emerald-500/15 text-emerald-300", text: "text-emerald-300", mark: "$" },
  neutral: { bubble: "bg-[#66FCF1]/10 text-[#66FCF1]", text: "text-[#66FCF1]", mark: "●" },
};

const TYPE_TONE: Record<NotifType, Tone> = {
  album_submitted: "pending",
  seller_submitted: "pending",
  seller_resubmitted: "pending",
  love_gift_received: "money",
  album_approved: "approved",
  seller_approved: "approved",
  contract_approved: "approved",
  album_rejected: "rejected",
  seller_rejected: "rejected",
  contract_rejected: "rejected",
  general: "neutral",
};

export const notifTone = (type: NotifType) => TONE_STYLES[TYPE_TONE[type] ?? "neutral"];

export const notifIcon = (type: NotifType, size = 14): React.ReactNode => {
  switch (type) {
    case "album_submitted":
    case "album_approved":
    case "album_rejected":
      return <MdOutlineLibraryMusic size={size + 4} />;
    case "seller_submitted":
    case "seller_resubmitted":
      return <FaUserPlus size={size} />;
    case "love_gift_received":
      return <FaGift size={size} />;
    case "seller_approved":
      return <FaCheckCircle size={size} />;
    case "seller_rejected":
      return <FaTimesCircle size={size} />;
    case "contract_approved":
    case "contract_rejected":
      return <FaFileContract size={size} />;
    default:
      return <FaBell size={size} />;
  }
};

/* A notification is actionable while it points at an item that still needs a
   decision. `requiresAction` is set by the backend on submission events and
   cleared once an admin approves or rejects the item. */
export const needsReview = (n: AdminNotification) =>
  Boolean(n.requiresAction) && !n.resolvedAt;

/* Deep link into the page where the item is reviewed. `focus` makes that page
   open the item's review modal straight away. */
export const reviewLink = (n: AdminNotification, adminId?: string): string | null => {
  if (!adminId || !n.refId) return null;
  const base = `/admin-panel/${adminId}`;
  switch (n.refModel) {
    case "Album":
      return `${base}/albums-approval?focus=${n.refId}`;
    case "User":
      return `${base}/requested-users?focus=${n.refId}`;
    case "LoveGift":
      return `${base}/love-gifts?focus=${n.refId}`;
    case "Testimonial":
      return `${base}/testimonials`;
    default:
      return null;
  }
};

export const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
