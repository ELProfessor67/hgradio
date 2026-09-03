import Notification from "../models/notification.model.js";

/*
  Notification helpers.

  A notification with `recipient: null` belongs to the shared admin feed, read by
  every account with role "Admin" — one document per event, not one per admin.
  A notification with a recipient id belongs to that one user.

  Neither helper throws: a failed notification must not fail the action that
  triggered it (an album upload, a signup, a card charge, a payout).
*/

const create = async (doc) => {
  try {
    return await Notification.create(doc);
  } catch (error) {
    console.error("notification create failed:", error?.message || error);
    return null;
  }
};

export const notifyAdmin = ({
  type,
  title,
  message = "",
  refId = null,
  refModel = null,
  actorName = "",
  actorEmail = "",
  requiresAction = false,
}) =>
  create({
    type,
    title,
    message,
    refId,
    refModel,
    actorName,
    actorEmail,
    requiresAction,
    recipient: null,
  });

export const notifyUser = ({
  userId,
  type,
  title,
  message = "",
  refId = null,
  refModel = null,
  actorName = "",
  actorEmail = "",
}) => {
  if (!userId) return Promise.resolve(null);
  return create({
    type,
    title,
    message,
    refId,
    refModel,
    actorName,
    actorEmail,
    requiresAction: false,
    recipient: userId,
  });
};

/*
  Marks the "needs review" admin notifications for an item as handled once it has
  been approved or rejected, so the pending badge stays accurate even when the
  decision was made from an approvals page rather than the notification feed.
*/
export const resolveAdminNotifications = async (refId, refModel) => {
  try {
    if (!refId) return;
    await Notification.updateMany(
      { refId, refModel, recipient: null, requiresAction: true, resolvedAt: null },
      { resolvedAt: new Date(), isRead: true }
    );
  } catch (error) {
    console.error("resolveAdminNotifications failed:", error?.message || error);
  }
};
