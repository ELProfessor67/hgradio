import User from "../models/user.model.js";

/*
  An artist's handle is the one thing a donor can verify against what the artist
  told them, so the rules live in one place and every path that sets a username
  goes through them: registration, buyer-to-seller upgrade, and the availability
  check the signup form calls while the user types.
*/
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export const USERNAME_RULE =
  "Username must be 3-20 characters, using only lowercase letters, numbers or underscore";

export const normalizeUsername = (value) => String(value || "").trim().toLowerCase();

/*
  Returns { ok } or { ok: false, error }. Callers decide the status code, so this
  stays usable from both a validation path and an availability endpoint.
*/
export const checkUsernameAvailable = async (rawUsername, { excludeUserId } = {}) => {
  const username = normalizeUsername(rawUsername);

  if (!username) return { ok: false, error: "Username is required" };
  if (!USERNAME_PATTERN.test(username)) return { ok: false, error: USERNAME_RULE };

  const query = { username };
  if (excludeUserId) query._id = { $ne: excludeUserId };

  const taken = await User.findOne(query).select("_id");
  if (taken) return { ok: false, error: "That username is already taken" };

  return { ok: true, username };
};
